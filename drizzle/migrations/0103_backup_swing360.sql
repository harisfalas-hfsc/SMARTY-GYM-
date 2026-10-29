CREATE TABLE public.smarty_workouts_backup_swing360_20261029 AS SELECT * FROM public.smarty_workouts WHERE main_workout ILIKE '%exercise:3318:%';
CREATE TABLE public.workouts_backup_swing360_20261029 AS SELECT * FROM public.workouts w WHERE main_workout ILIKE '%exercise:3318:%' AND name IN (SELECT name FROM public.smarty_workouts);
GRANT ALL ON public.smarty_workouts_backup_swing360_20261029 TO service_role;
GRANT ALL ON public.workouts_backup_swing360_20261029 TO service_role;
ALTER TABLE public.smarty_workouts_backup_swing360_20261029 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts_backup_swing360_20261029 ENABLE ROW LEVEL SECURITY;