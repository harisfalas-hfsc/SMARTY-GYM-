CREATE TABLE public.broadcast_email_sends (
  user_id uuid NOT NULL,
  dedupe_key text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dedupe_key)
);

-- Server-only delivery ledger: no client grants, no policies, RLS on.
GRANT ALL ON public.broadcast_email_sends TO service_role;
ALTER TABLE public.broadcast_email_sends ENABLE ROW LEVEL SECURITY;