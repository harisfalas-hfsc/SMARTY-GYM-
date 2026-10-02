CREATE OR REPLACE FUNCTION public.has_active_membership(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'free_access_mode' AND value = 'true'::jsonb)
    OR EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = _user_id
               AND status IN ('active','trialing')
               AND (current_period_end IS NULL OR current_period_end > now()))
  )
$$;
REVOKE EXECUTE ON FUNCTION public.has_active_membership(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_active_membership(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users manage own workouts" ON public.workouts;
CREATE POLICY "Members manage own workouts" ON public.workouts FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.has_active_membership(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.has_active_membership(auth.uid()));

DROP POLICY IF EXISTS "Users manage own set logs" ON public.set_logs;
CREATE POLICY "Members manage own set logs" ON public.set_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.has_active_membership(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.has_active_membership(auth.uid()));

DROP POLICY IF EXISTS "Users manage own feedback" ON public.workout_feedback;
CREATE POLICY "Members manage own feedback" ON public.workout_feedback FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.has_active_membership(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.has_active_membership(auth.uid()));

DROP POLICY IF EXISTS "Users manage their own workout results" ON public.workout_results;
CREATE POLICY "Members manage own workout results" ON public.workout_results FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.has_active_membership(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.has_active_membership(auth.uid()));

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.stripe_events TO service_role;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  -- No automatic admin grants on sign-up. Admins are added only by an existing admin.
  RETURN NEW;
END; $$;