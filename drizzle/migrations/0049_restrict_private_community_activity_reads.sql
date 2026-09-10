DROP POLICY IF EXISTS "Members read completions" ON public.community_completions;
DROP POLICY IF EXISTS "Public completions on shared workouts are readable" ON public.community_completions;
CREATE POLICY "Shared or own completions are readable"
ON public.community_completions
FOR SELECT
TO anon, authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.workouts w
    WHERE w.id = workout_id
      AND w.is_shared = true
      AND w.community_hidden = false
  )
);

DROP POLICY IF EXISTS "Members read reactions" ON public.community_reactions;
DROP POLICY IF EXISTS "Public reactions on shared workouts are readable" ON public.community_reactions;
CREATE POLICY "Shared or own reactions are readable"
ON public.community_reactions
FOR SELECT
TO anon, authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.workouts w
    WHERE w.id = workout_id
      AND w.is_shared = true
      AND w.community_hidden = false
  )
);

DROP POLICY IF EXISTS "Ratings are readable by everyone" ON public.community_ratings;
CREATE POLICY "Shared or own ratings are readable"
ON public.community_ratings
FOR SELECT
TO anon, authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.workouts w
    WHERE w.id = workout_id
      AND w.is_shared = true
      AND w.community_hidden = false
  )
);