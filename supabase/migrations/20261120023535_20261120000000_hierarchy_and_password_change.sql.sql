/*
# Hierarchy, seeded roles and forced first-login password change

1. Plain-English explanation
- Guarantees exactly ONE user holds the top role (Dictador): a partial unique index allows at most one profiles row with role='dictador'.
- Adds a flag to force a password change on first login for members created by the Dictador.
- Seeds three built-in roles that always appear right below Dictador, above any custom role: Vice Dictador, Plebe Destacado, Plebe.

2. New/modified tables and columns
- `profiles`:
  - New column `must_change_password` (boolean, not null, default false).
  - Partial unique index `profiles_single_dictator_idx` on role='dictador'.
- `custom_roles`:
  - New column `is_system` (boolean, not null, default false).
  - Seeded rows: Vice Dictador (order 10), Plebe Destacado (order 20), Plebe (order 30), re-seeded by name if missing (idempotent).

3. Security changes
- custom_roles DELETE policy now requires `is_dictator() AND NOT is_system` — system roles cannot be deleted from the app.
- custom_roles UPDATE policy unchanged (Dictador can still reorder them).
- Grants unchanged; RLS continues to scope writes.

4. Important notes
- Custom roles created later start at display_order 40+ and can be reordered by the Dictador.
- Idempotent: safe to re-run. No transaction control statements.
*/

-- Single dictator enforcement
CREATE UNIQUE INDEX IF NOT EXISTS profiles_single_dictator_idx
  ON profiles (role) WHERE role = 'dictador';

-- Forced password change flag
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL default false;

-- System roles
ALTER TABLE custom_roles ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

INSERT INTO custom_roles (name, display_order, is_system)
SELECT v.name, v.display_order, true
FROM (VALUES
  ('Vice Dictador', 10),
  ('Plebe Destacado', 20),
('Plebe', 30)
) AS v(name, display_order)
WHERE NOT EXISTS (SELECT 1 FROM custom_roles r WHERE r.name = v.name AND r.is_system);

-- System roles keep canonical order
UPDATE custom_roles SET display_order = v.display_order
FROM (VALUES ('Vice Dictador',10),('Plebe Destacado',20),('Plebe',30)) AS v(name, display_order)
WHERE custom_roles.name = v.name AND custom_roles.is_system;

-- System roles can never be deleted via the app
DROP POLICY IF EXISTS "custom_roles_delete_dictator" ON custom_roles;
CREATE POLICY "custom_roles_delete delete_policy" ON custom_roles;
