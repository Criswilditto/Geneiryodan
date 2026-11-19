/*
# Allow all members to view each other's assignments + shared avatar on characters

## Overview
1. Changes the SELECT policy on character_assignments so ALL authenticated users
   can see everyone's assignments (not just their own or the maestro's).
   This enables the "Miembros" tab where any member can view another member's roster.
2. Migrates any existing per-user custom_avatar_url values from character_assignments
   to characters.default_avatar_url so avatars are shared across all users.

## Security
- SELECT on character_assignments: now TO authenticated USING (true) — all members see all rosters
- INSERT/UPDATE/DELETE on character_assignments: unchanged, owner-only
- characters UPDATE: still maestro-only
*/
DROP POLICY IF EXISTS "assignments_select_own_or_maestro" ON character_assignments;
CREATE POLICY "assignments_select_all"
ON character_assignments FOR SELECT
TO authenticated USING (true);

-- Migrate existing custom avatars to the shared character table
UPDATE characters
SET default_avatar_url = sub.custom_avatar_url
FROM (
  SELECT DISTINCT ON (character_id) character_id, custom_avatar_url
  FROM character_assignments
  WHERE custom_avatar_url IS NOT NULL
  ORDER BY character_id, updated_at DESC
) sub
WHERE characters.id = sub.character_id
  AND characters.default_avatar_url IS NULL;

-- Clear per-user custom avatar URLs since avatars are now shared
UPDATE character_assignments SET custom_avatar_url = NULL WHERE custom_avatar_url IS NOT NULL;
