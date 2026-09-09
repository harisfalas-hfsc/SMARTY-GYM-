-- Replace direct public access to user_progress with a dedicated public-safe table
-- that only stores community-visible stats. The community views are updated to
-- join this table instead of user_progress.

CREATE TABLE IF NOT EXISTS public.public_user_progress (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  workouts_completed integer NOT NULL DEFAULT 0,
  workouts_generated integer NOT NULL DEFAULT 0,
  subscription_months integer NOT NULL DEFAULT 0,
  badge_points integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.public_user_progress TO anon, authenticated;
GRANT ALL ON public.public_user_progress TO service_role;

ALTER TABLE public.public_user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public user progress is readable" ON public.public_user_progress;
CREATE POLICY "Public user progress is readable"
ON public.public_user_progress
FOR SELECT
TO anon, authenticated
USING (true);

-- Sync public_user_progress whenever progress changes.
CREATE OR REPLACE FUNCTION public.sync_public_user_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.public_user_progress (
    user_id, score, current_streak, longest_streak,
    workouts_completed, workouts_generated, subscription_months, badge_points, updated_at
  )
  VALUES (
    NEW.user_id, NEW.score, NEW.current_streak, NEW.longest_streak,
    NEW.workouts_completed, NEW.workouts_generated, NEW.subscription_months, NEW.badge_points, now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET score = EXCLUDED.score,
      current_streak = EXCLUDED.current_streak,
      longest_streak = EXCLUDED.longest_streak,
      workouts_completed = EXCLUDED.workouts_completed,
      workouts_generated = EXCLUDED.workouts_generated,
      subscription_months = EXCLUDED.subscription_months,
      badge_points = EXCLUDED.badge_points,
      updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_public_user_progress ON public.user_progress;
CREATE TRIGGER trg_sync_public_user_progress
AFTER INSERT OR UPDATE ON public.user_progress
FOR EACH ROW EXECUTE FUNCTION public.sync_public_user_progress();

-- Backfill existing progress.
INSERT INTO public.public_user_progress (
  user_id, score, current_streak, longest_streak,
  workouts_completed, workouts_generated, subscription_months, badge_points, updated_at
)
SELECT user_id, score, current_streak, longest_streak,
       workouts_completed, workouts_generated, subscription_months, badge_points, now()
FROM public.user_progress
ON CONFLICT (user_id) DO UPDATE
SET score = EXCLUDED.score,
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    workouts_completed = EXCLUDED.workouts_completed,
    workouts_generated = EXCLUDED.workouts_generated,
    subscription_months = EXCLUDED.subscription_months,
    badge_points = EXCLUDED.badge_points,
    updated_at = now();

-- Update community views to read public progress stats from the safe table.
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
LEFT JOIN public.public_user_progress up ON up.user_id = w.user_id
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
LEFT JOIN public.public_user_progress up ON up.user_id = p.user_id
LEFT JOIN LATERAL ( SELECT count(*) AS shared_count,
            COALESCE(sum(v.completions), 0::numeric) AS received_completions,
            COALESCE(sum(v.likes), 0::numeric) AS received_likes,
            COALESCE(sum(v.comments_count), 0::numeric) AS received_comments
           FROM community_workouts_public v
          WHERE v.creator_id = p.user_id) s ON true;

-- Re-grant SELECT on the redefined views.
REVOKE ALL ON public.community_workouts_public FROM anon, authenticated;
GRANT SELECT ON public.community_workouts_public TO anon, authenticated;
REVOKE ALL ON public.community_members_public FROM anon, authenticated;
GRANT SELECT ON public.community_members_public TO anon, authenticated;

-- Re-apply security_invoker because the views were recreated.
ALTER VIEW public.community_workouts_public SET (security_invoker = true);
ALTER VIEW public.community_members_public SET (security_invoker = true);

-- Remove the overly broad policy that exposed all user_progress rows publicly.
DROP POLICY IF EXISTS "Public member progress is readable" ON public.user_progress;