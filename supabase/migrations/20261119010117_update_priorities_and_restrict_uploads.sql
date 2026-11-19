/*
# Update priorities and restrict avatar uploads to maestro only

## Overview
1. Changes the allowed priority values from P1-P10 to: No Obtenido, P4-P10
2. Creates a SECURITY DEFINER function `is_maestro()` so RLS policies can check role
3. Restricts character avatar uploads (storage) to maestro role only
4. Removes the old self-signup INSERT policy on profiles — only the edge function (service_role) creates member profiles now

## Priority changes
Old: P1..P10
New: 'No Obtenido', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'

## Security
- New `is_maestro()` SECURITY DEFINER function checks profiles table for maestro role
- Storage bucket 'avatars': INSERT/UPDATE/DELETE restricted to maestro only (was: any authenticated)
- profiles table: INSERT revoked from authenticated, only service_role can insert (via edge function)
- character_assignments: SELECT still visible to owner or maestro; CRUD still owner-only
*/

-- Update priority constraint
ALTER TABLE character_assignments DROP CONSTRAINT IF EXISTS character_assignments_priority_check;
ALTER TABLE character_assignments ADD CONSTRAINT character_assignments_priority_check
  CHECK (priority IN ('No Obtenido','P4','P5','P6','P7','P8','P9','P10'));

-- Update default priority
ALTER TABLE character_assignments ALTER COLUMN priority SET DEFAULT 'No Obtenido';

-- Migrate existing data
UPDATE character_assignments SET priority = 'No Obtenido' WHERE priority NOT IN ('No Obtenido','P4','P5','P6','P7','P8','P9','P10');

-- is_maestro function (SECURITY DEFINER so it can read profiles regardless of RLS)
CREATE OR REPLACE FUNCTION is_maestro()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'maestro'
  );
$$;

REVOKE EXECUTE ON FUNCTION is_maestro() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_maestro() TO authenticated;

-- Revoke INSERT on profiles from authenticated (only service_role / edge function creates members)
REVOKE INSERT ON profiles FROM authenticated;

-- Restrict storage to maestro only
DROP POLICY IF EXISTS "avatars_auth_upload" ON storage.objects;
CREATE POLICY "avatars_maestro_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND public.is_maestro());

DROP POLICY IF EXISTS "avatars_auth_update" ON storage.objects;
CREATE POLICY "avatars_maestro_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND public.is_maestro());

DROP POLICY IF EXISTS "avatars_auth_delete" ON storage.objects;
CREATE POLICY "avatars_maestro_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND public.is_maestro());
