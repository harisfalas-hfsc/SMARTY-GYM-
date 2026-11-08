CREATE TABLE public.smarty_workouts_backup_running_complex_20261108 AS SELECT * FROM public.smarty_workouts WHERE is_visible;
GRANT ALL ON public.smarty_workouts_backup_running_complex_20261108 TO service_role;
ALTER TABLE public.smarty_workouts_backup_running_complex_20261108 ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.smarty_workout_fix_staging_running_20261108 (id uuid PRIMARY KEY, old_md5 text NOT NULL, new_main_workout text NOT NULL);
GRANT ALL ON public.smarty_workout_fix_staging_running_20261108 TO service_role;
ALTER TABLE public.smarty_workout_fix_staging_running_20261108 ENABLE ROW LEVEL SECURITY;