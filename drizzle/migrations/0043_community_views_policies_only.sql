-- Add public-read RLS policies for community views (ownership change attempted separately).

DROP POLICY IF EXISTS "Public shared workouts are readable" ON public.workouts;
CREATE POLICY "Public shared workouts are readable"
ON public.workouts
FOR SELECT
TO anon, authenticated
USING (is_shared = true AND community_hidden = false);

DROP POLICY IF EXISTS "Public member profiles are readable" ON public.profiles;
CREATE POLICY "Public member profiles are readable"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public member progress is readable" ON public.user_progress;
CREATE POLICY "Public member progress is readable"
ON public.user_progress
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public comments on shared workouts are readable" ON public.community_comments;
CREATE POLICY "Public comments on shared workouts are readable"
ON public.community_comments
FOR SELECT
TO anon
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_id AND w.is_shared AND NOT w.community_hidden
  )
);

DROP POLICY IF EXISTS "Public reactions on shared workouts are readable" ON public.community_reactions;
CREATE POLICY "Public reactions on shared workouts are readable"
ON public.community_reactions
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_id AND w.is_shared AND NOT w.community_hidden
  )
);

DROP POLICY IF EXISTS "Public completions on shared workouts are readable" ON public.community_completions;
CREATE POLICY "Public completions on shared workouts are readable"
ON public.community_completions
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_id AND w.is_shared AND NOT w.community_hidden
  )
);

REVOKE ALL ON public.community_workouts_public FROM anon, authenticated;
GRANT SELECT ON public.community_workouts_public TO anon, authenticated;

REVOKE ALL ON public.community_members_public FROM anon, authenticated;
GRANT SELECT ON public.community_members_public TO anon, authenticated;

REVOKE ALL ON public.community_comments_public FROM anon, authenticated;
GRANT SELECT ON public.community_comments_public TO anon, authenticated;

REVOKE ALL ON public.community_badges_public FROM anon, authenticated;
GRANT SELECT ON public.community_badges_public TO anon, authenticated;