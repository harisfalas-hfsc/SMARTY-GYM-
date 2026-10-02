CREATE TABLE public.smarty_workouts_backup_premigration_20261002 AS SELECT * FROM public.smarty_workouts;
GRANT ALL ON public.smarty_workouts_backup_premigration_20261002 TO service_role;
ALTER TABLE public.smarty_workouts_backup_premigration_20261002 ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.smarty_workouts_backup_premigration_20261002 IS 'Pre-migration backup of all 530 Smarty Workouts (2026-10-02). Restore: UPDATE smarty_workouts s SET main_workout=b.main_workout FROM this b WHERE s.id=b.id.';