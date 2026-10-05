ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS premium_welcome_sent_at timestamptz;

COMMENT ON COLUMN public.subscriptions.premium_welcome_sent_at IS 'Set only after the member first-premium welcome notification and email are successfully dispatched.';