CREATE TABLE IF NOT EXISTS public.backup_obsolete_wod_20261003 AS SELECT * FROM public.workouts WHERE is_wod;
GRANT ALL ON public.backup_obsolete_wod_20261003 TO service_role;
ALTER TABLE public.backup_obsolete_wod_20261003 ENABLE ROW LEVEL SECURITY;
DELETE FROM public.notifications WHERE workout_id IN (SELECT id FROM public.workouts WHERE is_wod);
DELETE FROM public.personal_records WHERE workout_id IN (SELECT id FROM public.workouts WHERE is_wod);
DELETE FROM public.workouts WHERE is_wod;