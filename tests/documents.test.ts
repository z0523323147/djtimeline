import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {documentFromNotes,documentModel,validateDocument} from '../src/lib/documents.ts';
import {parseNotes} from '../src/lib/parser.ts';
test('canonical notes retain timeline parity and stable song identities through corrections',()=>{
 const raw=readFileSync('src/data/example-notes.txt','utf8');const doc=documentFromNotes(raw);
 assert.deepEqual(JSON.parse(JSON.stringify(documentModel(doc),(k,v)=>k==='uid'?undefined:v)),parseNotes(raw));const song=doc.events.find(e=>e.kind==='song')!;const uid=song.uid;
 if(song.kind==='song')song.title='Corrected (remix) --- literal';
 assert.equal(documentModel(doc).tracks[0].title,'Corrected (remix) --- literal');assert.equal(doc.events.find(e=>e.uid===uid)?.uid,uid);
});
test('empty genre sections remain selectable without invented times, invalid IDs and titles fail',()=>{
 const doc=documentFromNotes('(Hip hop)');const model=documentModel(doc);assert.equal(model.sections.length,1);assert.equal(model.sections[0].time,'Unscheduled');assert.equal(model.tracks.length,0);
 assert.throws(()=>validateDocument({version:1,events:[...doc.events,doc.events[0]]}));
 const songDoc=documentFromNotes('Song');const e=songDoc.events[0];if(e.kind==='song')e.title=' ';assert.throws(()=>validateDocument(songDoc));
});
