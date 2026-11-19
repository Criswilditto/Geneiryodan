/*
# Rename Maestro to Dictador, add custom roles system

## Overview
1. Renames the 'maestro' role to 'dictador' in profiles (data + constraint)
2. Creates a `custom_roles` table for user-defined roles (Capitan, Vice Capitan, etc.)
3. Adds `custom_role_id` foreign key to profiles so members can be assigned a custom role
4. Only the Dictador can create/delete/assign custom roles
5. Updates all storage and character policies from is_maestro to is_dictator

## New Tables
### custom_roles
- `id` (uuid, primary key)
- `name` (text, unique, not null)
- `display_order` (int, default 0)
- `created_at` (timestamptz)

## Modified Tables
### profiles
- `role` CHECK: 'dictador' / 'miembro' (was 'maestro' / 'miembro')
- New column `custom_role_id` (uuid, nullable, FK to custom_roles, ON DELETE SET NULL)

## Security
- custom_roles: all authenticated SELECT; only dictador INSERT/UPDATE/DELETE
- profiles: dictador can DELETE; UPDATE own or dictator; SELECT all
- is_dictator() SECURITY DEFINER function replaces is_maestro()
*/
CREATE TABLE IF NOT EXISTS custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON custom_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON custom_roles TO authenticated;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_role_id uuid REFERENCES custom_roles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Step 1: Drop old constraint first
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Migrate data
UPDATE profiles SET role = 'dictador' WHERE role = 'maestro';

-- Step 3: Add new constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('dictador', 'miembro'));

-- is_dictator function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION is_dictator()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'dictador'
  );
$$;

REVOKE EXECUTE ON FUNCTION is_dictator() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_dictator() TO authenticated;

-- custom_roles policies
DROP POLICY IF EXISTS "custom_roles_select_all" ON custom_roles;
CREATE POLICY "custom_roles_select_all"
ON custom_roles FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "custom_roles_insert_dictator" ON custom_roles;
CREATE POLICY "custom_roles_insert_dictator"
ON custom_roles FOR INSERT
TO authenticated
WITH CHECK (public.is_dictator());

DROP POLICY IF EXISTS "custom_roles_update_dictator" ON custom_roles;
CREATE POLICY "custom_roles_update_dictator"
ON custom_roles FOR UPDATE
TO authenticated
USING (public.is_dictator()) WITH CHECK (public.is_dictator());

DROP POLICY IF EXISTS "custom_roles_delete_dictator" ON custom_roles;
CREATE POLICY "custom_roles_delete_dictator"
ON custom_roles FOR DELETE
TO authenticated
USING (public.is_dictator());

-- profiles: allow dictador to update any profile and delete
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_dictator" ON profiles;
CREATE POLICY "profiles_update_own_or_dictator"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_dictator())
WITH CHECK (auth.uid() = id OR public.is_dictator());

DROP POLICY IF EXISTS "profiles_delete_dictator" ON profiles;
CREATE POLICY "profiles_delete_dictator"
ON profiles FOR DELETE
TO authenticated
USING (public.is_dictator());

GRANT DELETE ON profiles TO authenticated;

-- Storage: replace maestro policies with dictator
DROP POLICY IF EXISTS "avatars_maestro_upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars_dictator_upload" ON storage.objects;
CREATE POLICY "avatars_dictator_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND public.is_dictator());

DROP POLICY IF EXISTS "avatars_maestro_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_dictator_update" ON storage.objects;
CREATE POLICY "avatars_dictator_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND public.is_dictator());

DROP POLICY IF EXISTS "avatars_maestro_delete" ON storage.objects;
DROP POLICY IF EXISTS "avatars_dictator_delete" ON storage.objects;
CREATE POLICY "avatars_dictator_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND public.is_dictator());

-- Characters: replace maestro policies with dictator
DROP POLICY IF EXISTS "characters_modify_maestro" ON characters;
DROP POLICY IF EXISTS "characters_modify_dictator" ON characters;
CREATE POLICY "characters_modify_dictator"
ON characters FOR INSERT
TO authenticated
WITH CHECK (public.is_dictator());

DROP POLICY IF EXISTS "characters_update_maestro" ON characters;
DROP POLICY IF EXISTS "characters_update_dictator" ON characters;
CREATE POLICY "characters_update_dictator"
ON characters FOR UPDATE
TO authenticated
USING (public.is_dictator()) WITH CHECK (public.is_dictator());

DROP POLICY IF EXISTS "characters_delete_maestro" ON characters;
DROP POLICY IF EXISTS "characters_delete_dictator" ON characters;
CREATE POLICY "characters_delete_dictator"
ON characters FOR DELETE
TO authenticated
USING (public.is_dictator());
