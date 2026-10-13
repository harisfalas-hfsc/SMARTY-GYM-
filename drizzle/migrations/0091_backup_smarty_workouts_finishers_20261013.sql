CREATE TABLE public.smarty_workouts_backup_finishers_20261013 AS SELECT * FROM public.smarty_workouts;
GRANT ALL ON public.smarty_workouts_backup_finishers_20261013 TO service_role;
ALTER TABLE public.smarty_workouts_backup_finishers_20261013 ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.smarty_workouts_backup_finishers_20261013 IS 'Backup of all Smarty Workouts before the 2026-10-13 finisher-length repair.';