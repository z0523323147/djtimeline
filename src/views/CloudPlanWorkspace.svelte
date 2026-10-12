<script lang="ts">
  import { onMount } from 'svelte';
  import type { AccountService, AccountUser, PrivatePlan } from '../lib/account';
  import { accountError } from '../lib/account';
  import { blankDocument, documentFromNotes, documentModel, songEvent, validateDocument, type PlanDocument, type PlanEvent } from '../lib/documents';
  import { emptyFilters, filterActive } from '../lib/search';
  import { copyTitle } from '../lib/clipboard';
  import type { Track } from '../lib/parser';
  import PartyPage from './PartyPage.svelte';
  import TracksPage from './TracksPage.svelte';
  export let service: AccountService;
  export let user: AccountUser;
  export let plan: PrivatePlan;
  export let onOpen: (plan:PrivatePlan)=>void;
  export let onBack: () => void;
  export let onDirty: (dirty: boolean) => void;
  let document = blankDocument(), revision = 0, loading = true, saving = false, dirty = false, conflict = false;
  let error = '', status = '', storageAvailable = true, alive = true;
  let pending: {id:string;revision:number;document:PlanDocument} | null = null;
  let selected = 0, allTracks = false, filters = emptyFilters();
  let heading: HTMLHeadingElement | undefined;
  let importDialog:HTMLDialogElement | undefined;
  let importText='', importName='', importNew=true, importError='';
  let importDoc:PlanDocument|null=null, importId:string|null=null;
  let copyOperation:{id:string;document:PlanDocument}|null=null;
  let undo:{event:PlanEvent;previous:string|null;next:string|null}|null=null;
  let menuOpen=false, renaming=false, renameName=plan.name;
  let sectionForm=true,songForm=false;
  let genre = '', time = '', title = '', destination = '', peak = false, download = false, idea = false;
  const draftKey = `party-map-draft-${user.id}-${plan.id}`;
  $: model = documentModel(document);
  $: genres = document.events.filter(e=>e.kind==='genre');
  function keepDraft() {
    try { localStorage.setItem(draftKey,JSON.stringify({revision,document,pending})); storageAvailable=true; }
    catch { storageAvailable=false; }
  }
  function commit(next: PlanDocument) {
    try { document=validateDocument(next); dirty=true; status='Unsaved changes'; error=''; onDirty(true); keepDraft(); }
    catch(e) { error=accountError(e); }
  }
  async function load(restore = true) {
    loading=true; error='';
    try {
      const snapshot = await service.loadDocument(plan.id);
      if (!alive) return;
      document=snapshot.document; revision=snapshot.revision; dirty=false; conflict=false; pending=null; status='Loaded from your account';
      if (restore) {
        try {
          const raw=localStorage.getItem(draftKey);
          if (raw) {
            const draft=JSON.parse(raw);
            validateDocument(draft.document);
            if (JSON.stringify(draft.document)!==JSON.stringify(document)) {
              document=draft.document; dirty=true;
              conflict=draft.revision!==revision;
              if (!conflict && draft.pending?.id && draft.pending.revision===revision) pending={id:draft.pending.id,revision,document:validateDocument(draft.pending.document)};
              status=conflict?'Recovered draft; account version changed':'Recovered unsaved draft';
            } else localStorage.removeItem(draftKey);
          }
        } catch { storageAvailable=false; }
      } else { try {localStorage.removeItem(draftKey);} catch {storageAvailable=false;} }
      sectionForm=!document.events.length;songForm=false;
      destination=document.events.find(e=>e.kind==='genre')?.uid ?? '';
      onDirty(dirty);
    } catch(e) { if(alive) error=accountError(e)+' Apply the plan documents SQL (004) if setup is missing.'; }
    finally { if(alive) loading=false; }
  }
  onMount(()=>{
    alive=true; void load();
    const guard=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};
    window.addEventListener('beforeunload',guard);
    return ()=>{alive=false;window.removeEventListener('beforeunload',guard);onDirty(false);};
  });
  async function saveDocument() {
    if(saving || !dirty || conflict) return;
    pending ??= {id:crypto.randomUUID(),revision,document:structuredClone(document)};
    keepDraft(); saving=true; error=''; status='Saving…';
    try {
      const result=await service.saveDocument(plan.id,user.id,pending.revision,pending.id,pending.document);
      if(!alive)return;
      revision=result.revision; pending=null;
      dirty=JSON.stringify(document)!==JSON.stringify(result.document);
      status=dirty?'Earlier changes saved; save your latest changes':'Saved to your account';onDirty(dirty);
      if(dirty)keepDraft();else try{localStorage.removeItem(draftKey);}catch{storageAvailable=false;}
    }catch(e){if(alive){conflict=(e as {code?:string}).code==='40001';error=accountError(e);status=conflict?'Changed elsewhere — draft kept':'Save failed — draft kept';keepDraft();}}
    finally{if(alive)saving=false;}
  }
  function addSection() {
    if(!genre.trim())return;
    const events=[...document.events];
    if(time)events.push({uid:crypto.randomUUID(),kind:'time',value:time});
    const uid=crypto.randomUUID();events.push({uid,kind:'genre',value:genre.trim(),peak:false});
    commit({...document,events});destination=uid;genre='';time='';selected=documentModel(document).sections.length-1;sectionForm=false;songForm=true;
  }
  function addSong() {
    if(!title.trim() || !destination)return;
    const index=document.events.findIndex(e=>e.uid===destination && e.kind==='genre');
    if(index<0)return;
    const events=[...document.events];let end=events.findIndex((e,i)=>i>index && e.kind==='genre');if(end<0)end=events.length;
    // Put a song before the next section's preceding time marker.
    if(end>index+1 && events[end-1]?.kind==='time')end--;
    events.splice(end,0,{uid:crypto.randomUUID(),kind:'song',title:title.trim(),originalTitle:title.trim(),isBanger:peak,isToDownload:download,isMyIdea:idea});
    commit({...document,events});title='';peak=false;download=false;idea=false;songForm=false;
  }
  function correct(id:number,value:string) {
    const event=songEvent(document,id);if(!event)return;
    commit({...document,events:document.events.map(e=>e.uid===event.uid && e.kind==='song'?{...e,title:value}:e)});
  }
  function updateFlags(id:number,flags:{isBanger:boolean;isToDownload:boolean;isMyIdea:boolean}) { const e=songEvent(document,id);if(e)commit({...document,events:document.events.map(record=>record.uid===e.uid && record.kind==='song'?{...record,...flags,peakOverride:flags.isBanger}:record)}); }
  function removeSong(id:number) {const e=songEvent(document,id);if(e){const index=document.events.findIndex(record=>record.uid===e.uid);undo={event:structuredClone(e),previous:document.events[index-1]?.uid??null,next:document.events[index+1]?.uid??null};commit({...document,events:document.events.filter(record=>record.uid!==e.uid)});}}
  function undoRemoval(){if(!undo)return;const events=[...document.events];let index=events.findIndex(e=>e.uid===undo!.next);if(index<0){const previous=events.findIndex(e=>e.uid===undo!.previous);index=previous<0?events.length:previous+1;}events.splice(index,0,undo.event);commit({...document,events});undo=null;}
  async function rename() {if(!renameName.trim() || saving)return;saving=true;try{await service.renamePlan(plan.id,renameName.trim());if(alive){plan={...plan,name:renameName.trim()};renaming=false;status='Plan renamed';}}catch(e){if(alive)error=accountError(e);}finally{if(alive)saving=false;}}
  function select(id:number) {
    selected=id;allTracks=false;filters=emptyFilters();
    const first=model.sections[id]?.tracks[0];
    if(first){const event=songEvent(document,first.id);const index=document.events.findIndex(e=>e.uid===event?.uid);destination=document.events.slice(0,index).findLast(e=>e.kind==='genre')?.uid ?? destination;}
    else destination=genres.find(e=>e.kind==='genre' && e.value===model.sections[id]?.genre)?.uid ?? destination;
  }
  async function copy(track:Track){try{await copyTitle(track.title);status='Track name copied.';}catch{error='Copy unavailable. Select the track name and copy it manually.';}}
  async function copyAsPlan() {
    if(saving)return;
    copyOperation ??= {id:crypto.randomUUID(),document:structuredClone(document)};
    saving=true;error='';
    try {const created=await service.createPlanDocument(copyOperation.id,(plan.name+' copy').slice(0,120),user.id,copyOperation.document);if(alive){onDirty(false);onOpen(created);}}
    catch(e){if(alive)error=accountError(e);}finally{if(alive)saving=false;}
  }
  function previewImport(){try{if(importText.length>500000)throw new Error('Keep notes under 500,000 characters.');importDoc=documentFromNotes(importText);if(!documentModel(importDoc).tracks.length)throw new Error('Add at least one song.');importError='';importId=crypto.randomUUID();}catch(e){importError=accountError(e);importDoc=null;}}
  async function readImport(e:Event){const file=(e.currentTarget as HTMLInputElement).files?.[0];if(!file)return;if(file.size>500000){importError='Choose a text file smaller than 500 KB.';return;}try{importText=await file.text();importDoc=null;}catch{importError='Could not read file.';}}
  async function applyImport(){
    if(!importDoc || saving)return;
    if(importNew){saving=true;importError='';try{const created=await service.createPlanDocument(importId!,importName.trim(),user.id,importDoc);if(alive){importDialog?.close();onOpen(created);}}catch(e){if(alive)importError=accountError(e);}finally{if(alive)saving=false;}}
    else{undo=null;commit(importDoc);importDialog?.close();selected=0;filters=emptyFilters();destination=document.events.find(e=>e.kind==='genre')?.uid??'';}
  }
  function exportDraft(){menuOpen=false;const blob=new Blob([JSON.stringify({name:plan.name,document},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=window.document.createElement('a');a.href=url;a.download='party-plan-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
</script>
<section class="cloud-plan" aria-labelledby="cloud-plan-title">
  <div class="plan-toolbar"><div><h2 id="cloud-plan-title" dir="auto">{plan.name}</h2><p role="status">{status}</p></div><div class="header-actions"><button disabled={dirty || saving} onclick={onBack}>My plans</button><button disabled={!dirty || saving || conflict || loading} onclick={saveDocument}>{saving?'Saving…':'Save to account'}</button><details class="plan-actions" bind:open={menuOpen}><summary aria-label="More plan actions">More</summary><div><button onclick={()=>{menuOpen=false;renaming=!renaming;}} disabled={loading || saving}>Rename plan</button><button disabled={loading || dirty || saving} onclick={()=>{menuOpen=false;importText='';importDoc=null;importError='';importNew=true;importName=plan.name+' imported';importDialog?.showModal();}}>Import notes</button><button onclick={exportDraft} disabled={loading}>Export draft</button></div></details></div></div>
  {#if renaming}<form class="new-plan-form" onsubmit={e=>{e.preventDefault();void rename();}}><div><label for="rename-name">Plan name</label><input id="rename-name" bind:value={renameName} maxlength="120" required dir="auto"/></div><button type="submit" disabled={saving}>Save name</button><button type="button" onclick={()=>renaming=false}>Cancel</button></form>{/if}
  {#if undo}<button onclick={undoRemoval}>Undo song removal</button>{/if}
  {#if dirty}<p class="account-subtitle">Save your changes before switching plans. Failed saves stay in this account’s draft.</p>{/if}
  {#if error}<p class="account-error" role="alert">{error}</p>{/if}
  {#if conflict}<button disabled={saving} onclick={copyAsPlan}>Save draft as a new plan</button><button disabled={saving} onclick={()=>{if(confirm('Discard this draft and load the version saved in your account? Export the draft first if you want to keep it.'))void load(false);}}>Discard draft and load account version</button>{/if}
  {#if !storageAvailable}<p role="status">Browser storage is unavailable. Unsaved changes last only in this session. Save or export before closing.</p>{/if}
  {#if loading}<p role="status">Loading plan…</p>
  {:else if !error || document.events.length}
    <PartyPage {model} {selected} active={allTracks || filterActive(filters)} {select}/>
    <div class="plan-editors">
      <details bind:open={sectionForm}><summary>Add section</summary><form onsubmit={e=>{e.preventDefault();addSection();}} class="account-form">
        <h3>Add genre section</h3><label for="section-genre">Genre</label><input id="section-genre" bind:value={genre} required maxlength="120" dir="auto" placeholder="Hip hop"/>
        <label for="section-time">Start time (optional)</label><input id="section-time" bind:value={time} pattern="(?:[01]?\d|2[0-3]):[0-5]\d" placeholder="1:30" dir="ltr"/>
        <button type="submit">Add section</button>
      </form></details>
      <details bind:open={songForm}><summary>Add song</summary><form onsubmit={e=>{e.preventDefault();addSong();}} class="account-form">
        <h3>Add song</h3><label for="song-section">Genre section</label><select id="song-section" bind:value={destination} required><option value="">Choose a section</option>{#each genres as e}{#if e.kind==='genre'}<option value={e.uid}>{e.value}</option>{/if}{/each}</select>
        <label for="song-title">Song name</label><input id="song-title" bind:value={title} required maxlength="500" dir="auto"/>
        <div class="song-flags"><label><input type="checkbox" bind:checked={peak}/>Peak</label><label><input type="checkbox" bind:checked={download}/>Download</label><label><input type="checkbox" bind:checked={idea}/>Idea</label></div>
        <button type="submit" disabled={!destination}>Add song</button>
      </form></details>
    </div>
    <TracksPage {model} {selected} {allTracks} showAll={()=>{allTracks=true;filters=emptyFilters();destination='';songForm=true;}} bind:filters storageAvailable={true} emptyHint="Add a section and song to begin" {select} save={correct} {updateFlags} {removeSong} {copy} bind:heading/>
  {:else}<button onclick={()=>load()}>Retry opening plan</button>{/if}
  <dialog bind:this={importDialog} aria-labelledby="cloud-import-title">
    <h2 id="cloud-import-title">Import notes into your account</h2>
    <label for="cloud-import-text">Set notes</label><textarea id="cloud-import-text" bind:value={importText} oninput={()=>{importDoc=null;importId=null;}}></textarea>
    <label for="cloud-import-file">Text file</label><input id="cloud-import-file" type="file" accept=".txt,text/plain" onchange={readImport}/>
    <button onclick={previewImport} disabled={saving}>Preview import</button>
    {#if importDoc}
      <p>{documentModel(importDoc).tracks.length} songs · {documentModel(importDoc).sections.length} genre sections</p>
      <ul>{#each documentModel(importDoc).tracks.slice(0,3) as track}<li dir="auto">{track.title}</li>{/each}</ul>
      <label class="song-flags"><input type="checkbox" bind:checked={importNew}/>Create a new plan</label>
      {#if importNew}<label for="cloud-import-name">New plan name</label><input id="cloud-import-name" bind:value={importName} maxlength="120"/>
      {:else}<p>Replace all content in <strong dir="auto">{plan.name}</strong>. This stays an unsaved draft until you save to your account.</p>{/if}
    {/if}
    {#if importError}<p role="alert" class="account-error">{importError}</p>{/if}
    <div class="dialog-actions"><button disabled={saving} onclick={()=>importDialog?.close()}>Cancel</button><button disabled={saving || !importDoc || (importNew && !importName.trim())} onclick={applyImport}>{saving?'Importing…':importNew?'Create imported plan':'Replace this plan content'}</button></div>
  </dialog>
</section>
