-- Run once after 004. Preserves every existing plan and document.
-- Supports track-first v2 alongside imported v1; old clients cannot downgrade v2.
begin;
alter function public.valid_club_plan_document(jsonb) rename to valid_club_plan_document_v1;
create function public.valid_club_plan_document(doc jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare e jsonb; t jsonb; next_start integer;
begin
 if doc->'version' not in ('1'::jsonb,'2'::jsonb) or doc->'version' is null then return false; end if;
 if not public.valid_club_plan_document_v1(jsonb_set(doc,'{version}','1')) then return false; end if;
 for e in select value from jsonb_array_elements(doc->'events') loop
  if e ? 'genreOverride' then
   if doc->'version'<>'2'::jsonb or e->>'kind'<>'song' or jsonb_typeof(e->'genreOverride') is distinct from 'string' or coalesce(char_length(btrim(e->>'genreOverride')),0) not between 1 and 120 or char_length(e->>'genreOverride')>120 then return false; end if;
  end if;
  if e ? 'timing' then
   t:=e->'timing';
   if doc->'version'<>'2'::jsonb or e->>'kind'<>'song' or jsonb_typeof(t) is distinct from 'object' then return false; end if;
   if jsonb_typeof(t->'start') is distinct from 'number' or coalesce(t->>'start','') !~ '^[0-9]{1,5}$' then return false; end if;
   if (t->>'start')::integer>10080 or jsonb_typeof(t->'genre') is distinct from 'string' or coalesce(char_length(btrim(t->>'genre')),0) not between 1 and 120 or char_length(t->>'genre')>120 then return false; end if;
   if t ? 'end' then
    if jsonb_typeof(t->'end') is distinct from 'number' or coalesce(t->>'end','') !~ '^[0-9]{1,5}$' then return false; end if;
    if (t->>'end')::integer <= (t->>'start')::integer or (t->>'end')::integer>10080 then return false; end if;
   end if;
  end if;
 end loop;
 -- All values are validated before casts. Stable array order breaks same-minute ties.
 for e in select value from jsonb_array_elements(doc->'events') with ordinality s(value,n) where value ? 'timing' order by (value->'timing'->>'start')::integer,n loop
  if e->'timing' ? 'end' then
   select min((value->'timing'->>'start')::integer) into next_start from jsonb_array_elements(doc->'events') where value ? 'timing' and value->>'uid'<>e->>'uid' and (value->'timing'->>'start')::integer >= (e->'timing'->>'start')::integer;
   if next_start is not null and (e->'timing'->>'end')::integer>next_start then return false; end if;
  end if;
 end loop;
 return true;
end; $$;
revoke all on function public.valid_club_plan_document(jsonb) from public,anon,authenticated;
grant execute on function public.valid_club_plan_document(jsonb) to party_map_plan_writer;
alter table public.club_plan_documents drop constraint club_plan_document_valid;
alter table public.club_plan_documents add constraint club_plan_document_valid check(public.valid_club_plan_document(document));
create function public.prevent_plan_document_downgrade() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if old.document->'version'='2'::jsonb and new.document->'version'='1'::jsonb then raise exception 'This plan uses track timing. Update your Party Map HTML before saving.' using errcode='22023'; end if;
 return new;
end; $$;
revoke all on function public.prevent_plan_document_downgrade() from public,anon,authenticated;
grant execute on function public.prevent_plan_document_downgrade() to party_map_plan_writer;
create trigger plan_document_no_downgrade before update on public.club_plan_documents for each row execute function public.prevent_plan_document_downgrade();
create function public.list_club_plan_genres() returns setof text language sql stable security invoker set search_path='' as $$
 select distinct genre from (
  select case when e->>'kind'='genre' then e->>'value' else coalesce(e->'timing'->>'genre',e->>'genreOverride') end genre
  from public.club_plan_documents d join public.club_plans p on p.id=d.plan_id cross join lateral jsonb_array_elements(d.document->'events') e
  where p.owner_id=public.party_map_user_id()
 ) g where genre is not null order by genre;
$$;
revoke all on function public.list_club_plan_genres() from public,anon;
grant execute on function public.list_club_plan_genres() to authenticated;
notify pgrst,'reload schema';
commit;
