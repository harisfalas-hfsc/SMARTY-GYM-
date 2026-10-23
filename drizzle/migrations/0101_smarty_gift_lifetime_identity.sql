CREATE TABLE public.premium_user_history (user_id uuid PRIMARY KEY, first_premium_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.premium_user_history TO service_role;
ALTER TABLE public.premium_user_history ENABLE ROW LEVEL SECURITY;
INSERT INTO public.premium_user_history(user_id) SELECT DISTINCT user_id FROM public.subscriptions UNION SELECT recipient_id FROM public.smarty_gifts WHERE claimed_at IS NOT NULL AND recipient_id IS NOT NULL ON CONFLICT DO NOTHING;
INSERT INTO public.premium_email_history(email) SELECT DISTINCT lower(trim(u.email)) FROM auth.users u JOIN public.premium_user_history h ON h.user_id=u.id WHERE u.email IS NOT NULL AND trim(u.email)<>'' ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION public.track_premium_email() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.status IN ('active','trialing','past_due','paused','canceled','unpaid') THEN
  INSERT INTO public.premium_user_history(user_id) VALUES(NEW.user_id) ON CONFLICT DO NOTHING;
  INSERT INTO public.premium_email_history(email) SELECT lower(trim(email)) FROM auth.users WHERE id=NEW.user_id AND email IS NOT NULL AND trim(email)<>'' ON CONFLICT DO NOTHING;
  INSERT INTO public.premium_email_history(email) SELECT lower(trim(email)) FROM public.profiles WHERE id=NEW.user_id AND email IS NOT NULL AND trim(email)<>'' ON CONFLICT DO NOTHING;
 END IF; RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.track_premium_email_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.premium_user_history WHERE user_id=NEW.id UNION ALL SELECT 1 FROM public.subscriptions WHERE user_id=NEW.id UNION ALL SELECT 1 FROM public.smarty_gifts WHERE recipient_id=NEW.id AND claimed_at IS NOT NULL) THEN
  IF NEW.email IS NOT NULL AND trim(NEW.email)<>'' THEN INSERT INTO public.premium_email_history(email) VALUES(lower(trim(NEW.email))) ON CONFLICT DO NOTHING; END IF;
  IF TG_OP='UPDATE' AND OLD.email IS NOT NULL AND trim(OLD.email)<>'' THEN INSERT INTO public.premium_email_history(email) VALUES(lower(trim(OLD.email))) ON CONFLICT DO NOTHING; END IF;
 END IF; RETURN NEW;
END; $$;
CREATE TRIGGER profiles_track_premium_insert AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.track_premium_email_change();
CREATE FUNCTION public.track_claimed_gift_identity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.claimed_at IS NOT NULL AND NEW.recipient_id IS NOT NULL THEN
  INSERT INTO public.premium_user_history(user_id) VALUES(NEW.recipient_id) ON CONFLICT DO NOTHING;
  INSERT INTO public.premium_email_history(email) VALUES(NEW.recipient_email) ON CONFLICT DO NOTHING;
 END IF; RETURN NEW;
END; $$;
CREATE TRIGGER gifts_track_premium_identity AFTER INSERT OR UPDATE ON public.smarty_gifts FOR EACH ROW EXECUTE FUNCTION public.track_claimed_gift_identity();
CREATE FUNCTION public.validate_gift_buyer_access() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=NEW.buyer_id AND environment='live' AND status IN ('active','trialing') AND (current_period_end IS NULL OR current_period_end>now()) UNION ALL SELECT 1 FROM public.smarty_gifts WHERE recipient_id=NEW.buyer_id AND environment='live' AND status='claimed' AND premium_ends_at>now()) THEN RAISE EXCEPTION 'Only active Premium members can buy Smarty Gift.'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER gifts_validate_buyer BEFORE INSERT ON public.smarty_gifts FOR EACH ROW EXECUTE FUNCTION public.validate_gift_buyer_access();