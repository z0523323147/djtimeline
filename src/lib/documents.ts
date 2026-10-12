import type { NotesRecord, Model, Track, Section } from './parser.ts';
import { deriveRecords, noteRecords } from './parser.ts';
export type PlanEvent = NotesRecord & { uid: string; originalValue?:string; genreOverride?:string; timing?: {start: number; end?: number; genre: string} };
export interface PlanDocument { version: 1 | 2; events: PlanEvent[] }
export interface PlanSnapshot { plan_id: string; revision: number; document: PlanDocument }
export const blankDocument = (): PlanDocument => ({version:1,events:[]});
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateDocument(input: unknown): PlanDocument {
  const doc = input as PlanDocument;
  if (!doc || ![1,2].includes(doc.version) || !Array.isArray(doc.events) || doc.events.length > 10000 || new TextEncoder().encode(JSON.stringify(doc)).length > 2000000) throw new Error('Invalid or oversized plan document.');
  const ids = new Set<string>();
  for (const e of doc.events) {
    if (!e || !uuid.test(e.uid) || ids.has(e.uid.toLowerCase())) throw new Error('Invalid or repeated song/section identity.');
    ids.add(e.uid.toLowerCase());
    const text = (value: unknown, max: number) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
    if (e.kind === 'time') { if (!/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(e.value)) throw new Error('Invalid time marker.'); }
    else if (e.kind === 'genre') { if (!text(e.value,120) || typeof e.peak !== 'boolean') throw new Error('Invalid genre.'); }
    else if (e.kind === 'song') { if (!text(e.title,500) || !text(e.originalTitle,500) || [e.isBanger,e.isToDownload,e.isMyIdea].some(v=>typeof v !== 'boolean')) throw new Error('Invalid song.'); }
    if(e.originalValue!==undefined&&(doc.version!==2||e.kind!=='time'||typeof e.originalValue!=='string'||!/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(e.originalValue)))throw new Error('Invalid original time marker.');
    if(e.genreOverride!==undefined&&(doc.version!==2||e.kind!=='song'||!text(e.genreOverride,120)))throw new Error('Invalid genre override.');
    if (e.timing !== undefined) {
      if (doc.version !== 2 || e.kind !== 'song' || !Number.isInteger(e.timing.start) || e.timing.start < 0 || e.timing.start > 10080 || !text(e.timing.genre,120) || (e.timing.end !== undefined && (!Number.isInteger(e.timing.end) || e.timing.end <= e.timing.start || e.timing.end > 10080))) throw new Error('Invalid track time or genre.');
    }
    if (e.kind==='song' && e.peakOverride!==undefined && typeof e.peakOverride!=='boolean') throw new Error('Invalid peak override.');
    else if (e.kind !== 'song' && e.kind !== 'genre' && e.kind !== 'time' && e.kind !== 'peak') throw new Error('Unknown plan event.');
  }
  const timed = doc.events.filter(e=>e.timing).sort((a,b)=>a.timing!.start-b.timing!.start);
  timed.forEach(e=>{if(e.timing!.end !== undefined && timed.some(other=>other.uid!==e.uid&&other.timing!.start>=e.timing!.start&&e.timing!.end!>other.timing!.start)) throw new Error('End time overlaps the next track. Shorten the end or change the start.');});
  return {version:doc.version,events:doc.events.map(e=>{
    if(e.kind==='time')return {uid:e.uid,kind:e.kind,value:e.value,...(e.originalValue===undefined?{}:{originalValue:e.originalValue})};
    if(e.kind==='genre')return {uid:e.uid,kind:e.kind,value:e.value,peak:e.peak};
    if(e.kind==='peak')return {uid:e.uid,kind:e.kind};
    return {uid:e.uid,kind:e.kind,title:e.title,originalTitle:e.originalTitle,isBanger:e.isBanger,isToDownload:e.isToDownload,isMyIdea:e.isMyIdea,...(e.peakOverride===undefined?{}:{peakOverride:e.peakOverride}),...(e.genreOverride?{genreOverride:e.genreOverride}:{}),...(e.timing?{timing:{start:e.timing.start,genre:e.timing.genre,...(e.timing.end===undefined?{}:{end:e.timing.end})}}:{})};
  })};
}
export function documentFromNotes(raw: string): PlanDocument {
  return validateDocument({version:1,events:noteRecords(raw).map(e=>({...e,uid:crypto.randomUUID()}))});
}
export function documentModel(doc: PlanDocument): Model {
  validateDocument(doc);
  const legacy=doc.events.some(e=>e.originalValue!==undefined)?deriveRecords(doc.events,true,true):deriveRecords(doc.events,true);
  const songs=doc.events.filter(e=>e.kind==='song');
  legacy.tracks.forEach((t,i)=>t.uid=songs[i].uid);
  if(doc.version===1)return legacy;
  const tracks:Track[]=legacy.tracks.map((t,i)=>{
    const timing=songs[i].timing;
    if(songs[i].genreOverride)t.genre=songs[i].genreOverride!;
    return timing?{...t,start:timing.start,end:timing.end??timing.start,time:formatTime(timing.start),genre:timing.genre,exact:true,boundStart:timing.start,boundEnd:timing.start,authored:true,explicitEnd:timing.end}:t;
  }).sort((a,b)=>a.start-b.start||a.id-b.id);
  for(let i=0;i<tracks.length;i++){
    const t=tracks[i];
    if(t.authored && t.explicitEnd===undefined)t.end=tracks.slice(i+1).find(next=>next.exact)?.start??t.start;
    t.id=i+1;
  }
  const sections:Section[]=[];
  for(const t of tracks){
    let s=sections.at(-1);
    if(!s || s.genre.trim().toLocaleLowerCase()!==t.genre.trim().toLocaleLowerCase() || s.end<t.start){
      s={id:sections.length,genre:t.genre,start:t.start,end:t.end,exact:t.exact,boundStart:t.boundStart,boundEnd:t.boundEnd,time:t.time,tracks:[]};sections.push(s);
    }
    s.end=Math.max(s.end,t.end); t.sectionId=s.id;s.tracks.push(t);
  }
  const blocks=tracks.map((t,i)=>{t.blockId=i;return {id:i,time:t.time,start:t.start,end:t.end,tracks:[t]};});
  return {tracks,sections,blocks,clock24:legacy.clock24||tracks.every(t=>t.authored)};
}
export function formatTime(minute:number){return String(Math.floor(minute/60)%24).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');}
export function clockMinute(value:string,day=0){if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))throw new Error('Enter a time as HH:mm.');const [h,m]=value.split(':').map(Number);return h*60+m+day*1440;}
export function eventForTrack(doc:PlanDocument,track:Track){return doc.events.find(e=>e.uid===track.uid);}
export function putTrack(doc:PlanDocument,input:{uid?:string;title:string;genre:string;start?:number;end?:number;peak:boolean;download:boolean;idea:boolean}):PlanDocument{
  if(input.start===undefined&&!input.uid)throw new Error('Enter a start time.');
  const old=input.uid?doc.events.find(e=>e.uid===input.uid):undefined;
  if(input.uid&&!old)throw new Error('This track is no longer available. Close and reopen the editor.');
  const event:PlanEvent={uid:old?.uid??crypto.randomUUID(),kind:'song',title:input.title.trim(),originalTitle:old?.kind==='song'?old.originalTitle:input.title.trim(),isBanger:input.peak,peakOverride:input.peak,isToDownload:input.download,isMyIdea:input.idea,...(input.start===undefined?{genreOverride:input.genre.trim()}:{timing:{start:input.start,genre:input.genre.trim(),...(input.end===undefined?{}:{end:input.end})}})};
  return validateDocument({version:2,events:old?doc.events.map(e=>e.uid===old.uid?event:e):[...doc.events,event]});
}
export function songEvent(doc: PlanDocument, numericId: number) { return doc.events.filter(e=>e.kind==='song')[numericId-1]; }

export function alignNoteClock(doc:PlanDocument,afternoon:boolean):PlanDocument{
 const times=deriveRecords(doc.events,true).blocks.filter(b=>b.time!=='Unscheduled');
 if(!times.length)return doc;
 const offset=times[0].start%720+(afternoon?720:0)-times[0].start;
 let i=0;
 return validateDocument({version:2,events:doc.events.map(e=>e.kind==='time'?{...e,originalValue:e.originalValue??e.value,value:formatTime(times[i++].start+offset)}:e)});
}
