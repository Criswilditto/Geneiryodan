/*
# Fix custom_roles delete policy for system roles

1. Plain-English explanation
- Repairs a malformed policy left by the previous migration: replaces it with the intended rule so only the Dictador can delete custom roles, and system roles (Vice Dictador, Plebe Destacado, Plebe) can never be deleted.

2. Modified tables
- `custom_roles`: DELETE policy replaced.

3. Security changes
- DROP bogus FOR ALL policy "custom_roles_delete delete_policy".
- New DELETE policy "custom_roles_delete_dictator": USING (is_dictator() AND NOT is_system).

4. Important notes
- Idempotent.
*/

DROP POLICY IF EXISTS "custom_roles_delete delete_policy" ON custom_roles;
DROP POLICY IF EXISTS "custom_roles_delete_dictator" ON custom_roles;
CREATE POLICY "custom_roles_delete_dictator"
ON custom_roles FOR DELETE
TO authenticated
USING (is_dictator() AND NOT is_system);
