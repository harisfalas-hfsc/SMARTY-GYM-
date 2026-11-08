CREATE TABLE public.smarty_workout_fix_staging_running2_20261108 (id uuid PRIMARY KEY, old_md5 text NOT NULL, new_main_workout text NOT NULL);
GRANT ALL ON public.smarty_workout_fix_staging_running2_20261108 TO service_role;
ALTER TABLE public.smarty_workout_fix_staging_running2_20261108 ENABLE ROW LEVEL SECURITY;