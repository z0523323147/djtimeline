import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAuthStorage} from '../src/lib/auth-storage.ts';
function port(){const entries=new Map<string,string>();return {entries,getItem:(k:string)=>entries.get(k)??null,setItem:(k:string,v:string)=>{entries.set(k,v);},removeItem:(k:string)=>{entries.delete(k);}};}
test('auth reads observe external account switches and logout instead of stale memory',()=>{
 const p=port(),s=createAuthStorage(()=>p);s.setItem('session','A');assert.equal(s.getItem('session'),'A');p.entries.set('session','B');assert.equal(s.getItem('session'),'B');p.entries.delete('session');assert.equal(s.getItem('session'),null);
});
test('initially denied storage uses an isolated session-only store that signs out',()=>{
 const s=createAuthStorage(()=>{throw new Error('Blocked');});assert.equal(s.persistentSession,false);s.setItem('session','A');assert.equal(s.getItem('session'),'A');s.removeItem('session');assert.equal(s.getItem('session'),null);
});
test('failed persistence clears older credentials before falling back to memory',()=>{
 const p=port();p.entries.set('session','A');p.setItem=()=>{throw new Error('Quota');};const s=createAuthStorage(()=>p);s.setItem('session','B');assert.equal(p.entries.has('session'),false);assert.equal(s.persistentSession,false);assert.equal(s.getItem('session'),'B');s.removeItem('session');assert.equal(s.getItem('session'),null);
});
test('blocked read/logout/replacement does not silently reuse or retain a persisted login',()=>{
 const p=port(),s=createAuthStorage(()=>p);s.setItem('session','A');assert.equal(s.getItem('session'),'A');p.getItem=()=>{throw new Error('Blocked');};assert.throws(()=>s.getItem('session'),/Could not read/);
 p.removeItem=()=>{throw new Error('Blocked');};assert.throws(()=>s.removeItem('session'),/Sign-out could not clear/);assert.equal(p.entries.get('session'),'A');p.setItem=()=>{throw new Error('Blocked');};assert.throws(()=>s.setItem('session','B'),/Could not replace or clear/);
});
