CREATE TABLE IF NOT EXISTS public.smarty_workouts_backup_push_spread_20261014 AS SELECT * FROM public.smarty_workouts;
GRANT ALL ON public.smarty_workouts_backup_push_spread_20261014 TO service_role;
ALTER TABLE public.smarty_workouts_backup_push_spread_20261014 ENABLE ROW LEVEL SECURITY;