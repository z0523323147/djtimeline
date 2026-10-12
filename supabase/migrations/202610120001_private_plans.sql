-- Initial private account area: metadata only, not song/document persistence.
-- Apply once through the Supabase SQL Editor after reviewing the empty project.
-- Fail on existing object names rather than changing an unrelated schema.
begin;

create role party_map_plan_writer nologin noinherit nobypassrls;
grant party_map_plan_writer to postgres;
grant usage on schema public, auth to party_map_plan_writer;
grant execute on function auth.uid() to party_map_plan_writer;

create table public.club_plans (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_plans_name_valid check (
    name = btrim(name) and char_length(name) between 1 and 160
  )
);

create index club_plans_owner_updated_idx
  on public.club_plans (owner_id, updated_at desc, id);
alter table public.club_plans enable row level security;
alter table public.club_plans force row level security;

revoke all on public.club_plans from public, anon, authenticated;
grant select on public.club_plans to authenticated;
grant select, insert, update on public.club_plans to party_map_plan_writer;

create policy club_plans_read_own on public.club_plans
  for select to authenticated, party_map_plan_writer
  using (owner_id = (select auth.uid()));
create policy club_plans_writer_insert_own on public.club_plans
  for insert to party_map_plan_writer
  with check (owner_id = (select auth.uid()));
create policy club_plans_writer_update_own on public.club_plans
  for update to party_map_plan_writer
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create function public.guard_club_plan_identity()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.owner_id is distinct from old.owner_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Plan identity cannot change' using errcode = '22023';
  end if;
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;
revoke all on function public.guard_club_plan_identity() from public, anon, authenticated;
create trigger club_plans_immutable_identity before update on public.club_plans
  for each row execute function public.guard_club_plan_identity();

create function public.create_club_plan(p_id uuid, p_name text, p_owner_id uuid)
returns public.club_plans
language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
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

create function public.rename_club_plan(p_id uuid, p_name text)
returns public.club_plans
language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
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

-- A dedicated owner limits definer privileges to this table's owner-scoped
-- SELECT/INSERT/UPDATE, rather than running browser RPCs as postgres.
-- PostgreSQL requires the new function owner to have CREATE on its schema
-- during transfer; remove that temporary permission in the same transaction.
grant create on schema public to party_map_plan_writer;
alter function public.create_club_plan(uuid, text, uuid) owner to party_map_plan_writer;
alter function public.rename_club_plan(uuid, text) owner to party_map_plan_writer;
revoke create on schema public from party_map_plan_writer;
grant execute on function public.guard_club_plan_identity() to party_map_plan_writer;
revoke all on function public.create_club_plan(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.rename_club_plan(uuid, text) from public, anon, authenticated;
grant execute on function public.create_club_plan(uuid, text, uuid) to authenticated;
grant execute on function public.rename_club_plan(uuid, text) to authenticated;

comment on table public.club_plans is
  'Private plan metadata only. Song documents and revisioned saving are a later migration.';
notify pgrst, 'reload schema';
commit;
