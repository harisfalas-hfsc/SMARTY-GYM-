ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS favorited_at timestamptz;
CREATE OR REPLACE FUNCTION public.set_favorited_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.is_favorite AND NOT COALESCE(OLD.is_favorite, false) THEN NEW.favorited_at = now(); END IF;
  IF NOT NEW.is_favorite THEN NEW.favorited_at = NULL; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_workouts_favorited_at ON public.workouts;
CREATE TRIGGER trg_workouts_favorited_at BEFORE UPDATE OF is_favorite ON public.workouts
FOR EACH ROW EXECUTE FUNCTION public.set_favorited_at();