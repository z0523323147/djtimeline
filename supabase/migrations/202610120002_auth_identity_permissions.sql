-- Repair "permission denied for schema auth" during private plan operations.
-- Run after 202610120001_private_plans.sql. Safe to repeat; no data changes.
begin;

-- Caller SELECT policies and the restricted RPC owner both resolve auth.uid().
-- Schema USAGE does not grant access to auth.users or any other table.
grant usage on schema auth to authenticated, party_map_plan_writer;
grant execute on function auth.uid() to authenticated, party_map_plan_writer;

commit;

-- These four flags should all be true. No user data or tokens are returned.
select
  has_schema_privilege('authenticated', 'auth', 'USAGE') as caller_schema_access,
  has_function_privilege('authenticated', 'auth.uid()', 'EXECUTE') as caller_identity_access,
  has_schema_privilege('party_map_plan_writer', 'auth', 'USAGE') as writer_schema_access,
  has_function_privilege('party_map_plan_writer', 'auth.uid()', 'EXECUTE') as writer_identity_access;
