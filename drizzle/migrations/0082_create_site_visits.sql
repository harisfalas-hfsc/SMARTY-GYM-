CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id text NOT NULL,
  path text NOT NULL,
  source text NOT NULL,
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text
);

GRANT ALL ON public.site_visits TO service_role;

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- No client policies: inserts and reads happen only through server functions (service role).

CREATE INDEX site_visits_created_at_idx ON public.site_visits (created_at);
CREATE INDEX site_visits_source_idx ON public.site_visits (source);