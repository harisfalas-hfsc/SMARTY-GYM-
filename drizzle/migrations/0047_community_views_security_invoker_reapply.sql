-- Re-apply security_invoker after the views were recreated in the previous migration.
ALTER VIEW public.community_workouts_public SET (security_invoker = true);
ALTER VIEW public.community_members_public SET (security_invoker = true);
ALTER VIEW public.community_comments_public SET (security_invoker = true);