CREATE TABLE IF NOT EXISTS public.seo_indexnow_queue (url text PRIMARY KEY, state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'sent')), changed_at timestamptz NOT NULL DEFAULT now(), submitted_at timestamptz, attempts integer NOT NULL DEFAULT 0, retry_at timestamptz NOT NULL DEFAULT now(), last_error text);
CREATE INDEX IF NOT EXISTS seo_indexnow_due_idx ON public.seo_indexnow_queue(retry_at) WHERE state = 'pending';
ALTER TABLE public.seo_indexnow_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seo_indexnow_queue FROM anon, authenticated;
GRANT ALL ON public.seo_indexnow_queue TO service_role;