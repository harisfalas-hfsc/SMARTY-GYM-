ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_new_workouts boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_shared_workouts boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.profiles.email_new_workouts IS 'Member preference for new Smarty Workout announcement emails; app notices remain mandatory.';
COMMENT ON COLUMN public.profiles.email_shared_workouts IS 'Member preference for shared-workout announcement emails; app notices remain mandatory.';