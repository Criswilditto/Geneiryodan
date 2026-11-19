/*
# Create 7DS Origin Character Tracker Schema

## Overview
This migration creates the database schema for a 7 Deadly Sins: Origin character tracker app.
The app supports two roles: "maestro" (master/owner) and "miembro" (member).
It stores 30 predefined characters from 7DS Origin, and each user can assign
priority levels P1-P10 to characters and upload custom avatars.

## New Tables

### profiles
- `id` (uuid, primary key, references auth.users)
- `username` (text, not null)
- `role` (text, not null, default 'miembro', CHECK in 'maestro' or 'miembro')
- `avatar_url` (text, nullable)
- `created_at` (timestamptz, default now())

### characters
- `id` (uuid, primary key)
- `name` (text, not null)
- `rarity` (text, not null) -- e.g. "5-Star", "4-Star", "3-Star"
- `element` (text, not null) -- e.g. "Fire", "Water", "Earth", "Light", "Dark"
- `weapon` (text, not null) -- e.g. "Sword", "Dual Sword", "Wand", "Grimoire"
- `class` (text, not null) -- e.g. "DPS", "Healer", "Support", "Tank"
- `default_avatar_url` (text, nullable)
- `created_at` (timestamptz, default now())

### character_assignments
- `id` (uuid, primary key)
- `user_id` (uuid, not null, default auth.uid(), references auth.users, ON DELETE CASCADE)
- `character_id` (uuid, not null, references characters, ON DELETE CASCADE)
- `priority` (text, not null, default 'P1', CHECK in P1..P10)
- `custom_avatar_url` (text, nullable)
- `notes` (text, nullable)
- `updated_at` (timestamptz, default now())
- UNIQUE (user_id, character_id)

## Security
- RLS enabled on all tables.
- profiles: each authenticated user can read all profiles, but only update their own. Only a maestro can insert new profiles is NOT enforced via RLS (sign-up creates own profile). All authenticated can SELECT. Only owner can UPDATE own.
- characters: public read for authenticated (shared roster). Only maestro role can INSERT/UPDATE/DELETE (enforced by checking profiles.role = 'maestro').
- character_assignments: each user can CRUD only their own assignments. Maestro can read all assignments.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'miembro' CHECK (role IN ('maestro', 'miembro')),
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rarity text NOT NULL,
  element text NOT NULL,
  weapon text NOT NULL,
  class text NOT NULL,
  default_avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON characters TO authenticated;
GRANT INSERT, UPDATE, DELETE ON characters TO authenticated;

DROP POLICY IF EXISTS "characters_select_all" ON characters;
CREATE POLICY "characters_select_all"
ON characters FOR SELECT
TO authenticated USING (true);

-- Only maestro can modify the shared roster
DROP POLICY IF EXISTS "characters_modify_maestro" ON characters;
CREATE POLICY "characters_modify_maestro"
ON characters FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'maestro')
);

DROP POLICY IF EXISTS "characters_update_maestro" ON characters;
CREATE POLICY "characters_update_maestro"
ON characters FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'maestro')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'maestro')
);

DROP POLICY IF EXISTS "characters_delete_maestro" ON characters;
CREATE POLICY "characters_delete_maestro"
ON characters FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'maestro')
);

-- Character assignments table
CREATE TABLE IF NOT EXISTS character_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  priority text NOT NULL DEFAULT 'P1' CHECK (priority IN ('P1','P2','P3','P4','P5','P6','P7','P8','P9','P10')),
  custom_avatar_url text,
  notes text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, character_id)
);

ALTER TABLE character_assignments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON character_assignments TO authenticated;

DROP POLICY IF EXISTS "assignments_select_own_or_maestro" ON character_assignments;
CREATE POLICY "assignments_select_own_or_maestro"
ON character_assignments FOR SELECT
TO authenticated USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'maestro')
);

DROP POLICY IF EXISTS "assignments_insert_own" ON character_assignments;
CREATE POLICY "assignments_insert_own"
ON character_assignments FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "assignments_update_own" ON character_assignments;
CREATE POLICY "assignments_update_own"
ON character_assignments FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "assignments_delete_own" ON character_assignments;
CREATE POLICY "assignments_delete_own"
ON character_assignments FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assignments_updated_at ON character_assignments;
CREATE TRIGGER trigger_assignments_updated_at
BEFORE UPDATE ON character_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
