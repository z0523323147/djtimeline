-- Run in the SQL Editor of project aemfewsfcrcmtafnypxa, as postgres.
-- Read-only catalog inspection: no grants, writes, accounts, or tokens.
-- Copy the single setup_report result back for diagnosis.
with app_functions as (
  select p.*, n.nspname as schema_name,
    pg_get_userbyid(p.proowner) as owner_name
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where (n.nspname = 'public' and p.proname in
    ('create_club_plan', 'rename_club_plan', 'guard_club_plan_identity', 'party_map_user_id'))
    or (n.nspname = 'auth' and p.proname = 'uid')
), checked_roles as (
  select r.* from pg_roles r
  where r.rolname in ('authenticated', 'anon', 'party_map_plan_writer')
    or r.oid in (select proowner from app_functions)
)
select jsonb_pretty(jsonb_build_object(
  'database', current_database(),
  'sql_editor_role', current_user,
  'roles', coalesce((select jsonb_agg(jsonb_build_object(
    'name', r.rolname, 'login', r.rolcanlogin,
    'bypass_rls', r.rolbypassrls,
    'auth_schema_usage', has_schema_privilege(r.oid, a.oid, 'USAGE'),
    'public_schema_usage', has_schema_privilege(r.oid, p.oid, 'USAGE')
  ) order by r.rolname)
    from checked_roles r
    cross join pg_namespace a cross join pg_namespace p
    where a.nspname = 'auth' and p.nspname = 'public'), '[]'::jsonb),
  'functions', coalesce((select jsonb_agg(jsonb_build_object(
    'schema', f.schema_name, 'name', f.proname,
    'arguments', pg_get_function_identity_arguments(f.oid),
    'owner', f.owner_name, 'security_definer', f.prosecdef,
    'settings', f.proconfig, 'definition', pg_get_functiondef(f.oid),
    'role_execute', (select jsonb_object_agg(r.rolname,
      has_function_privilege(r.oid, f.oid, 'EXECUTE')) from checked_roles r)
  ) order by f.schema_name, f.proname, f.oid) from app_functions f), '[]'::jsonb),
  'plans_table', (select jsonb_build_object(
    'owner', pg_get_userbyid(c.relowner),
    'rls_enabled', c.relrowsecurity, 'rls_forced', c.relforcerowsecurity,
    'role_privileges', (select jsonb_agg(jsonb_build_object(
      'name', r.rolname,
      'select', has_table_privilege(r.oid, c.oid, 'SELECT'),
      'insert', has_table_privilege(r.oid, c.oid, 'INSERT'),
      'update', has_table_privilege(r.oid, c.oid, 'UPDATE'),
      'delete', has_table_privilege(r.oid, c.oid, 'DELETE')
    ) order by r.rolname) from checked_roles r)
  ) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'club_plans'),
  'policies', coalesce((select jsonb_agg(to_jsonb(p)) from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'club_plans'), '[]'::jsonb),
  'triggers', coalesce((select jsonb_agg(jsonb_build_object(
    'name', t.tgname, 'enabled', t.tgenabled,
    'trigger_definition', pg_get_triggerdef(t.oid),
    'function_definition', pg_get_functiondef(t.tgfoid),
    'function_owner', pg_get_userbyid(f.proowner)
  )) from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_proc f on f.oid = t.tgfoid
    where n.nspname = 'public' and c.relname = 'club_plans'
      and not t.tgisinternal), '[]'::jsonb)
)) as setup_report;
