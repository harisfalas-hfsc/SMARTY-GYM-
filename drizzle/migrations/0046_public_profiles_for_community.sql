-- Replace direct public access to the sensitive profiles table with a dedicated
-- public-safe table that only stores display_name and avatar_url. The community
-- views are updated to join this table instead of profiles.

CREATE TABLE IF NOT EXISTS public.public_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT ALL ON public.public_profiles TO service_role;

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are readable" ON public.public_profiles;
CREATE POLICY "Public profiles are readable"
ON public.public_profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Sync public_profiles whenever a profile changes.
CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.public_profiles (user_id, display_name, avatar_url, updated_at)
  VALUES (NEW.id, NEW.display_name, NEW.avatar_url, now())
  ON CONFLICT (user_id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_public_profile ON public.profiles;
CREATE TRIGGER trg_sync_public_profile
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_public_profile();

-- Backfill existing profiles.
INSERT INTO public.public_profiles (user_id, display_name, avatar_url, updated_at)
SELECT id, display_name, avatar_url, now()
FROM public.profiles
ON CONFLICT (user_id) DO UPDATE
SET display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

-- Update community views to read public profile data from the safe table.
CREATE OR REPLACE VIEW public.community_workouts_public AS
SELECT w.id,
    w.name,
    w.category,
    w.format,
    w.focus,
    w.difficulty_stars,
    w.duration_min,
    w.equipment,
    w.location,
    w.image_url,
    w.description,
    w.shared_at,
    w.user_id AS creator_id,
    p.display_name AS creator_name,
    p.avatar_url AS creator_avatar,
    COALESCE(up.score, 0) AS creator_score,
    COALESCE(up.current_streak, 0) AS creator_streak,
    COALESCE(up.workouts_completed, 0) AS creator_completed,
    COALESCE(up.workouts_generated, 0) AS creator_generated,
    COALESCE(r.likes, 0::bigint) AS likes,
    COALESCE(r.dislikes, 0::bigint) AS dislikes,
    COALESCE(c.comments_count, 0::bigint) AS comments_count,
    COALESCE(cc.completions, 0::bigint) AS completions,
    COALESCE(cc.unique_users, 0::bigint) AS unique_completions,
    w.created_by,
    w.is_wod,
    w.wod_date,
    COALESCE(rt.rating_avg, 0::numeric) AS rating_avg,
    COALESCE(rt.rating_count, 0::bigint) AS rating_count
FROM workouts w
JOIN public.public_profiles p ON p.user_id = w.user_id
LEFT JOIN user_progress up ON up.user_id = w.user_id
LEFT JOIN LATERAL ( SELECT count(*) FILTER (WHERE cr.value = 1) AS likes,
            count(*) FILTER (WHERE cr.value = '-1'::integer) AS dislikes
           FROM community_reactions cr
          WHERE cr.workout_id = w.id) r ON true
LEFT JOIN LATERAL ( SELECT count(*) AS comments_count
           FROM community_comments cm
          WHERE cm.workout_id = w.id AND cm.deleted_at IS NULL) c ON true
LEFT JOIN LATERAL ( SELECT count(*) AS completions,
            count(DISTINCT co.user_id) AS unique_users
           FROM community_completions co
          WHERE co.workout_id = w.id) cc ON true
LEFT JOIN LATERAL ( SELECT round(avg(ra.value), 2) AS rating_avg,
            count(*) AS rating_count
           FROM community_ratings ra
          WHERE ra.workout_id = w.id) rt ON true
WHERE w.is_shared AND NOT w.community_hidden;

CREATE OR REPLACE VIEW public.community_members_public AS
SELECT p.user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(up.score, 0) AS score,
    COALESCE(up.current_streak, 0) AS current_streak,
    COALESCE(up.longest_streak, 0) AS longest_streak,
    COALESCE(up.workouts_completed, 0) AS workouts_completed,
    COALESCE(up.workouts_generated, 0) AS workouts_generated,
    COALESCE(up.subscription_months, 0) AS subscription_months,
    COALESCE(up.badge_points, 0) AS badge_points,
    COALESCE(s.shared_count, 0::bigint) AS workouts_shared,
    COALESCE(s.received_completions, 0::numeric) AS received_completions,
    COALESCE(s.received_likes, 0::numeric) AS received_likes,
    COALESCE(s.received_comments, 0::numeric) AS received_comments
FROM public.public_profiles p
LEFT JOIN user_progress up ON up.user_id = p.user_id
LEFT JOIN LATERAL ( SELECT count(*) AS shared_count,
            COALESCE(sum(v.completions), 0::numeric) AS received_completions,
            COALESCE(sum(v.likes), 0::numeric) AS received_likes,
            COALESCE(sum(v.comments_count), 0::numeric) AS received_comments
           FROM community_workouts_public v
          WHERE v.creator_id = p.user_id) s ON true;

CREATE OR REPLACE VIEW public.community_comments_public AS
SELECT cm.id,
    cm.workout_id,
    cm.user_id,
    cm.body,
    cm.created_at,
    p.display_name AS author_name,
    p.avatar_url AS author_avatar
FROM community_comments cm
JOIN public.public_profiles p ON p.user_id = cm.user_id
JOIN workouts w ON w.id = cm.workout_id
WHERE cm.deleted_at IS NULL AND w.is_shared AND NOT w.community_hidden;

-- Re-grant SELECT on the redefined views.
REVOKE ALL ON public.community_workouts_public FROM anon, authenticated;
GRANT SELECT ON public.community_workouts_public TO anon, authenticated;
REVOKE ALL ON public.community_members_public FROM anon, authenticated;
GRANT SELECT ON public.community_members_public TO anon, authenticated;
REVOKE ALL ON public.community_comments_public FROM anon, authenticated;
GRANT SELECT ON public.community_comments_public TO anon, authenticated;
REVOKE ALL ON public.community_badges_public FROM anon, authenticated;
GRANT SELECT ON public.community_badges_public TO anon, authenticated;

-- Remove the overly broad policy that exposed all profile columns publicly.
DROP POLICY IF EXISTS "Public member profiles are readable" ON public.profiles;