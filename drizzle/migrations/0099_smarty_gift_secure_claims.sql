CREATE TABLE public.smarty_gifts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id uuid NOT NULL, buyer_email text NOT NULL, sender_name text NOT NULL, recipient_name text NOT NULL, recipient_email text NOT NULL, personal_message text NOT NULL, environment text NOT NULL CHECK(environment IN ('sandbox','live')), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','claimed','released','refunded')), claim_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE, checkout_session_id text UNIQUE, payment_intent_id text, paid_at timestamptz, claimed_at timestamptz, recipient_id uuid, premium_ends_at timestamptz, next_reminder_at timestamptz, reminder_number integer NOT NULL DEFAULT 0, reminders_stopped boolean NOT NULL DEFAULT false, recipient_delivered_at timestamptz, buyer_delivered_at timestamptz, welcome_sent_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (length(personal_message) <= 300), CHECK(recipient_email=lower(trim(recipient_email))), CHECK(buyer_email <> recipient_email)
);
GRANT SELECT ON public.smarty_gifts TO authenticated;
GRANT ALL ON public.smarty_gifts TO service_role;
ALTER TABLE public.smarty_gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY gift_owner_read ON public.smarty_gifts FOR SELECT TO authenticated USING (buyer_id=auth.uid() OR recipient_id=auth.uid());
CREATE UNIQUE INDEX smarty_gifts_one_recipient ON public.smarty_gifts(recipient_email) WHERE status <> 'released';
CREATE INDEX smarty_gifts_reminders ON public.smarty_gifts(next_reminder_at) WHERE status='paid' AND NOT reminders_stopped;
CREATE TABLE public.premium_email_history (email text PRIMARY KEY, first_premium_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.premium_email_history TO service_role;
ALTER TABLE public.premium_email_history ENABLE ROW LEVEL SECURITY;
INSERT INTO public.premium_email_history(email) SELECT DISTINCT lower(trim(p.email)) FROM public.subscriptions s JOIN public.profiles p ON p.id=s.user_id WHERE p.email IS NOT NULL AND trim(p.email)<>'' ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION public.track_premium_email() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.status IN ('active','trialing','past_due','paused','canceled','unpaid') THEN
  INSERT INTO public.premium_email_history(email) SELECT lower(trim(email)) FROM public.profiles WHERE id=NEW.user_id AND email IS NOT NULL AND trim(email)<>'' ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER subscriptions_track_premium AFTER INSERT OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.track_premium_email();
CREATE OR REPLACE FUNCTION public.track_premium_email_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.email IS NOT NULL AND EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=NEW.id UNION ALL SELECT 1 FROM public.smarty_gifts WHERE recipient_id=NEW.id AND claimed_at IS NOT NULL) THEN
  INSERT INTO public.premium_email_history(email) VALUES(lower(trim(NEW.email))) ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER profiles_track_premium_email AFTER UPDATE OF email ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.track_premium_email_change();
CREATE OR REPLACE FUNCTION public.reserve_smarty_gift(p_buyer uuid,p_buyer_email text,p_sender text,p_name text,p_email text,p_message text,p_env text) RETURNS public.smarty_gifts LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE g public.smarty_gifts; e text := lower(trim(p_email));
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(e,0));
 IF EXISTS(SELECT 1 FROM public.app_settings WHERE key='free_access_mode' AND value='true'::jsonb) THEN RAISE EXCEPTION 'No purchase is required while free access is enabled.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=p_buyer AND status IN ('active','trialing') AND (current_period_end IS NULL OR current_period_end>now()) UNION ALL SELECT 1 FROM public.smarty_gifts WHERE recipient_id=p_buyer AND status='claimed' AND premium_ends_at>now()) THEN RAISE EXCEPTION 'Only active Premium members can buy Smarty Gift.'; END IF;
 IF e=lower(trim(p_buyer_email)) THEN RAISE EXCEPTION 'You cannot send Smarty Gift to yourself.'; END IF;
 IF EXISTS(SELECT 1 FROM public.premium_email_history WHERE email=e) OR EXISTS(SELECT 1 FROM public.profiles p JOIN public.subscriptions s ON s.user_id=p.id WHERE lower(trim(p.email))=e) THEN RAISE EXCEPTION 'Smarty Gift is only for someone who has never held Premium.'; END IF;
 IF EXISTS(SELECT 1 FROM public.smarty_gifts WHERE recipient_email=e AND status<>'released') THEN RAISE EXCEPTION 'This recipient already has a gift or a payment in progress.'; END IF;
 INSERT INTO public.smarty_gifts(buyer_id,buyer_email,sender_name,recipient_name,recipient_email,personal_message,environment) VALUES(p_buyer,lower(trim(p_buyer_email)),p_sender,p_name,e,p_message,p_env) RETURNING * INTO g;
 RETURN g;
END; $$;
REVOKE ALL ON FUNCTION public.reserve_smarty_gift(uuid,text,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_smarty_gift(uuid,text,text,text,text,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.claim_smarty_gift(p_token uuid,p_user uuid,p_email text) RETURNS public.smarty_gifts LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE g public.smarty_gifts; e text := lower(trim(p_email));
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(e,0));
 SELECT * INTO g FROM public.smarty_gifts WHERE claim_token=p_token FOR UPDATE;
 IF g.id IS NULL OR g.recipient_email<>e THEN RAISE EXCEPTION 'Sign in with the email address that received this gift.'; END IF;
 IF g.status='claimed' AND g.recipient_id=p_user THEN RETURN g; END IF;
 IF g.status<>'paid' THEN RAISE EXCEPTION 'This gift is not ready to activate.'; END IF;
 IF EXISTS(SELECT 1 FROM public.premium_email_history WHERE email=e) OR EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=p_user) OR EXISTS(SELECT 1 FROM public.smarty_gifts WHERE recipient_id=p_user AND claimed_at IS NOT NULL) THEN RAISE EXCEPTION 'Smarty Gift is only for someone who has never held Premium.'; END IF;
 UPDATE public.smarty_gifts SET status='claimed',recipient_id=p_user,claimed_at=now(),premium_ends_at=now()+interval '30 days',next_reminder_at=NULL,reminders_stopped=true,updated_at=now() WHERE id=g.id RETURNING * INTO g;
 INSERT INTO public.premium_email_history(email) VALUES(e) ON CONFLICT DO NOTHING;
 RETURN g;
END; $$;
REVOKE ALL ON FUNCTION public.claim_smarty_gift(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_smarty_gift(uuid,uuid,text) TO service_role;
CREATE OR REPLACE FUNCTION public.has_active_membership(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT _user_id IS NOT NULL AND (
 EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role='admin')
 OR EXISTS(SELECT 1 FROM public.app_settings WHERE key='free_access_mode' AND value='true'::jsonb)
 OR EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=_user_id AND status IN ('active','trialing') AND (current_period_end IS NULL OR current_period_end>now()))
 OR EXISTS(SELECT 1 FROM public.smarty_gifts WHERE recipient_id=_user_id AND status='claimed' AND premium_ends_at>now())
 ); $$;