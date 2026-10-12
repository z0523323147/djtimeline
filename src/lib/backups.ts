import {validateDocument,type PlanDocument} from './documents.ts';
export interface BackupPlan {name:string;document:PlanDocument;pending?:boolean}
export interface PlanBackup {format:'party-map';version:1;plans:BackupPlan[]}
export function validateBackup(input:unknown):PlanBackup{
 const b=input as PlanBackup;if(!b||b.format!=='party-map'||b.version!==1||!Array.isArray(b.plans)||b.plans.length<1||b.plans.length>100)throw new Error('Choose a Party Map backup containing 1–100 plans.');
 if(new TextEncoder().encode(JSON.stringify(input)).length>20000000)throw new Error('Keep backups below 20 MB.');
 return {format:'party-map',version:1,plans:b.plans.map(p=>{if(typeof p.name!=='string'||!p.name.trim()||p.name.length>120)throw new Error('Invalid plan name.');return {name:p.name,document:validateDocument(p.document),...(p.pending?{pending:true}:{})};})};
}
export function downloadBackup(plans:BackupPlan[],filename='party-map-backup.json'){
 const payload=validateBackup({format:'party-map',version:1,plans});const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
