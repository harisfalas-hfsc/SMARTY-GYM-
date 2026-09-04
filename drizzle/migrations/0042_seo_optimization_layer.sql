-- Per-article SEO fields (background only, never rendered as visible text)
ALTER TABLE public.blog_articles
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS focus_keyphrase text,
  ADD COLUMN IF NOT EXISTS seo_keywords text[],
  ADD COLUMN IF NOT EXISTS image_alt text,
  ADD COLUMN IF NOT EXISTS seo_faq jsonb,
  ADD COLUMN IF NOT EXISTS seo_content_hash text,
  ADD COLUMN IF NOT EXISTS seo_optimized_at timestamptz;

-- SEO metadata for workouts members chose to share with the community
CREATE TABLE IF NOT EXISTS public.workout_seo (
  workout_id uuid PRIMARY KEY REFERENCES public.workouts(id) ON DELETE CASCADE,
  seo_title text,
  seo_description text,
  seo_keywords text[],
  content_hash text,
  optimized_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.workout_seo TO anon;
GRANT SELECT ON public.workout_seo TO authenticated;
GRANT ALL ON public.workout_seo TO service_role;

ALTER TABLE public.workout_seo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workout SEO is public" ON public.workout_seo;
CREATE POLICY "Workout SEO is public" ON public.workout_seo FOR SELECT TO anon, authenticated USING (true);

-- Single-flight lease + paused state + progress for the weekly SEO optimizer
CREATE TABLE IF NOT EXISTS public.seo_state (
  key text PRIMARY KEY,
  lease_until timestamptz,
  paused_reason text,
  paused_at timestamptz,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.seo_state TO authenticated;
GRANT ALL ON public.seo_state TO service_role;

ALTER TABLE public.seo_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read SEO state" ON public.seo_state;
CREATE POLICY "Admins read SEO state" ON public.seo_state FOR SELECT TO authenticated
  USING (public.is_app_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS blog_articles_seo_optimized_idx ON public.blog_articles (seo_optimized_at);