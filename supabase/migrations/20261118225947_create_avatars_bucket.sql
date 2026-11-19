/*
# Create avatars storage bucket

Creates a public storage bucket for character and user avatars.
Sets up policies so authenticated users can upload, and anyone can read.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
TO public USING (bucket_id = 'avatars');

-- Allow authenticated upload
DROP POLICY IF EXISTS "avatars_auth_upload" ON storage.objects;
CREATE POLICY "avatars_auth_upload"
ON storage.objects FOR INSERT
TO authenticated WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated update/delete of their own
DROP POLICY IF EXISTS "avatars_auth_update" ON storage.objects;
CREATE POLICY "avatars_auth_update"
ON storage.objects FOR UPDATE
TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_auth_delete" ON storage.objects;
CREATE POLICY "avatars_auth_delete"
ON storage.objects FOR DELETE
TO authenticated USING (bucket_id = 'avatars');
