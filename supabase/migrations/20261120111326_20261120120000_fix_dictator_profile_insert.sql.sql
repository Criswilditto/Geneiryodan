/*
# Allow the single Dictador account creation and member self-service

1. Plain-English explanation
- Fixes a bug: when the very first Dictador account was created from the app, saving its profile was blocked by a security rule that was too strict, leaving the account without a profile — so it appeared as "Miembro" with no permissions.
- Now: the profile insert succeeds only if the new profile has the dictador role (and only one can ever exist, by the existing unique rule). Member profiles continue to be created exclusively by the server-side member creation function.

2. Modified tables
- `profiles`: INSERT policy replaced.

3. Security changes
- New INSERT policy "profiles_insert_dictator_setup": WITH CHECK (role = 'dictador'), TO authenticated.
- Members can still not self-register: a member profile can only be created by the service role (edge function), which bypasses RLS.

4. Important notes
- Idempotent.
*/

DROP POLICY IF EXISTS "profiles_insert_dictator_setup" ON profiles;
CREATE POLICY "profiles_insert_dictator_setup"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (role = 'dictador');
