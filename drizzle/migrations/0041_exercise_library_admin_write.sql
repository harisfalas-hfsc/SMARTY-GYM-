CREATE POLICY "Admins insert exercise library"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exercise-library' AND public.is_app_admin(auth.uid()));

CREATE POLICY "Admins update exercise library"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'exercise-library' AND public.is_app_admin(auth.uid()))
WITH CHECK (bucket_id = 'exercise-library' AND public.is_app_admin(auth.uid()));

CREATE POLICY "Admins delete exercise library"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'exercise-library' AND public.is_app_admin(auth.uid()));