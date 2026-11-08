CREATE TABLE public.smarty_workouts_backup_doc_corrections_20261108 AS SELECT * FROM public.smarty_workouts;
ALTER TABLE public.smarty_workouts_backup_doc_corrections_20261108 ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.smarty_workouts_backup_doc_corrections_20261108 TO service_role;
CREATE TABLE public.smarty_workout_fix_staging_doc_20261108 (id uuid PRIMARY KEY, new_main text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.smarty_workout_fix_staging_doc_20261108 ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.smarty_workout_fix_staging_doc_20261108 TO service_role;