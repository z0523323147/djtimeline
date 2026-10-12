<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { AccountService, AccountUser, PrivatePlan } from '../lib/account';
  import { accountError } from '../lib/account';
  import { blankDocument, documentFromNotes, documentModel, songEvent, validateDocument, type PlanDocument, type PlanEvent } from '../lib/documents';
  import { emptyFilters } from '../lib/search';
  import { copyTitle } from '../lib/clipboard';
  import TrackDialog from '../components/TrackDialog.svelte';
  import {planSync} from '../lib/plan-sync';
  import {downloadBackup} from '../lib/backups';
  import {putTrack,eventForTrack,alignNoteClock,formatTime} from '../lib/documents';
  import type { Track } from '../lib/parser';
  import PartyPage from './PartyPage.svelte';
  import TracksPage from './TracksPage.svelte';
  export let service: AccountService;
  export let user: AccountUser;
  export let plan: PrivatePlan;
  export let onOpen: (plan:PrivatePlan)=>void;
  export let onBack: () => void;
  export let knownGenres:string[]=[];
  export let onChanged:()=>void=()=>{};
  export let onDirty: (dirty: boolean) => void;
  let document = blankDocument(), revision = 0, loading = true, saving = false, dirty = false, conflict = false;
  let error = '', status = '', storageAvailable = true, alive = true;
  let pending: {id:string;revision:number;document:PlanDocument} | null = null;
  let selected = 0, allTracks = false, filters = emptyFilters();
  let rulerFocused = false;
  let heading: HTMLHeadingElement | undefined;
  let importDialog:HTMLDialogElement | undefined;
  let importText='', importName='', importNew=true, importError='';
  let importDoc:PlanDocument|null=null, importId:string|null=null;
  let copyOperation:{id:string;document:PlanDocument}|null=null;
  let undoImport:PlanDocument|null=null;
  let undo:{event:PlanEvent;previous:string|null;next:string|null}|null=null;
  let menuOpen=false, renaming=false, renameName=plan.name;
  let trackDialog:TrackDialog;let clockDialog:HTMLDialogElement;
  const sync=planSync(service,user,plan.id);
  let genre = '', time = '', title = '', destination = '', peak = false, download = false, idea = false;
  const draftKey = `party-map-draft-${user.id}-${plan.id}`;
  $: model = documentModel(document);
  $: genres = document.events.filter(e=>e.kind==='genre');
  function refreshSync(){if(!alive)return;if(sync.state){const anchor=model.sections[selected]?.tracks[0]?.uid;document=sync.state.document;if(anchor){const updated=documentModel(document).tracks.find(t=>t.uid===anchor);if(updated)selected=updated.sectionId;}revision=sync.state.revision;dirty=sync.state.dirty;}saving=sync.saving;conflict=sync.conflict;error=sync.error;status=sync.status;storageAvailable=sync.storageAvailable;onDirty(dirty&&!storageAvailable);if(!dirty)onChanged();}
  function commit(next:PlanDocument){sync.commit(next);refreshSync();}
  async function load(restore=true){loading=true;error='';try{if(restore)await sync.load();else await sync.discardAndReload();refreshSync();}catch(e){error=accountError(e);}finally{loading=false;}}
  onMount(()=>{alive=true;const stop=sync.subscribe(refreshSync);void load();const refresh=()=>void sync.refresh();const poll=setInterval(refresh,15000);window.addEventListener('focus',refresh);const guard=(e:BeforeUnloadEvent)=>{if(dirty&&!storageAvailable){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',guard);return()=>{clearInterval(poll);window.removeEventListener('focus',refresh);alive=false;stop();window.removeEventListener('beforeunload',guard);onDirty(false);};});
  async function saveDocument(){await sync.flush();refreshSync();}
  function saveTrack(input:Parameters<typeof putTrack>[1]){const next=putTrack(document,input);commit(next);const track=documentModel(next).tracks.find(t=>t.uid===(input.uid??next.events.at(-1)?.uid));selected=track?.sectionId??0;allTracks=false;filters=emptyFilters();}
  function findEvent(id:number){const track=model.tracks.find(t=>t.id===id);return track?eventForTrack(document,track):undefined;}
  function correct(id:number,value:string) {
    const event=findEvent(id);if(!event)return;
    commit({...document,events:document.events.map(e=>e.uid===event.uid && e.kind==='song'?{...e,title:value}:e)});
  }
  function updateFlags(id:number,flags:{isBanger:boolean;isToDownload:boolean;isMyIdea:boolean}) { const e=findEvent(id);if(e)commit({...document,events:document.events.map(record=>record.uid===e.uid && record.kind==='song'?{...record,...flags,peakOverride:flags.isBanger}:record)}); }
  function removeSong(id:number) {const e=findEvent(id);if(e){const index=document.events.findIndex(record=>record.uid===e.uid);undo={event:structuredClone(e),previous:document.events[index-1]?.uid??null,next:document.events[index+1]?.uid??null};commit({...document,events:document.events.filter(record=>record.uid!==e.uid)});}}
  function undoRemoval(){if(!undo)return;const events=[...document.events];let index=events.findIndex(e=>e.uid===undo!.next);if(index<0){const previous=events.findIndex(e=>e.uid===undo!.previous);index=previous<0?events.length:previous+1;}events.splice(index,0,undo.event);commit({...document,events});undo=null;}
  async function rename() {if(!renameName.trim() || saving)return;saving=true;try{await service.renamePlan(plan.id,renameName.trim());if(alive){plan={...plan,name:renameName.trim()};renaming=false;status='Plan renamed';onChanged();}}catch(e){if(alive)error=accountError(e);}finally{if(alive)saving=false;}}
  async function select(id:number){
    selected=id;rulerFocused=true;allTracks=false;filters=emptyFilters();await tick();
    const parent=heading?.closest<HTMLElement>('.cloud-plan');
    const dock=parent?.querySelector('.timeline-dock');
    if(dock)parent?.style.setProperty('--timeline-offset',(dock.getBoundingClientRect().height+16)+'px');
    heading?.scrollIntoView({block:'start',behavior:'instant'});heading?.focus({preventScroll:true});
  }
  function followSection(id:number){selected=id;rulerFocused=true;}
  async function copy(track:Track){try{await copyTitle(track.title);status='Track name copied.';}catch{error='Copy unavailable. Select the track name and copy it manually.';}}
  async function copyAsPlan() {
    if(saving)return;
    copyOperation ??= {id:crypto.randomUUID(),document:structuredClone(document)};
    saving=true;error='';
    try {const created=await service.createPlanDocument(copyOperation.id,(plan.name+' copy').slice(0,120),user.id,copyOperation.document);if(alive){onDirty(false);onOpen(created);}}
    catch(e){if(alive)error=accountError(e);}finally{if(alive)saving=false;}
  }
  function previewImport(){try{if(importText.length>500000)throw new Error('Keep notes under 500,000 characters.');importDoc=documentFromNotes(importText);if(!documentModel(importDoc).tracks.length)throw new Error('Add at least one track.');importError='';importId=crypto.randomUUID();}catch(e){importError=accountError(e);importDoc=null;}}
  async function readImport(e:Event){const file=(e.currentTarget as HTMLInputElement).files?.[0];if(!file)return;if(file.size>500000){importError='Choose a text file smaller than 500 KB.';return;}try{importText=await file.text();importDoc=null;}catch{importError='Could not read file.';}}
  async function applyImport(){
    if(!importDoc || saving)return;
    if(importNew){saving=true;importError='';try{const created=await service.createPlanDocument(importId!,importName.trim(),user.id,importDoc);if(alive){importDialog?.close();onOpen(created);}}catch(e){if(alive)importError=accountError(e);}finally{if(alive)saving=false;}}
    else{undo=null;undoImport=structuredClone(document);try{localStorage.setItem('party-map-before-import-'+user.id+'-'+plan.id,JSON.stringify({name:plan.name,document}));}catch{downloadBackup([{name:plan.name,document}],'party-map-before-import.json');}commit({...importDoc,version:document.version===2?2:importDoc.version});importDialog?.close();selected=0;filters=emptyFilters();}
  }
  function exportDraft(){menuOpen=false;downloadBackup([{name:plan.name,document,pending:dirty}]);}

</script>
<section class="cloud-plan" aria-labelledby="cloud-plan-title">
  <div class="plan-toolbar"><div><h2 id="cloud-plan-title" dir="auto">{plan.name}</h2><p role="status">{status}</p></div><div class="header-actions"><button onclick={onBack}>My plans</button>{#if dirty && error}<button disabled={saving || conflict || loading} onclick={saveDocument}>{saving?'Saving…':'Retry save'}</button>{/if}<button class="add-track-button" disabled={loading||!sync.state} onclick={()=>{if(document.events.some(e=>e.kind==='time')&&!model.clock24)clockDialog.showModal();else trackDialog.open();}}>+ Add track</button><details class="plan-actions" bind:open={menuOpen}><summary aria-label="More plan actions">More</summary><div><button onclick={()=>{menuOpen=false;renaming=!renaming;}} disabled={loading || saving}>Rename plan</button><button disabled={loading || dirty || saving} onclick={()=>{menuOpen=false;importText='';importDoc=null;importError='';importNew=true;importName=plan.name+' imported';importDialog?.showModal();}}>Import notes</button><button onclick={exportDraft} disabled={loading}>Export plan</button></div></details></div></div>
  {#if renaming}<form class="new-plan-form" onsubmit={e=>{e.preventDefault();void rename();}}><div><label for="rename-name">Plan name</label><input id="rename-name" bind:value={renameName} maxlength="120" required dir="auto"/></div><button type="submit" disabled={saving}>Save name</button><button type="button" onclick={()=>renaming=false}>Cancel</button></form>{/if}
  {#if undoImport}<button onclick={()=>{if(undoImport){commit({...undoImport,version:document.version===2?2:undoImport.version});undoImport=null;}}}>Undo import replacement</button>{/if}
  {#if undo}<button onclick={undoRemoval}>Undo track removal</button>{/if}

  {#if error}<p class="account-error" role="alert">{error}</p>{/if}
  {#if conflict}<button disabled={saving} onclick={copyAsPlan}>Save draft as a new plan</button><button disabled={saving} onclick={()=>{if(confirm('Discard this draft and load the version saved in your account? Export the draft first if you want to keep it.'))void load(false);}}>Discard draft and load account version</button>{/if}
  {#if !storageAvailable}<p role="status">Browser storage is unavailable. Offline recovery lasts only for this session. Export pending changes before closing.</p>{/if}
  {#if loading}<p role="status">Loading plan…</p>
  {:else if !error || document.events.length}
    {#if model.tracks.length}<PartyPage {model} {selected} focused={rulerFocused} resetScale={()=>rulerFocused=false} {select}/>{/if}
    <TracksPage onSectionVisible={followSection} {model} {selected} {allTracks} showAll={()=>{allTracks=true;filters=emptyFilters();}} bind:filters {storageAvailable} emptyHint="Add your first track or import notes" {select} save={correct} {updateFlags} {removeSong} {copy} editTrack={t=>trackDialog.open(findEvent(t.id),{genre:t.genre,peak:t.isBanger})} bind:heading/>
  {:else}<button onclick={()=>load()}>Retry opening plan</button>{/if}
  <dialog bind:this={clockDialog} aria-labelledby="clock-choice-title"><h2 id="clock-choice-title">Match your note times</h2><p>Choose when the first recorded time means. This aligns your notes with new track times.</p><div class="dialog-actions"><button onclick={()=>clockDialog.close()}>Cancel</button><button onclick={()=>{commit(alignNoteClock(document,false));clockDialog.close();trackDialog.open();}}>{formatTime((model.blocks.find(b=>b.time!=='Unscheduled')?.start??0)%720)} · night / morning</button><button onclick={()=>{commit(alignNoteClock(document,true));clockDialog.close();trackDialog.open();}}>{formatTime((model.blocks.find(b=>b.time!=='Unscheduled')?.start??0)%720+720)} · afternoon / evening</button></div></dialog>
  <TrackDialog draftKey={'party-map-track-draft-'+(service.cacheNamespace??'default')+'-'+user.id+'-'+plan.id} bind:this={trackDialog} genres={[...knownGenres,...model.tracks.map(t=>t.genre)]} onSave={saveTrack}/>
  <dialog bind:this={importDialog} aria-labelledby="cloud-import-title">
    <h2 id="cloud-import-title">Import notes into your account</h2>
    <label for="cloud-import-text">Set notes</label><textarea id="cloud-import-text" bind:value={importText} oninput={()=>{importDoc=null;importId=null;}}></textarea>
    <label for="cloud-import-file">Text file</label><input id="cloud-import-file" type="file" accept=".txt,text/plain" onchange={readImport}/>
    <button onclick={previewImport} disabled={saving}>Preview import</button>
    {#if importDoc}
      <p>{documentModel(importDoc).tracks.length} tracks · {documentModel(importDoc).sections.length} genre sections</p>
      <ul>{#each documentModel(importDoc).tracks.slice(0,3) as track}<li dir="auto">{track.title}</li>{/each}</ul>
      <label class="song-flags"><input type="checkbox" bind:checked={importNew}/>Create a new plan</label>
      {#if importNew}<label for="cloud-import-name">New plan name</label><input id="cloud-import-name" bind:value={importName} maxlength="120"/>
      {:else}<p>Replace all content in <strong dir="auto">{plan.name}</strong>. This replaces the plan content and saves automatically. A recovery copy is kept on this browser.</p>{/if}
    {/if}
    {#if importError}<p role="alert" class="account-error">{importError}</p>{/if}
    <div class="dialog-actions"><button disabled={saving} onclick={()=>importDialog?.close()}>Cancel</button><button disabled={saving || !importDoc || (importNew && !importName.trim())} onclick={applyImport}>{saving?'Importing…':importNew?'Create imported plan':'Replace this plan content'}</button></div>
  </dialog>
</section>
