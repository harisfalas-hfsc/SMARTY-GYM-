CREATE TABLE public.partner_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  instagram text,
  tiktok text,
  youtube text,
  country text,
  niche text,
  followers text,
  status text NOT NULL DEFAULT 'to_contact',
  notes text,
  partner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_contacts TO authenticated;
GRANT ALL ON public.partner_contacts TO service_role;
ALTER TABLE public.partner_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage partner contacts" ON public.partner_contacts FOR ALL TO authenticated
  USING (public.is_app_admin(auth.uid())) WITH CHECK (public.is_app_admin(auth.uid()));

CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  code text NOT NULL UNIQUE,
  user_id uuid UNIQUE,
  instagram text,
  tiktok text,
  status text NOT NULL DEFAULT 'active',
  share_rate numeric NOT NULL DEFAULT 0.5,
  vat_rate numeric NOT NULL DEFAULT 0.19,
  click_count integer NOT NULL DEFAULT 0,
  media_kit_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage partners" ON public.partners FOR ALL TO authenticated
  USING (public.is_app_admin(auth.uid())) WITH CHECK (public.is_app_admin(auth.uid()));
CREATE POLICY "Partner reads own partner row" ON public.partners FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.partner_referrals (
  user_id uuid PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX partner_referrals_partner_idx ON public.partner_referrals(partner_id);
GRANT SELECT ON public.partner_referrals TO authenticated;
GRANT ALL ON public.partner_referrals TO service_role;
ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read referrals" ON public.partner_referrals FOR SELECT TO authenticated
  USING (public.is_app_admin(auth.uid()));

CREATE TABLE public.partner_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  invoice_id text NOT NULL,
  subscription_id text,
  kind text NOT NULL DEFAULT 'renewal',
  gross_cents integer NOT NULL,
  net_cents integer NOT NULL,
  commission_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'eur',
  environment text NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (invoice_id, environment)
);
CREATE INDEX partner_commissions_partner_idx ON public.partner_commissions(partner_id, paid_at DESC);
GRANT SELECT ON public.partner_commissions TO authenticated;
GRANT ALL ON public.partner_commissions TO service_role;
ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read commissions" ON public.partner_commissions FOR SELECT TO authenticated
  USING (public.is_app_admin(auth.uid()));
CREATE POLICY "Partner reads own commissions" ON public.partner_commissions FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE TABLE public.partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  method text NOT NULL,
  reference text,
  receipt_number text NOT NULL UNIQUE,
  period_label text,
  notes text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_payouts TO authenticated;
GRANT ALL ON public.partner_payouts TO service_role;
ALTER TABLE public.partner_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read payouts" ON public.partner_payouts FOR SELECT TO authenticated
  USING (public.is_app_admin(auth.uid()));
CREATE POLICY "Partner reads own payouts" ON public.partner_payouts FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.record_partner_click(p_code text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.partners SET click_count = click_count + 1
  WHERE code = lower(p_code) AND status = 'active';
$$;
REVOKE ALL ON FUNCTION public.record_partner_click(text) FROM public;
GRANT EXECUTE ON FUNCTION public.record_partner_click(text) TO anon, authenticated, service_role;