DROP POLICY IF EXISTS "Members read comments" ON public.community_comments;
CREATE POLICY "Shared or own comments are readable"
ON public.community_comments
FOR SELECT
TO anon, authenticated
USING (
  deleted_at IS NULL
  AND (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.workouts w
      WHERE w.id = workout_id
        AND (
          w.user_id = auth.uid()
          OR (w.is_shared = true AND w.community_hidden = false)
        )
    )
  )
);