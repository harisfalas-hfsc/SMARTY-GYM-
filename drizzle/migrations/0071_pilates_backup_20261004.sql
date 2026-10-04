CREATE TABLE IF NOT EXISTS public.smarty_workouts_backup_pilates_20261004 AS
  SELECT * FROM public.smarty_workouts WHERE category = 'PILATES';
GRANT ALL ON public.smarty_workouts_backup_pilates_20261004 TO service_role;
ALTER TABLE public.smarty_workouts_backup_pilates_20261004 ENABLE ROW LEVEL SECURITY;