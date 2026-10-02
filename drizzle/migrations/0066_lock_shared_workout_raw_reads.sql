-- Visitors see shared workouts only through the safe-column community views.
ALTER VIEW public.community_workouts_public SET (security_invoker = false);
ALTER VIEW public.community_comments_public SET (security_invoker = false);
GRANT SELECT ON public.community_workouts_public TO anon, authenticated;
GRANT SELECT ON public.community_comments_public TO anon, authenticated;

DROP POLICY IF EXISTS "Public shared workouts are readable" ON public.workouts;
CREATE POLICY "Members read shared workouts" ON public.workouts FOR SELECT TO authenticated
  USING (is_shared = true AND community_hidden = false AND public.has_active_membership(auth.uid()));