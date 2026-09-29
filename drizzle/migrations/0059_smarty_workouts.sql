CREATE TABLE public.smarty_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  format text,
  focus text,
  difficulty_stars int NOT NULL DEFAULT 2,
  duration_min int NOT NULL DEFAULT 30,
  duration_label text,
  equipment text[] NOT NULL DEFAULT '{}',
  location text,
  image_url text,
  description_html text,
  main_workout text,
  instructions_html text,
  tips_html text,
  is_visible boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.smarty_workouts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.smarty_workouts TO authenticated;
GRANT ALL ON public.smarty_workouts TO service_role;
ALTER TABLE public.smarty_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visible smarty workouts are public" ON public.smarty_workouts FOR SELECT TO anon, authenticated USING (is_visible = true);
CREATE POLICY "Admins manage smarty workouts" ON public.smarty_workouts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX smarty_workouts_cat_idx ON public.smarty_workouts (category, is_visible, sort_order);
CREATE POLICY "Admins upload smarty workout images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'smarty-workout-images' AND public.has_role(auth.uid(), 'admin'));