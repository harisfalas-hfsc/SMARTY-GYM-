DROP POLICY IF EXISTS "Public read exercise demos" ON storage.objects;
CREATE POLICY "Public read exercise demos" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'exercise-library' AND (name LIKE 'gifs/%' OR name LIKE 'legacy/%'));