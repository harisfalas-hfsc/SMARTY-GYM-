ALTER TABLE public.smarty_gifts ADD COLUMN reminder_lease_until timestamptz, ADD COLUMN reminder_email_sent_number integer;
CREATE OR REPLACE FUNCTION public.claim_smarty_gift(p_token uuid,p_user uuid,p_email text) RETURNS public.smarty_gifts LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE g public.smarty_gifts; e text := lower(trim(p_email));
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(e,0));
 SELECT * INTO g FROM public.smarty_gifts WHERE claim_token=p_token FOR UPDATE;
 IF g.id IS NULL OR g.recipient_email<>e THEN RAISE EXCEPTION 'Sign in with the email address that received this gift.'; END IF;
 IF g.environment='sandbox' AND NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_user AND role='admin') THEN RAISE EXCEPTION 'Test gifts cannot activate a real membership.'; END IF;
 IF g.status='claimed' AND g.recipient_id=p_user THEN RETURN g; END IF;
 IF g.status<>'paid' THEN RAISE EXCEPTION 'This gift is not ready to activate.'; END IF;
 IF EXISTS(SELECT 1 FROM public.premium_email_history WHERE email=e) OR EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=p_user) OR EXISTS(SELECT 1 FROM public.smarty_gifts WHERE recipient_id=p_user AND claimed_at IS NOT NULL) OR EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_user AND role='admin') THEN RAISE EXCEPTION 'Smarty Gift is only for someone who has never held Premium.'; END IF;
 UPDATE public.smarty_gifts SET status='claimed',recipient_id=p_user,claimed_at=now(),premium_ends_at=now()+interval '30 days',next_reminder_at=NULL,reminders_stopped=true,updated_at=now() WHERE id=g.id RETURNING * INTO g;
 INSERT INTO public.premium_email_history(email) VALUES(e) ON CONFLICT DO NOTHING;
 RETURN g;
END; $$;
CREATE OR REPLACE FUNCTION public.has_active_membership(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT _user_id IS NOT NULL AND (
 EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role='admin')
 OR EXISTS(SELECT 1 FROM public.app_settings WHERE key='free_access_mode' AND value='true'::jsonb)
 OR EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=_user_id AND status IN ('active','trialing') AND (current_period_end IS NULL OR current_period_end>now()))
 OR EXISTS(SELECT 1 FROM public.smarty_gifts WHERE recipient_id=_user_id AND environment='live' AND status='claimed' AND premium_ends_at>now())
 ); $$;