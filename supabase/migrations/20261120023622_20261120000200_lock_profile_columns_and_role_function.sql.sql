/*
# Lock profile columns and add protected role assignment

1. Plain-English explanation
- Members changing their own profile could previously also rewrite any column of their row, including their role and assigned role. From now on, a signed-in user can only update their own password-change flag and avatar. Assigning a custom role to a member is done exclusively through a protected database function that verifies the caller is the Dictador.
- Tightens profile self-registration: a new sign-up can only ever attempt to create the single Dictador account (the database guarantees only one exists).

2. Modified tables and functions
- `profiles`: column-level UPDATE grant for authenticated narrowed to (must_change_password, avatar_url).
- New function `set_member_role(p_member uuid, p_role_id uuid)`: SECURITY DEFINER, callable only by the Dictador, updates a member's custom_role_id. Blocks a Dictador from changing their own role row.
- `profiles` INSERT policy replaced: WITH CHECK (role = 'dictador').

3. Security changes
- REVOKE table UPDATE on profiles from authenticated; GRANT UPDATE (must_change_password, avatar_url) only.
- REVOKE EXECUTE on set_member_role from PUBLIC and anon; GRANT to authenticated.
- The service role (used by the create-member edge function) is unaffected and can still insert full profiles.

4. Important notes
- The Dictador's own account is protected by the existing partial unique index: only one can exist.
- Idempotent; no transaction control statements.
*/

REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (must_change_password, avatar_url) ON profiles TO authenticated;

CREATE OR REPLACE FUNCTION set_member_role(p_member uuid, p_role_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_dictator() THEN
    RAISE EXCEPTION 'Solo el Dictador puede asignar roles';
  END IF;

  IF p_member = auth.uid() THEN
    RAISE EXCEPTION 'No puedes cambiar tu propio rol';
  END IF;

  UPDATE profiles SET custom_role_id = p_role_id WHERE id = p_member;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_member_role(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION set_member_role(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_dictator_setup"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (role = 'dictador');
