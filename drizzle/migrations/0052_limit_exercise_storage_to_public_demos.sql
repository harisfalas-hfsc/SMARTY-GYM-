DROP POLICY IF EXISTS "Public read exercise library" ON storage.objects;
CREATE POLICY "Public read exercise demos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'exercise-library' AND name LIKE 'gifs/%');
DROP POLICY IF EXISTS "Authenticated read exercise library" ON storage.objects;
CREATE POLICY "Admins read exercise metadata" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'exercise-library' AND public.is_app_admin((SELECT auth.uid())));