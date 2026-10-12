import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const a='11111111-1111-4111-8111-111111111111', b='22222222-2222-4222-8222-222222222222';
const plan='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const doc={version:1,events:[{uid:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',kind:'genre',value:'Hip hop',peak:false},{uid:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',kind:'song',title:'כך זה אופק',originalTitle:'כך זה אופק',isBanger:false,isToDownload:true,isMyIdea:false}]};
test('PostgreSQL upgrade, restricted writer, owner isolation and revisioned document saves',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon nologin;create role authenticated nologin;create role supabase_auth_admin nologin;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}');create function auth.uid() returns uuid language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub'))::uuid$$;`);
  for(const name of ['202610120001_private_plans.sql','202610120003_plan_request_identity.sql'])await db.exec(readFileSync('supabase/migrations/'+name,'utf8'));
  async function session(owner:string|null,sql:string,params:unknown[]=[]){
   await db.exec('begin');
   try{await db.query("select set_config('request.jwt.claims',$1,true)",[owner?JSON.stringify({sub:owner}):'']);await db.exec('set local role '+(owner?'authenticated':'anon'));const r=await db.query(sql,params);await db.exec('commit');return r.rows as any[];}catch(e){await db.exec('rollback');throw e;}
  }
  await session(a,'select public.create_club_plan($1,$2,$3)',[plan,'Existing party',a]);
  await db.exec('revoke usage on schema auth from party_map_plan_writer');
  assert.equal((await db.query<{ok:boolean}>("select has_schema_privilege('party_map_plan_writer','auth','USAGE') as ok")).rows[0].ok,false);
  await db.exec(readFileSync('supabase/migrations/202610120004_plan_documents.sql','utf8'));
  await db.exec(readFileSync('supabase/migrations/202610120005_track_timing.sql','utf8'));
  const loaded=await session(a,'select * from public.club_plan_documents where plan_id=$1',[plan]);assert.equal(loaded[0].revision,0);assert.deepEqual(loaded[0].document,{version:1,events:[]});
  assert.equal((await session(b,'select * from public.club_plan_documents where plan_id=$1',[plan])).length,0);
  await assert.rejects(session(null,'select * from public.club_plan_documents'),/permission denied/);
  await assert.rejects(session(a,'update public.club_plan_documents set revision=99 where plan_id=$1',[plan]),/permission denied/);
  const op='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const save='select public.save_club_plan_document($1,$2,$3,$4,$5) as saved';
  const args=[plan,a,0,op,JSON.stringify(doc)];
  const result=(await session(a,save,args))[0].saved;assert.equal(result.revision,1);assert.deepEqual(result.document,doc);
  assert.deepEqual((await session(a,save,args))[0].saved,result);
  await assert.rejects(session(a,save,[plan,a,0,op,JSON.stringify({...doc,events:[]})]),/Operation ID reused/);
  await assert.rejects(session(b,save,[plan,b,1,crypto.randomUUID(),JSON.stringify(doc)]),/Plan unavailable/);
  await assert.rejects(session(b,save,[plan,a,1,crypto.randomUUID(),JSON.stringify(doc)]),/Account changed/);
  await assert.rejects(session(a,save,[plan,a,0,crypto.randomUUID(),JSON.stringify(doc)]),/changed elsewhere/);
  await assert.rejects(session(a,save,[plan,a,1,crypto.randomUUID(),JSON.stringify({...doc,events:[...doc.events,doc.events[0]]})]),/Invalid plan document/);
  const persisted=(await session(a,'select * from public.club_plan_documents where plan_id=$1',[plan]))[0];assert.deepEqual(persisted.document,doc);assert.equal(persisted.revision,1);
  assert.equal((await session(a,'select song_count from public.club_plans where id=$1',[plan]))[0].song_count,1);
  const importedPlan=crypto.randomUUID();
  const create='select to_jsonb(public.create_club_plan_with_document($1,$2,$3,$4)) as plan';
  const imported=(await session(a,create,[importedPlan,'Imported',a,JSON.stringify(doc)]))[0].plan;assert.equal(imported.song_count,1);
  await session(a,create,[importedPlan,'Imported',a,JSON.stringify(doc)]);
  assert.deepEqual((await session(a,'select document from public.club_plan_documents where plan_id=$1',[importedPlan]))[0].document,doc);
  const badId=crypto.randomUUID();await assert.rejects(session(a,create,[badId,'Invalid',a,JSON.stringify({version:1,events:[{kind:'song'}]})]),/Invalid plan document/);
  assert.equal((await session(a,'select * from public.club_plans where id=$1',[badId])).length,0);
  const nextPlan=crypto.randomUUID();await session(a,'select public.create_club_plan($1,$2,$3)',[nextPlan,'New party',a]);assert.equal((await session(a,'select * from public.club_plan_documents where plan_id=$1',[nextPlan])).length,1);
  const timed={version:2,events:[{...doc.events[1],timing:{start:60,end:67,genre:'House'}},{...doc.events[1],uid:crypto.randomUUID(),timing:{start:72,genre:'Hip hop'}}]};
  const timingResult=(await session(a,save,[plan,a,1,crypto.randomUUID(),JSON.stringify(timed)]))[0].saved;assert.equal(timingResult.revision,2);
  await assert.rejects(session(a,save,[plan,a,2,crypto.randomUUID(),JSON.stringify(doc)]),/Update your Party Map/);
  const overlap=structuredClone(timed);overlap.events[0].timing.end=73;
  await assert.rejects(session(a,save,[plan,a,2,crypto.randomUUID(),JSON.stringify(overlap)]),/Invalid plan document/);
  assert.deepEqual((await session(a,'select * from public.list_club_plan_genres()')).map(r=>r.list_club_plan_genres),['Hip hop','House']);
  assert.deepEqual(await session(b,'select * from public.list_club_plan_genres()'),[]);
 }finally{await db.close();}
});
