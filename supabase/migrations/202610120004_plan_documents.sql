-- Run once after migration 003 in Supabase SQL Editor as postgres.
-- Additive upgrade: preserves existing plans and backfills blank documents.
begin;
do $$ begin
  if to_regprocedure('public.party_map_user_id()') is null then
    raise exception 'Apply migration 003 before the plan documents upgrade';
  end if;
end; $$;
create function public.valid_club_plan_document(doc jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare e jsonb;
begin
  if jsonb_typeof(doc) is distinct from 'object' or doc->'version' is distinct from '1'::jsonb
    or jsonb_typeof(doc->'events') is distinct from 'array' or octet_length(doc::text)>2000000 then return false; end if;
  if jsonb_array_length(doc->'events')>10000 then return false; end if;
  for e in select value from jsonb_array_elements(doc->'events') loop
    if jsonb_typeof(e) is distinct from 'object' or coalesce(e->>'uid','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
    case e->>'kind'
      when 'time' then
        if jsonb_typeof(e->'value') is distinct from 'string' or coalesce(e->>'value','') !~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' then return false; end if;
      when 'genre' then
        if jsonb_typeof(e->'value') is distinct from 'string' or coalesce(char_length(btrim(e->>'value')),0) not between 1 and 120 or char_length(e->>'value')>120 or jsonb_typeof(e->'peak') is distinct from 'boolean' then return false; end if;
      when 'song' then
        if e ? 'peakOverride' and jsonb_typeof(e->'peakOverride') is distinct from 'boolean' then return false; end if;
        if jsonb_typeof(e->'title') is distinct from 'string' or jsonb_typeof(e->'originalTitle') is distinct from 'string'
          or coalesce(char_length(btrim(e->>'title')),0) not between 1 and 500 or char_length(e->>'title')>500
          or coalesce(char_length(btrim(e->>'originalTitle')),0) not between 1 and 500 or char_length(e->>'originalTitle')>500
          or jsonb_typeof(e->'isBanger') is distinct from 'boolean' or jsonb_typeof(e->'isToDownload') is distinct from 'boolean' or jsonb_typeof(e->'isMyIdea') is distinct from 'boolean' then return false; end if;
      when 'peak' then null;
      else return false;
    end case;
  end loop;
  return (select count(*)=count(distinct (value->>'uid')::uuid) from jsonb_array_elements(doc->'events'));
end;
$$;
revoke all on function public.valid_club_plan_document(jsonb) from public,anon,authenticated;
grant execute on function public.valid_club_plan_document(jsonb) to party_map_plan_writer;
create table public.club_plan_documents (
  plan_id uuid primary key references public.club_plans(id) on delete cascade,
  revision bigint not null default 0 check(revision>=0),
  document jsonb not null default '{"version":1,"events":[]}',
  constraint club_plan_document_valid check(public.valid_club_plan_document(document))
);
create table public.club_plan_save_receipts (
  plan_id uuid not null references public.club_plans(id) on delete cascade,
  operation_id uuid not null,
  expected_revision bigint not null,
  revision bigint not null,
  document jsonb not null,
  created_at timestamptz not null default now(),
  primary key(plan_id,operation_id)
);
alter table public.club_plans add column song_count integer not null default 0 check(song_count>=0);
alter table public.club_plan_documents enable row level security;
alter table public.club_plan_documents force row level security;
alter table public.club_plan_save_receipts enable row level security;
alter table public.club_plan_save_receipts force row level security;
revoke all on public.club_plan_documents, public.club_plan_save_receipts from public,anon,authenticated;
grant select on public.club_plan_documents to authenticated;
grant select,insert,update on public.club_plan_documents to party_map_plan_writer;
grant select,insert,delete on public.club_plan_save_receipts to party_map_plan_writer;
create policy documents_read_own on public.club_plan_documents for select to authenticated,party_map_plan_writer
 using(exists(select 1 from public.club_plans p where p.id=plan_id and p.owner_id=(select public.party_map_user_id())));
create policy documents_insert_own on public.club_plan_documents for insert to party_map_plan_writer
 with check(exists(select 1 from public.club_plans p where p.id=plan_id and p.owner_id=(select public.party_map_user_id())));
create policy documents_update_own on public.club_plan_documents for update to party_map_plan_writer
 using(exists(select 1 from public.club_plans p where p.id=plan_id and p.owner_id=(select public.party_map_user_id())))
 with check(exists(select 1 from public.club_plans p where p.id=plan_id and p.owner_id=(select public.party_map_user_id())));
create policy receipts_own on public.club_plan_save_receipts for all to party_map_plan_writer
 using(exists(select 1 from public.club_plans p where p.id=plan_id and p.owner_id=(select public.party_map_user_id())))
 with check(exists(select 1 from public.club_plans p where p.id=plan_id and p.owner_id=(select public.party_map_user_id())));
insert into public.club_plan_documents(plan_id) select id from public.club_plans;
create function public.initialize_club_plan_document() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 insert into public.club_plan_documents(plan_id) values(new.id);
 return new;
end; $$;
revoke all on function public.initialize_club_plan_document() from public,anon,authenticated;
grant execute on function public.initialize_club_plan_document() to party_map_plan_writer;
create trigger club_plan_initialize_document after insert on public.club_plans for each row execute function public.initialize_club_plan_document();
create function public.save_club_plan_document(p_plan_id uuid,p_owner_id uuid,p_expected_revision bigint,p_operation_id uuid,p_document jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid := public.party_map_user_id(); current_doc public.club_plan_documents%rowtype; receipt public.club_plan_save_receipts%rowtype; result jsonb;
begin
 if owner is null or p_owner_id is distinct from owner then raise exception 'Account changed or sign in required' using errcode='42501'; end if;
 if p_operation_id is null or p_expected_revision is null or not public.valid_club_plan_document(p_document) then raise exception 'Invalid plan document or operation' using errcode='22023'; end if;
 perform 1 from public.club_plans where id=p_plan_id and owner_id=owner for update;
 if not found then raise exception 'Plan unavailable' using errcode='42501'; end if;
 select * into receipt from public.club_plan_save_receipts where plan_id=p_plan_id and operation_id=p_operation_id;
 if found then
   if receipt.expected_revision is distinct from p_expected_revision or receipt.document is distinct from p_document then raise exception 'Operation ID reused with different content' using errcode='22023'; end if;
   return jsonb_build_object('plan_id',p_plan_id,'revision',receipt.revision,'document',receipt.document);
 end if;
 select * into current_doc from public.club_plan_documents where plan_id=p_plan_id for update;
 if not found then raise exception 'Plan document missing; apply migration 004' using errcode='22023'; end if;
 if current_doc.revision<>p_expected_revision then raise exception 'Plan changed elsewhere. Your draft has been kept.' using errcode='40001'; end if;
 update public.club_plan_documents set document=p_document,revision=revision+1 where plan_id=p_plan_id returning * into current_doc;
 update public.club_plans set song_count=(select count(*) from jsonb_array_elements(p_document->'events') e where e->>'kind'='song') where id=p_plan_id;
 insert into public.club_plan_save_receipts(plan_id,operation_id,expected_revision,revision,document) values(p_plan_id,p_operation_id,p_expected_revision,current_doc.revision,p_document);
 -- Receipts remain for 30 days; older retries safely conflict on their stale revision.
 delete from public.club_plan_save_receipts where plan_id=p_plan_id and created_at<now()-interval '30 days';
 result := jsonb_build_object('plan_id',p_plan_id,'revision',current_doc.revision,'document',current_doc.document);
 return result;
end; $$;
grant create on schema public to party_map_plan_writer;
alter function public.save_club_plan_document(uuid,uuid,bigint,uuid,jsonb) owner to party_map_plan_writer;
revoke create on schema public from party_map_plan_writer;
revoke all on function public.save_club_plan_document(uuid,uuid,bigint,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_club_plan_document(uuid,uuid,bigint,uuid,jsonb) to authenticated;
create function public.create_club_plan_with_document(p_id uuid,p_name text,p_owner_id uuid,p_document jsonb)
returns public.club_plans language plpgsql security definer set search_path='' as $$
declare result public.club_plans;
begin
 if not public.valid_club_plan_document(p_document) then raise exception 'Invalid plan document' using errcode='22023'; end if;
 perform public.create_club_plan(p_id,p_name,p_owner_id);
 perform public.save_club_plan_document(p_id,p_owner_id,0,p_id,p_document);
 select * into result from public.club_plans where id=p_id and owner_id=public.party_map_user_id();
 return result;
end; $$;
grant create on schema public to party_map_plan_writer;
alter function public.create_club_plan_with_document(uuid,text,uuid,jsonb) owner to party_map_plan_writer;
revoke create on schema public from party_map_plan_writer;
revoke all on function public.create_club_plan_with_document(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.create_club_plan_with_document(uuid,text,uuid,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
select count(*) as existing_plans_with_documents from public.club_plan_documents;
