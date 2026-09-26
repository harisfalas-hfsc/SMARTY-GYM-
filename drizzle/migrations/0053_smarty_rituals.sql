CREATE TABLE public.smarty_rituals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position integer NOT NULL UNIQUE,
  morning_content text NOT NULL DEFAULT '',
  midday_content text NOT NULL DEFAULT '',
  evening_content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.smarty_rituals TO service_role;
ALTER TABLE public.smarty_rituals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_smarty_rituals_updated BEFORE UPDATE ON public.smarty_rituals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.app_settings (key, value) VALUES ('ritual_anchor_date', to_jsonb(to_char((now() AT TIME ZONE 'Europe/Nicosia')::date, 'YYYY-MM-DD')))
ON CONFLICT (key) DO NOTHING;