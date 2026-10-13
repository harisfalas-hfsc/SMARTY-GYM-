CREATE TABLE public.smarty_workouts_backup_finisher_formats_20261013 AS SELECT * FROM public.smarty_workouts;
ALTER TABLE public.smarty_workouts_backup_finisher_formats_20261013 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.smarty_workouts_backup_finisher_formats_20261013 FROM anon, authenticated;
GRANT ALL ON public.smarty_workouts_backup_finisher_formats_20261013 TO service_role;
COMMENT ON TABLE public.smarty_workouts_backup_finisher_formats_20261013 IS 'Backup of all Smarty Workouts before replacing Intervals finishers with approved formats (2026-10-13).';