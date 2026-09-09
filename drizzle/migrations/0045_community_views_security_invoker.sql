-- Set community views to use invoker privileges instead of owner (postgres) privileges.
-- This removes the security-definer behavior while keeping the views in place.

ALTER VIEW public.community_workouts_public SET (security_invoker = true);
ALTER VIEW public.community_members_public SET (security_invoker = true);
ALTER VIEW public.community_comments_public SET (security_invoker = true);
ALTER VIEW public.community_badges_public SET (security_invoker = true);