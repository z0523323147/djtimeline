import type {AccountService,AccountUser} from './account.ts';
import {accountError} from './account.ts';
import {validateDocument,type PlanDocument,type PlanSnapshot} from './documents.ts';
export type PendingSave={id:string;revision:number;document:PlanDocument};
export type CachedPlan={revision:number;document:PlanDocument;pending:PendingSave|null;dirty:boolean};
export function cacheKey(service:AccountService,owner:string,plan:string){return 'party-map-cache-'+(service.cacheNamespace??'default')+'-'+owner+'-'+plan;}
export function readCachedPlan(storage:Storage,key:string):CachedPlan|null{
 const raw=storage.getItem(key);if(!raw)return null;const c=JSON.parse(raw);
 if(!Number.isSafeInteger(c.revision)||c.revision<0||typeof c.dirty!=='boolean')throw new Error('Invalid cached revision.');
 validateDocument(c.document);
 if(c.pending){if(!/^[0-9a-f-]{36}$/i.test(c.pending.id)||!Number.isSafeInteger(c.pending.revision)||c.pending.revision<0)throw new Error('Invalid cached save.');validateDocument(c.pending.document);}
 return c;
}
export class PlanSync {
 state:CachedPlan|null=null; saving=false; conflict=false; storageAvailable=true; error=''; status='';
 private listeners=new Set<()=>void>(); private online:()=>boolean; private storage:()=>Storage;
 service:AccountService;user:AccountUser;planId:string;
 constructor(service:AccountService,user:AccountUser,planId:string,storage:()=>Storage=()=>localStorage,online:()=>boolean=()=>navigator.onLine){this.service=service;this.user=user;this.planId=planId;this.storage=storage;this.online=()=>Boolean(service.localOnly)||online();}
 subscribe(fn:()=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn);};}
 private emit(){this.listeners.forEach(fn=>fn());}
 private persist(){if(!this.state)return;try{this.storage().setItem(cacheKey(this.service,this.user.id,this.planId),JSON.stringify(this.state));this.storageAvailable=true;}catch{this.storageAvailable=false;if(this.state.dirty&&!this.online())this.status='Kept for this session — export before closing';}this.emit();}
 async load(){
  try{if(!this.state){this.state=readCachedPlan(this.storage(),cacheKey(this.service,this.user.id,this.planId));if(!this.state){const raw=this.storage().getItem('party-map-draft-'+this.user.id+'-'+this.planId);if(raw){const draft=JSON.parse(raw);if(Number.isSafeInteger(draft.revision)&&draft.revision>=0){this.state={revision:draft.revision,document:validateDocument(draft.document),pending:draft.pending??null,dirty:true};this.persist();}}}}}catch{this.storageAvailable=false;}
  if(!this.online()){if(!this.state)throw new Error('This plan is not cached. Open it once with internet.');this.status=this.state.dirty?'Saved on this device — waiting for connection':'Cached plan — offline';this.emit();return;}
  try{
   const snapshot=await this.service.loadDocument(this.planId);
   if(this.state?.dirty){
    // A retained pending receipt may already be committed. Retry it before comparing revisions.
    if(!this.state.pending && this.state.revision!==snapshot.revision){this.conflict=true;this.status='Changed elsewhere — local changes kept';}
   }else this.state={revision:snapshot.revision,document:snapshot.document,pending:null,dirty:false};
   this.persist();if(!this.state.dirty)this.status=this.service.localOnly?(this.service.persistentSession?'Saved on this browser':'Kept for this session'):'Saved to account';this.emit();if(this.state.dirty&&!this.conflict)void this.flush();
  }catch(e){if(!this.state)throw e;this.error=accountError(e);this.status='Cached plan — could not refresh';this.emit();}
 }
 commit(document:PlanDocument){if(!this.state)throw new Error('Open the plan first.');this.state.document=validateDocument(document);this.state.dirty=true;this.error='';this.status=this.online()?'Saving…':'Saved on this device — waiting for connection';this.persist();void this.flush();}
 async flush(){
  if(this.saving||this.conflict||!this.state?.dirty)return;
  if(!this.online()){this.status='Saved on this device — waiting for connection';this.persist();return;}
  this.saving=true;this.error='';this.status='Saving…';this.emit();
  try{
   const owner=await this.service.getUser();if(owner?.id!==this.user.id)throw new Error('Sign in to the original account to sync these changes.');
   while(this.state.dirty){
    this.state.pending??={id:crypto.randomUUID(),revision:this.state.revision,document:structuredClone(this.state.document)};this.persist();
    const pending=this.state.pending;
    const saved:PlanSnapshot=await this.service.saveDocument(this.planId,this.user.id,pending.revision,pending.id,pending.document);
    // PostgreSQL jsonb returns keys in a different order; compare canonical documents.
    this.state.revision=saved.revision;this.state.pending=null;this.state.dirty=JSON.stringify(validateDocument(this.state.document))!==JSON.stringify(validateDocument(saved.document));this.persist();
   }
   this.status='Saved to account';
  }catch(e){this.conflict=(e as {code?:string}).code==='40001';this.error=accountError(e);this.status=this.conflict?'Changed elsewhere — local changes kept':'Save failed — Retry';this.persist();}
  finally{this.saving=false;this.emit();}
 }
 async refresh(){
  if(!this.online()||this.saving||this.state?.dirty)return;
  try{const snapshot=await this.service.loadDocument(this.planId);if(this.saving||this.state?.dirty)return;if(!this.state||snapshot.revision>this.state.revision){this.state={revision:snapshot.revision,document:snapshot.document,pending:null,dirty:false};this.status=this.service.localOnly?'Saved on this browser':'Updated from account';this.persist();}}catch{/* A failed refresh must not destroy a cached plan or an editor. */}
 }
 async discardAndReload(){const snapshot=await this.service.loadDocument(this.planId);this.state={revision:snapshot.revision,document:snapshot.document,pending:null,dirty:false};this.conflict=false;this.error='';this.status='Saved to account';this.persist();}
}
const controllers=new WeakMap<AccountService,Map<string,PlanSync>>();
export function planSync(service:AccountService,user:AccountUser,plan:string){let map=controllers.get(service);if(!map){map=new Map();controllers.set(service,map);}const key=user.id+'/'+plan;let sync=map.get(key);if(!sync){sync=new PlanSync(service,user,plan);map.set(key,sync);}return sync;}
export function reconnectPlans(service:AccountService,user:string){for(const [key,sync]of controllers.get(service)??[])if(key.startsWith(user+'/'))void sync.flush();}
