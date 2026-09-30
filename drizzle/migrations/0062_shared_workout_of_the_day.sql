CREATE TABLE public.wod_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wod_date date NOT NULL,
  slot text NOT NULL,
  smarty_workout_id uuid NOT NULL REFERENCES public.smarty_workouts(id) ON DELETE CASCADE,
  cycle_day integer NOT NULL,
  category text NOT NULL,
  difficulty text,
  strength_focus text,
  source text NOT NULL DEFAULT 'auto',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wod_date, slot)
);
GRANT SELECT ON public.wod_schedule TO anon, authenticated;
GRANT ALL ON public.wod_schedule TO service_role;
ALTER TABLE public.wod_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workout of the Day schedule is public" ON public.wod_schedule FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER trg_wod_schedule_updated BEFORE UPDATE ON public.wod_schedule FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.wod_selection_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smarty_workout_id uuid NOT NULL REFERENCES public.smarty_workouts(id) ON DELETE CASCADE,
  selected_for_date date NOT NULL,
  slot text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (selected_for_date, slot)
);
GRANT ALL ON public.wod_selection_ledger TO service_role;
ALTER TABLE public.wod_selection_ledger ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN public.profiles.wod_mode IS 'DEPRECATED: Workout of the Day is shared for everyone; no subscription.';
COMMENT ON COLUMN public.profiles.wod_subscribed_at IS 'DEPRECATED: Workout of the Day subscription removed.';
COMMENT ON COLUMN public.profiles.wod_renews_at IS 'DEPRECATED: Workout of the Day subscription removed.';