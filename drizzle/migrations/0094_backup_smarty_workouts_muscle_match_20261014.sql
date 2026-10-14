CREATE TABLE public.smarty_workouts_backup_muscle_match_20261014 AS SELECT * FROM public.smarty_workouts;
GRANT ALL ON public.smarty_workouts_backup_muscle_match_20261014 TO service_role;
ALTER TABLE public.smarty_workouts_backup_muscle_match_20261014 ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.smarty_workouts_backup_muscle_match_20261014 IS 'Backup of every Smarty Workout before the 14 Oct 2026 muscle-match / no-repeat repair.';