CREATE TABLE public.smarty_workouts_backup_conditioning_fix_20261108 AS SELECT * FROM public.smarty_workouts WHERE is_visible AND category IN ('CARDIO','METABOLIC','CALORIE BURNING','CHALLENGE');
GRANT ALL ON public.smarty_workouts_backup_conditioning_fix_20261108 TO service_role;
ALTER TABLE public.smarty_workouts_backup_conditioning_fix_20261108 ENABLE ROW LEVEL SECURITY;