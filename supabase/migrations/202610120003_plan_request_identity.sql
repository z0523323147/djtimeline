-- Apply to the existing Party Map schema as postgres in Supabase SQL Editor.
-- Repair confirmed writer auth_schema_usage=false without changing Auth grants.
-- Preserves plans, RLS, RPC ownership, grants and immutable identities.
begin;

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='create_club_plan'
      and pg_get_function_identity_arguments(p.oid)='p_id uuid, p_name text, p_owner_id uuid'
      and pg_get_userbyid(p.proowner)='party_map_plan_writer' and p.prosecdef) then
    raise exception 'Expected restricted create_club_plan function not found; stop and inspect setup';
  end if;
end;
$$;

-- Same subject lookup as auth.uid() in the supplied live diagnostic.
-- Supabase Data API verifies the JWT and sets these transaction-local claims.
-- No user-supplied owner parameter determines the returned identity.
create or replace function public.party_map_user_id()
returns uuid language sql stable security invoker set search_path = ''
as $$
  select coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.sub', true), ''),
    (nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid;
$$;
revoke all on function public.party_map_user_id() from public, anon, authenticated;
grant execute on function public.party_map_user_id() to authenticated, party_map_plan_writer;

alter policy club_plans_read_own on public.club_plans
  using (owner_id = (select public.party_map_user_id()));
alter policy club_plans_writer_insert_own on public.club_plans
  with check (owner_id = (select public.party_map_user_id()));
alter policy club_plans_writer_update_own on public.club_plans
  using (owner_id = (select public.party_map_user_id()))
  with check (owner_id = (select public.party_map_user_id()));

-- CREATE OR REPLACE retains the existing restricted owner and execute grants.
create or replace function public.create_club_plan(p_id uuid, p_name text, p_owner_id uuid)
returns public.club_plans
language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid := public.party_map_user_id();
  v_name text := pg_catalog.btrim(p_name);
  v_plan public.club_plans%rowtype;
begin
  if v_owner is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  -- The client captures the account before beginning a create. If its SDK
  -- obtains a different account's token later, reject this stale request.
  if p_owner_id is distinct from v_owner then
    raise exception 'Account changed; create cancelled' using errcode = '42501';
  end if;
  if p_id is null or v_name is null
     or pg_catalog.char_length(v_name) not between 1 and 160 then
    raise exception 'A plan UUID and name of 1 to 160 characters are required'
      using errcode = '22023';
  end if;

  -- Caller retains the same UUID when retrying an ambiguous response.
  -- A duplicate create never renames an existing plan or changes its owner.
  insert into public.club_plans (id, owner_id, name)
    values (p_id, v_owner, v_name)
    on conflict (id) do nothing;
  select * into v_plan from public.club_plans
    where id = p_id and owner_id = v_owner;
  if not found then
    raise exception 'Plan unavailable' using errcode = '42501';
  end if;
  return v_plan;
end;
$$;

create or replace function public.rename_club_plan(p_id uuid, p_name text)
returns public.club_plans
language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid := public.party_map_user_id();
  v_name text := pg_catalog.btrim(p_name);
  v_plan public.club_plans%rowtype;
begin
  if v_owner is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  if p_id is null or v_name is null
     or pg_catalog.char_length(v_name) not between 1 and 160 then
    raise exception 'A plan UUID and name of 1 to 160 characters are required'
      using errcode = '22023';
  end if;
  update public.club_plans set name = v_name
    where id = p_id and owner_id = v_owner returning * into v_plan;
  if not found then
    raise exception 'Plan unavailable' using errcode = '42501';
  end if;
  return v_plan;
end;
$$;

-- Validate identity lookup as the actual restricted writer before committing.
-- Synthetic claims only: no users or plan rows are created/read here.
set local role party_map_plan_writer;
set local request.jwt.claim.sub = '';
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111"}';
do $$
begin
  if public.party_map_user_id() is distinct from '11111111-1111-4111-8111-111111111111'::uuid then
    raise exception 'Writer JSON-claim identity lookup failed';
  end if;
end;
$$;
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
do $$
begin
  if public.party_map_user_id() is distinct from '22222222-2222-4222-8222-222222222222'::uuid then
    raise exception 'Writer subject-claim precedence failed';
  end if;
end;
$$;
set local request.jwt.claim.sub = '';
set local request.jwt.claims = '';
do $$
begin
  if public.party_map_user_id() is not null then
    raise exception 'Missing claims must not identify a user';
  end if;
end;
$$;
reset role;
notify pgrst, 'reload schema';
commit;

select
  has_function_privilege('party_map_plan_writer', 'public.party_map_user_id()', 'EXECUTE') as writer_identity_ready,
  has_function_privilege('authenticated', 'public.party_map_user_id()', 'EXECUTE') as caller_identity_ready,
  not has_function_privilege('anon', 'public.create_club_plan(uuid,text,uuid)', 'EXECUTE') as anonymous_create_blocked;
