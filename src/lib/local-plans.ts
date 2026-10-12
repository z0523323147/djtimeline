import type {AccountService,PrivatePlan} from './account.ts';
import {blankDocument,validateDocument,documentFromNotes,documentModel,type PlanSnapshot} from './documents.ts';
import {importedKey,loadCorrections} from './storage.ts';
const owner='00000000-0000-4000-8000-000000000000';
const storageKey='party-map-local-plans';
interface LocalData {plans:PrivatePlan[];documents:Record<string,PlanSnapshot>;receipts?:Record<string,PlanSnapshot|{revision:number;fingerprint:string}>}
export function createLocalPlanService():AccountService {
 let durable=true, corrupt=false;
 let data:LocalData={plans:[],documents:{},receipts:{}};
 function read(){
  if(!durable)return;
  try {
   const raw=localStorage.getItem(storageKey);if(!raw)return;
   const saved=JSON.parse(raw) as LocalData;
   if(!Array.isArray(saved.plans)||!saved.documents||typeof saved.documents!=='object')throw new Error('Invalid local plans.');
   if(saved.plans.some(p=>typeof p.id!=='string'||typeof p.name!=='string'||!saved.documents[p.id]))throw new Error('Invalid local plan metadata.');
   for(const s of Object.values(saved.documents)){validateDocument(s.document);if(!Number.isSafeInteger(s.revision)||s.revision<0)throw new Error('Invalid revision.');}
   data=saved;data.receipts??={};
  }catch{durable=false;corrupt=true;}
 }
 function persist(){
  // Preserve unreadable original bytes for recovery instead of overwriting with empty data.
  if(corrupt)return;
  try{localStorage.setItem(storageKey,JSON.stringify(data));durable=true;}catch{durable=false;}
 }
 read();
 // Existing imported data remains a named set, not an automatically opened dashboard.
 try {
  const raw=localStorage.getItem(importedKey);
  const id='00000000-0000-4000-8000-000000000001';
  if(raw&&!data.plans.some(p=>p.id===id)){
   const document=documentFromNotes(raw),model=documentModel(document);loadCorrections(localStorage,raw,model);
   let i=0;document.events=document.events.map(e=>e.kind==='song'?{...e,title:model.tracks[i++].title}:e);
   const now=new Date().toISOString();data.plans.push({id,name:'Local set',created_at:now,updated_at:now,song_count:model.tracks.length});
   data.documents[id]={plan_id:id,revision:0,document};persist();
  }
 }catch{durable=false;}
 const service:AccountService={
  localOnly:true,cacheNamespace:'local',get persistentSession(){return durable;},
  async getUser(){return {id:owner,email:'On this browser'};},subscribe(){return()=>{};},
  async signIn(){throw new Error('Local planner has no login.');},async signUp(){return false;},async signOut(){},
  async listPlans(_,page){read();return data.plans.slice(page*50,page*50+50);},
  async listGenres(){read();return [...new Set(Object.values(data.documents).flatMap(s=>documentModel(s.document).tracks.map(t=>t.genre)))];},
  async createPlanDocument(id,name,_,document){
   document=validateDocument(document);read();
   if(!data.documents[id]){
    const now=new Date().toISOString();data.plans.unshift({id,name,created_at:now,updated_at:now,song_count:documentModel(document).tracks.length});
    data.documents[id]={plan_id:id,revision:0,document};persist();
   }
   return data.plans.find(p=>p.id===id)!;
  },
  async createPlan(id,name,user){return service.createPlanDocument(id,name,user,blankDocument());},
  async loadDocument(id){read();const s=data.documents[id];if(!s)throw new Error('Local plan unavailable.');return structuredClone(s);},
  async saveDocument(id,_,revision,operation,document){
   document=validateDocument(document);
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(document)));
   const fingerprint=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');read();
   const receipt=data.receipts?.[id+'/'+operation];if(receipt){const matches='document' in receipt?JSON.stringify(receipt.document)===JSON.stringify(document):receipt.fingerprint===fingerprint;if(!matches)throw new Error('Operation reused with different content.');return {plan_id:id,revision:receipt.revision,document:structuredClone(document)};}
   const snapshot=data.documents[id];
   if(!snapshot||snapshot.revision!==revision)throw Object.assign(new Error('Plan changed elsewhere.'),{code:'40001'});
   data.documents[id]={plan_id:id,revision:revision+1,document:structuredClone(document)};
   const plan=data.plans.find(p=>p.id===id)!;plan.song_count=documentModel(document).tracks.length;plan.updated_at=new Date().toISOString();
   data.receipts??={};data.receipts[id+'/'+operation]={revision:revision+1,fingerprint};
   const receipts=Object.keys(data.receipts);while(receipts.length>256)delete data.receipts[receipts.shift()!];
   persist();return structuredClone(data.documents[id]);
  },
  async renamePlan(id,name){read();const plan=data.plans.find(p=>p.id===id);if(plan){plan.name=name;persist();}}
 };
 return service;
}
