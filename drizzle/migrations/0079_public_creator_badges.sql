ALTER VIEW public.community_badges_public SET (security_invoker = false);
GRANT SELECT ON public.community_badges_public TO anon, authenticated;