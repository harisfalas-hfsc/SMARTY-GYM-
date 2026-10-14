CREATE TABLE IF NOT EXISTS public.smarty_workouts_backup_plain_pictures_20261014 AS SELECT * FROM public.smarty_workouts;
GRANT ALL ON public.smarty_workouts_backup_plain_pictures_20261014 TO service_role;
ALTER TABLE public.smarty_workouts_backup_plain_pictures_20261014 ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.smarty_workouts_backup_plain_pictures_20261014 IS 'Backup of all Smarty Workouts before the 14 Oct 2026 plain-text and picture repair.';