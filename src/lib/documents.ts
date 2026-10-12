import type { NotesRecord } from './parser.ts';
import { deriveRecords, noteRecords } from './parser.ts';
export type PlanEvent = NotesRecord & { uid: string };
export interface PlanDocument { version: 1; events: PlanEvent[] }
export interface PlanSnapshot { plan_id: string; revision: number; document: PlanDocument }
export const blankDocument = (): PlanDocument => ({version:1,events:[]});
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateDocument(input: unknown): PlanDocument {
  const doc = input as PlanDocument;
  if (!doc || doc.version !== 1 || !Array.isArray(doc.events) || doc.events.length > 10000 || new TextEncoder().encode(JSON.stringify(doc)).length > 2000000) throw new Error('Invalid or oversized plan document.');
  const ids = new Set<string>();
  for (const e of doc.events) {
    if (!e || !uuid.test(e.uid) || ids.has(e.uid.toLowerCase())) throw new Error('Invalid or repeated song/section identity.');
    ids.add(e.uid.toLowerCase());
    const text = (value: unknown, max: number) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
    if (e.kind === 'time') { if (!/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(e.value)) throw new Error('Invalid time marker.'); }
    else if (e.kind === 'genre') { if (!text(e.value,120) || typeof e.peak !== 'boolean') throw new Error('Invalid genre.'); }
    else if (e.kind === 'song') { if (!text(e.title,500) || !text(e.originalTitle,500) || [e.isBanger,e.isToDownload,e.isMyIdea].some(v=>typeof v !== 'boolean')) throw new Error('Invalid song.'); }
    if (e.kind==='song' && e.peakOverride!==undefined && typeof e.peakOverride!=='boolean') throw new Error('Invalid peak override.');
    else if (e.kind !== 'song' && e.kind !== 'genre' && e.kind !== 'time' && e.kind !== 'peak') throw new Error('Unknown plan event.');
  }
  return doc;
}
export function documentFromNotes(raw: string): PlanDocument {
  return validateDocument({version:1,events:noteRecords(raw).map(e=>({...e,uid:crypto.randomUUID()}))});
}
export const documentModel = (doc: PlanDocument) => deriveRecords(validateDocument(doc).events,true);
export function songEvent(doc: PlanDocument, numericId: number) { return doc.events.filter(e=>e.kind==='song')[numericId-1]; }
