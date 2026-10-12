import {test} from 'node:test';import assert from 'node:assert/strict';
import {blankDocument,putTrack,documentModel,documentFromNotes,validateDocument} from '../src/lib/documents.ts';
import {PlanSync,readCachedPlan,cacheKey} from '../src/lib/plan-sync.ts';
import {validateBackup} from '../src/lib/backups.ts';
import type {AccountService} from '../src/lib/account.ts';
const input=(title:string,genre:string,start:number,end?:number)=>({title,genre,start,end,peak:false,download:false,idea:false});
test('automatic sections merge genres, retain gaps, infer ends and preserve stable identity',()=>{
 let doc=putTrack(blankDocument(),input('First','House',60,67));doc=putTrack(doc,input('Second','Hip hop',72));
 let m=documentModel(doc);assert.equal(m.sections[0].end,67);assert.equal(m.sections[1].start,72);assert.equal(m.tracks[1].end,72);
 const id=doc.events[0].uid;doc=putTrack(doc,{...input('First edited','House',60),uid:id});doc=putTrack(doc,input('Middle','house',65));m=documentModel(doc);
 assert.equal(m.sections.length,2);assert.equal(m.sections[0].tracks.length,2);assert.equal(m.sections[0].end,72);assert.equal(m.tracks[0].uid,id);
 assert.throws(()=>putTrack(doc,input('Overlap','Dance',66,80)),/overlaps/);
 assert.throws(()=>putTrack(doc,input('Bad','Dance',100,99)),/Invalid track/);
});
test('overnight, retrospective insert and uncertain imported source retain evidence',()=>{
 let doc=putTrack(blankDocument(),input('Late','House',1438));doc=putTrack(doc,input('After midnight','Hip hop',1443));doc=putTrack(doc,input('Earlier','House',1430));
 const model=documentModel(doc);assert.deepEqual(model.tracks.map(t=>t.start),[1430,1438,1443]);assert.equal(model.tracks[2].time,'00:03');assert.equal(model.sections.length,2);
 const imported=documentFromNotes('1:00\n(House)\nA\n(Hip hop)\nB\n1:10\nC');const original=documentModel(imported).tracks[1];
 const updated=putTrack(imported,input('Extra','Edm',100));const track=documentModel(updated).tracks.find(t=>t.title==='B')!;assert.equal(track.exact,false);assert.equal(track.boundStart,original.boundStart);assert.equal(track.boundEnd,original.boundEnd);assert.ok(updated.events.some(e=>e.kind==='time'));
});
test('backup strips forged ownership and rejects invalid or secret-shaped content',()=>{
 const b=validateBackup({format:'party-map',version:1,token:'secret',plans:[{name:'Party',owner_id:'foreign',document:putTrack(blankDocument(),input('Track','House',60))}]});
 assert.equal((b as any).token,undefined);assert.equal((b.plans[0] as any).owner_id,undefined);assert.equal(documentModel(b.plans[0].document).tracks[0].time,'01:00');assert.throws(()=>validateBackup({format:'party-map',version:99,plans:[]}));
 const invalid={version:1,events:[{...b.plans[0].document.events[0]}]};assert.throws(()=>validateDocument(invalid));
});
function harness(){let online=false,owner='A',rev=0,saved=blankDocument(),failure:any=null;const map=new Map<string,string>();const calls:any[]=[];const receipts=new Map<string,any>();
 const service={cacheNamespace:'test',getUser:async()=>({id:owner,email:'test'}),loadDocument:async()=>({plan_id:'plan',revision:rev,document:saved}),saveDocument:async(plan:string,user:string,revision:number,id:string,document:any)=>{calls.push({plan,user,revision,id});if(failure){const e=failure;failure=null;throw e;}if(receipts.has(id))return receipts.get(id);if(revision!==rev)throw Object.assign(new Error('Conflict'),{code:'40001'});saved=structuredClone(document);const result={plan_id:plan,revision:++rev,document:saved};receipts.set(id,result);return result;}} as unknown as AccountService;
 const storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>map.set(k,v)} as unknown as Storage;
 const sync=new PlanSync(service,{id:'A',email:'test'},'plan',()=>storage,()=>online);
 return {sync,service,storage,calls,setOnline:(v:boolean)=>online=v,setOwner:(v:string)=>owner=v,fail:(e:any)=>failure=e,external:()=>rev++};
}
test('offline complete snapshots and pending edits survive reload and sync once online',async()=>{
 const h=harness();h.setOnline(true);await h.sync.load();h.setOnline(false);h.sync.commit(putTrack(blankDocument(),input('Cached','House',60)));
 assert.equal(h.calls.length,0);const recovered=new PlanSync(h.service,{id:'A',email:'test'},'plan',()=>h.storage,()=>false);await recovered.load();assert.equal(documentModel(recovered.state!.document).tracks[0].title,'Cached');
 h.setOnline(true);await h.sync.flush();assert.equal(h.calls.length,1);assert.equal(h.sync.state!.dirty,false);assert.equal(readCachedPlan(h.storage,cacheKey(h.service,'A','plan'))!.dirty,false);
});
test('failed saves retain operation IDs; foreign accounts and conflicts cannot replay',async()=>{
 const h=harness();h.setOnline(true);await h.sync.load();h.setOnline(false);h.sync.commit(putTrack(blankDocument(),input('Queued','House',60)));h.setOnline(true);h.fail(new Error('Network'));await h.sync.flush();const id=h.sync.state!.pending!.id;await h.sync.flush();assert.equal(h.calls[1].id,id);
 h.setOnline(false);h.sync.commit(putTrack(h.sync.state!.document,input('More','House',65)));h.setOnline(true);h.setOwner('B');await h.sync.flush();assert.equal(h.calls.length,2);assert.equal(h.sync.state!.dirty,true);h.setOwner('A');h.external();await h.sync.flush();assert.equal(h.sync.conflict,true);assert.equal(h.sync.state!.dirty,true);
});

test('track times interpolate across periods, retain authored starts, and never invent a final ending',async()=>{const {trackTiming}=await import('../src/lib/timeline.ts');const tracks=documentModel(documentFromNotes('1:00\n(House)\nOne\nTwo\nThree\n1:12\nLast')).tracks;assert.equal(trackTiming(tracks[0]).text,'01:00 → ~01:04');assert.equal(trackTiming(tracks[1]).text,'~01:04 → ~01:08');assert.equal(trackTiming(tracks[2]).text,'~01:08 → ~01:12');assert.equal(trackTiming(tracks[3]).text,'01:12');const doc=putTrack(putTrack(blankDocument(),input('A','House',60)),input('B','House',65));assert.equal(trackTiming(documentModel(doc).tracks[0]).text,'01:00 → ~01:05');});

test('chosen night/afternoon note clock preserves provenance and aligns new exact tracks',async()=>{const {alignNoteClock}=await import('../src/lib/documents.ts');const original=documentFromNotes('12:30\n(House)\nA\n1:00\nB\n4:00\nC');const night=alignNoteClock(original,false);assert.equal(documentModel(night).blocks[0].start,30);assert.equal(documentModel(night).clock24,true);assert.equal(night.events[0].originalValue,'12:30');const withTrack=putTrack(night,input('At one','House',60));assert.equal(documentModel(withTrack).tracks.find(t=>t.title==='At one')!.start,60);assert.equal(documentModel(alignNoteClock(original,true)).blocks[0].start,750);const {parseNotes}=await import('../src/lib/parser.ts');assert.equal(parseNotes('23:58\nA\n00:03\nB').blocks[1].start,1443);});

test('jsonb key ordering acknowledges a save without writing repeatedly',async()=>{
 const h=harness();h.setOnline(true);await h.sync.load();h.setOnline(false);h.sync.commit(putTrack(blankDocument(),input('One save','House',60)));
 const save=h.service.saveDocument;let count=0;h.service.saveDocument=async(...args)=>{if(++count>1)throw new Error('Repeated save');const result=await save(...args);const reorder=(v:any):any=>Array.isArray(v)?v.map(reorder):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,value])=>[k,reorder(value)])):v;return {...result,document:reorder(result.document)};};
 h.setOnline(true);await h.sync.flush();assert.equal(count,1);assert.equal(h.sync.state!.dirty,false);assert.equal(h.sync.status,'Saved to account');
});
