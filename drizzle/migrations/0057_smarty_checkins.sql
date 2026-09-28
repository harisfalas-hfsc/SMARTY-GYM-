CREATE TABLE public.smarty_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  checkin_date date NOT NULL,
  morning_completed boolean NOT NULL DEFAULT false,
  morning_completed_at timestamptz,
  sleep_hours numeric(3,1),
  sleep_quality integer,
  readiness_score integer,
  soreness_rating integer,
  mood_rating integer,
  night_completed boolean NOT NULL DEFAULT false,
  night_completed_at timestamptz,
  steps_bucket integer,
  hydration_liters numeric(3,1),
  protein_level integer,
  day_strain integer,
  sleep_score numeric(4,1),
  readiness_score_norm numeric(4,1),
  soreness_score numeric(4,1),
  mood_score numeric(4,1),
  movement_score numeric(4,1),
  hydration_score numeric(4,1),
  protein_score_norm numeric(4,1),
  day_strain_score numeric(4,1),
  daily_smarty_score integer,
  score_category text,
  status text NOT NULL DEFAULT 'incomplete',
  morning_modal_shown boolean NOT NULL DEFAULT false,
  night_modal_shown boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkin_date)
);
GRANT SELECT, INSERT, UPDATE ON public.smarty_checkins TO authenticated;
GRANT ALL ON public.smarty_checkins TO service_role;
ALTER TABLE public.smarty_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own checkins read" ON public.smarty_checkins FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own checkins insert" ON public.smarty_checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own checkins update" ON public.smarty_checkins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX smarty_checkins_user_date ON public.smarty_checkins (user_id, checkin_date DESC);
CREATE TRIGGER smarty_checkins_updated_at BEFORE UPDATE ON public.smarty_checkins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.badge_definitions (id, category, name, description, threshold, icon, points, sort_order) VALUES
('chk_7','checkins','7 Day Check-in Streak','7 consecutive complete check-in days',7,'flame',25,301),
('chk_30','checkins','30 Day Check-in Streak','30 consecutive complete check-in days',30,'flame',100,302),
('chk_90','checkins','90 Day Check-in Streak','90 consecutive complete check-in days',90,'flame',300,303)
ON CONFLICT (id) DO NOTHING;