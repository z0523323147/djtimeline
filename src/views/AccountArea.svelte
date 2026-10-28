<script lang="ts">
  import {documentFromNotes,documentModel,type PlanDocument} from '../lib/documents';
  import example from '../data/example-notes.txt?raw';
  import {validateBackup,downloadBackup,type BackupPlan} from '../lib/backups';
  import {readCachedPlan,cacheKey,reconnectPlans} from '../lib/plan-sync';
  import CloudPlanWorkspace from './CloudPlanWorkspace.svelte';
  import { onMount, tick } from 'svelte';
  import { accountError, type AccountService, type AccountUser, type PrivatePlan } from '../lib/account';
  export let initialDocument:PlanDocument|undefined=undefined;
  export let onImported:()=>void=()=>{};
  export let service: AccountService;
  export let active: boolean;
  export let onUser: (user: AccountUser | null) => void;
  $: if(initialDocument && opened)backToPlans();
  let opened: PrivatePlan | null = null, dirtyPlan = false;
  let railCollapsed=false;let railTimer:ReturnType<typeof setTimeout>|undefined;
  function refreshRail(){clearTimeout(railTimer);railTimer=setTimeout(()=>void loadPlans(),200);}
  let planQuery='',drawer=false,genres:string[]=[];
  let importDialog:HTMLDialogElement,importText='',importName='Imported party',importError='',preview:BackupPlan[]|null=null,importIds:string[]=[],importedIds=new Set<string>();
  let user: AccountUser | null = null;
  function openPlan(plan:PrivatePlan){if(dirtyPlan)return;status='';error='';opened=plan;drawer=false;}
  async function revealPlans(create=false){drawer=true;railCollapsed=false;await tick();document.getElementById(create?'plan-name':'plan-search')?.focus();}
  function backToPlans(){if(dirtyPlan)return;opened=null;void loadPlans();void revealPlans();}
  let checking = true, busy = false, loading = false;
  let persistentSession = service.persistentSession;
  let email = '', password = '', signup = false, error = '', status = '';
  let plans: PrivatePlan[] = [], page = 0, name = '';
  let operationId: string | null = null, operationName = '';
  let generation = 0, request = 0, alive = true;
  function metadataKey(owner:string){return 'party-map-plans-'+(service.cacheNamespace??'default')+'-'+owner;}
  async function loadPlans(){
   if(!user)return;const owner=user.id,version=generation,query=++request;loading=true;error='';
   try{
    if(!navigator.onLine&&!service.localOnly){const saved=JSON.parse(localStorage.getItem(metadataKey(owner))??'[]');if(!Array.isArray(saved)||saved.some(p=>typeof p.id!=='string'||typeof p.name!=='string'))throw new Error('Invalid cached plan list.');if(alive&&version===generation){plans=saved;status='Offline — cached plans';}return;}
    const all:PrivatePlan[]=[];let page=0;
    while(true){const batch=await service.listPlans(owner,page++);if(batch.some(p=>all.some(old=>old.id===p.id)))throw new Error('Plan pagination repeated a page. Retry loading plans.');all.push(...batch);if(batch.length<50)break;}
    if(alive&&version===generation&&query===request){plans=all;try{localStorage.setItem(metadataKey(owner),JSON.stringify(all));}catch{}if(service.listGenres){try{const result=await service.listGenres();if(alive&&version===generation){genres=result;try{localStorage.setItem(metadataKey(owner)+'-genres',JSON.stringify(result));}catch{}}}catch{/* New SQL may not yet be installed. Current-plan genre suggestions still work. */}}}
   }catch(e){if(alive&&version===generation&&query===request)error=accountError(e);}finally{if(alive&&version===generation&&query===request)loading=false;}
  }
  function updateUser(next: AccountUser | null) {
    if (!alive) return;
    checking = false; persistentSession = service.persistentSession;
    if (next?.id === user?.id) { user = next; onUser(next); return; }
    generation++; request++; importDialog?.close();importText='';preview=null;importIds=[];importedIds=new Set();opened=null;dirtyPlan=false;genres=[]; user = next; plans = []; page = 0; name = ''; operationId = null;
    busy = false; loading = false; password = ''; email = ''; error = ''; status = ''; signup = false;
    onUser(next);
    if(next){try{const saved=JSON.parse(localStorage.getItem(metadataKey(next.id)+'-genres')??'[]');if(Array.isArray(saved))genres=saved.filter(g=>typeof g==='string');}catch{}void loadPlans();}
  }
  onMount(() => {
    alive = true;
    const stop = service.subscribe(updateUser);
    const version = generation;
    service.getUser().then(next => { if (version === generation) updateUser(next); }).catch(e => { if (alive && version === generation) { checking = false; error = accountError(e); } });
    const reconnect=()=>{if(user){reconnectPlans(service,user.id);void loadPlans();}};window.addEventListener('online',reconnect);window.addEventListener('focus',reconnect);
    return () => {clearTimeout(railTimer);window.removeEventListener('online',reconnect);window.removeEventListener('focus',reconnect); alive = false; generation++; password = ''; stop(); };
  });
  async function authenticate() {
    if (busy) return;
    const version = generation;
    busy = true; error = ''; status = '';
    try {
      if (signup) {
        const signedIn = await service.signUp(email.trim(), password);
        if (alive && version === generation && !signedIn) status = 'You are not signed in yet. Supabase requires email confirmation or an account already exists. Try Sign in; if confirmation is required, contact the project owner.';
      } else await service.signIn(email.trim(), password);
    } catch (e) { if (alive && version === generation) error = accountError(e); }
    finally { if (alive && version === generation) { password = ''; busy = false; persistentSession = service.persistentSession; } }
  }
  async function signOut() {
    const version = generation; busy = true; error = '';
    try { await service.signOut(); updateUser(null); }
    catch (e) { if (alive && version === generation) error = accountError(e); }
    finally { if (alive && version === generation) busy = false; }
  }
  async function createPlan() {
    if (!user || busy) return;
    const owner = user.id, version = generation, title = name.trim();
    if (!operationId || operationName !== title) { operationId = crypto.randomUUID(); operationName = title; }
    busy = true; error = ''; status = '';
    try {
      const created = initialDocument ? await service.createPlanDocument(operationId,title,owner,initialDocument) : await service.createPlan(operationId, title, owner);
      if (alive && version === generation) { name = ''; operationId = null; page = 0; status = 'Plan created in your account.'; await loadPlans(); onImported(); openPlan(created); }
    } catch (e) { if (alive && version === generation) error = accountError(e); }
    finally { if (alive && version === generation) busy = false; }
  }
  function persistImport(key:string){try{localStorage.setItem(key,JSON.stringify({plans:preview,ids:importIds,completed:[...importedIds]}));}catch{importError='Import recovery is session-only because browser storage is unavailable.';}}
  function beginImport(original=false){
   preview=null;importIds=[];importedIds=new Set();importError='';importText=original?example:'';importName=original?'Imported party — 12:30–4:00':'Imported party';
   if(user)try{const saved=JSON.parse(localStorage.getItem(metadataKey(user.id)+'-import-job')??'null');if(saved){const plans=validateBackup({format:'party-map',version:1,plans:saved.plans}).plans;if(!Array.isArray(saved.ids)||saved.ids.length!==plans.length||saved.ids.some((id:unknown)=>typeof id!=='string'||!/^[0-9a-f-]{36}$/i.test(id)))throw new Error('Invalid import recovery.');preview=plans;importIds=saved.ids;importedIds=new Set((saved.completed??[]).filter((id:string)=>saved.ids.includes(id)));importText=JSON.stringify({format:'party-map',version:1,plans},null,2);importError='Resuming previous import: '+importedIds.size+' of '+plans.length+' completed.';}}
   catch{importError='Previous import recovery is unavailable. The original file is still usable.';}
   if(original&&!preview)previewImport();importDialog.showModal();
  }
  function previewImport(){if(preview&&importIds.length===preview.length)return;try{if(importText.length>20000000)throw new Error('Keep backup files below 20 MB.');if(importText.trim().startsWith('{'))preview=validateBackup(JSON.parse(importText)).plans;else{if(importText.length>500000)throw new Error('Keep notes below 500,000 characters.');const document=documentFromNotes(importText);if(!documentModel(document).tracks.length)throw new Error('Include at least one track.');preview=[{name:importName.trim(),document}];}importIds=preview.map(()=>crypto.randomUUID());importedIds=new Set();importError='';}catch(e){preview=null;importError=accountError(e);}}
  async function readFile(e:Event){const file=(e.currentTarget as HTMLInputElement).files?.[0];if(!file)return;if(file.size>20000000){importError='Keep files below 20 MB.';return;}importText=await file.text();preview=null;}
  async function importPlans(){
   if(!user||!preview||busy)return;
   const owner=user.id,version=generation,records=preview,ids=[...importIds],completed=importedIds,key=metadataKey(owner)+'-import-job';
   busy=true;importError='';persistImport(key);let last:PrivatePlan|undefined;
   try{
    for(let i=0;i<records.length;i++){
     if(completed.has(ids[i]))continue;
     last=await service.createPlanDocument(ids[i],records[i].name,owner,records[i].document);
     if(!alive||version!==generation)return;
     completed.add(ids[i]);persistImport(key);
    }
    if(alive&&version===generation){try{localStorage.removeItem(key);}catch{}importDialog.close();await loadPlans();if(last)openPlan(last);status='Imported '+completed.size+' plan(s) '+(service.localOnly?'on this browser.':'to your account.');}
   }catch(e){if(alive&&version===generation)importError=accountError(e)+' — '+completed.size+' of '+records.length+' imported. Retry continues the remaining plans.';}
   finally{if(alive&&version===generation)busy=false;}
  }
  async function exportAll(){if(!user||busy)return;const owner=user.id,version=generation;busy=true;error='';try{await loadPlans();if(error)throw new Error(error);if(version!==generation)return;const exported:BackupPlan[]=[];if(plans.length>100)throw new Error('Export at most 100 plans per backup.');for(const p of plans){let cached=null;try{cached=readCachedPlan(localStorage,cacheKey(service,owner,p.id));}catch{}const document=cached?.dirty?cached.document:navigator.onLine?(await service.loadDocument(p.id)).document:cached?.document;if(!document)throw new Error('Plan '+p.name+' is not cached; connect to export the complete account.');exported.push({name:p.name,document,pending:cached?.dirty});if(version!==generation)return;}downloadBackup(exported);}catch(e){if(version===generation)error=accountError(e);}finally{if(version===generation)busy=false;}}
</script>
<section class="account-area" hidden={!active} aria-labelledby="account-title">
  {#if checking}<h2 id="account-title" tabindex="-1">Checking your account…</h2>
  {:else if user}
    <div class="account-head" class:plan-open={!!opened}><div><h2 id="account-title" tabindex="-1">My plans</h2><p class="account-subtitle">{user.email}</p></div>{#if !service.localOnly}<button disabled={busy || dirtyPlan} onclick={signOut}>Sign out</button>{/if}</div>
    <button class="desktop-plan-toggle" aria-controls="plans-navigation" aria-expanded={!railCollapsed} onclick={()=>railCollapsed=!railCollapsed}>{railCollapsed?'Show plans':'Hide plans'}</button>
    <button class="mobile-plans" aria-expanded={drawer} onclick={()=>drawer=!drawer}>My plans · {opened?.name??'Choose a plan'}</button>
    <div class="account-layout" class:rail-collapsed={railCollapsed}>
     <aside id="plans-navigation" class:drawer-open={drawer} class="plans-rail" aria-label="My plans">
      <input id="plan-search" type="search" aria-label="Search plans" placeholder="Search plans…" bind:value={planQuery}/>
      <form class="new-plan-form" onsubmit={e=>{e.preventDefault();void createPlan();}}><div><label for="plan-name">New plan name</label><input id="plan-name" bind:value={name} required maxlength="120" dir="auto" placeholder="Friday at the club"/></div><button type="submit" disabled={busy||!name.trim()}>Create plan</button></form>
      {#if initialDocument}<p>{initialDocument.events.filter(e=>e.kind==='song').length} local tracks ready to import.</p><button onclick={onImported}>Cancel local set import</button>{/if}
      {#if loading}<p role="status">Loading plans…</p>{/if}
      <ul class="account-plans">{#each plans.filter(p=>p.name.toLocaleLowerCase().includes(planQuery.toLocaleLowerCase())) as p(p.id)}<li><button disabled={dirtyPlan} class:current-plan={opened?.id===p.id} aria-label={'Open '+p.name} aria-pressed={opened?.id===p.id} onclick={()=>openPlan(p)}><strong dir="auto">{p.name}</strong><span>{p.song_count??'—'} tracks</span></button><span>Updated {new Date(p.updated_at).toLocaleDateString()}</span></li>{/each}</ul>
      {#if !plans.length&&!loading}<p class="account-empty">No plans yet.</p>{/if}
      {#if plans.length&&planQuery&&!plans.some(p=>p.name.toLocaleLowerCase().includes(planQuery.toLocaleLowerCase()))}<p class="account-empty">No plans match your search.</p>{/if}
      <div class="rail-actions"><button disabled={busy} onclick={()=>beginImport()}>Import notes / backup</button><button disabled={busy} onclick={()=>beginImport(true)}>Import original party</button><button disabled={busy||!plans.length||loading} onclick={exportAll}>Export all plans</button><button disabled={loading} onclick={loadPlans}>Refresh plans</button></div>
     </aside>
     <div class="plan-main">
      {#if opened}{#key user.id+opened.id}<CloudPlanWorkspace {service} {user} plan={opened} knownGenres={genres} onChanged={refreshRail} onOpen={openPlan} onBack={backToPlans} onDirty={value=>dirtyPlan=value}/>{/key}
      {:else}<div class="plan-empty"><h2>{plans.length?'Choose a plan':'Start your party plan'}</h2><p>Your timeline and tracks appear here.</p><div class="empty-actions">{#if plans.length}<button onclick={()=>revealPlans()}>Choose a plan</button>{/if}<button class="primary" onclick={()=>revealPlans(true)}>New plan</button><button onclick={()=>beginImport()}>Import notes</button></div></div>{/if}
     </div>
    </div>
  {:else}
    <h2 id="account-title" tabindex="-1">Your own party space</h2>
    <p class="account-subtitle">Sign in or create an account with your email. Your club plans belong to you.</p>
      <form class="account-form" onsubmit={e => { e.preventDefault(); void authenticate(); }}>
        <label for="account-email">Email address</label><input id="account-email" type="email" autocomplete="email" bind:value={email} disabled={busy} required maxlength="254" placeholder="you@example.com" />
        <label for="account-password">Password</label><input id="account-password" type="password" autocomplete={signup ? 'new-password' : 'current-password'} bind:value={password} disabled={busy} required minlength={signup ? 12 : undefined} aria-describedby={signup ? 'password-hint' : undefined} />
        {#if signup}<p id="password-hint" class="account-subtitle">Use at least 12 characters and follow the project’s password requirements.</p>{/if}
        <button disabled={busy} type="submit">{busy ? (signup ? 'Creating account…' : 'Signing in…') : (signup ? 'Create account' : 'Sign in')}</button>
      </form>
      <div class="account-secondary"><button disabled={busy} onclick={() => { signup = !signup; password = ''; status = ''; error = ''; }}>{signup ? 'Already have an account? Sign in' : 'New here? Create account'}</button></div>
  {/if}
  {#if error}<p class="account-error" role="alert">{error}</p>{#if user}<button disabled={loading} onclick={loadPlans}>Retry loading plans</button>{/if}{/if}
  {#if status}<p class="account-status" role="status">{status}</p>{/if}
  {#if !persistentSession}<p class="account-subtitle">Browser storage is unavailable. Your sign-in lasts only for this session.</p>{/if}
  <dialog bind:this={importDialog} aria-labelledby="account-import-title"><h2 id="account-import-title">Import plans</h2><label for="import-plan-name">Plan name for text notes</label><input id="import-plan-name" disabled={busy} bind:value={importName} oninput={()=>preview=null} maxlength="120"/><label for="account-import-text">Original notes or JSON backup</label><textarea id="account-import-text" disabled={busy} bind:value={importText} oninput={()=>preview=null}></textarea><label for="account-import-file">Text / backup file</label><input id="account-import-file" disabled={busy} type="file" accept=".txt,.json,text/plain,application/json" onchange={readFile}/><button disabled={busy} onclick={previewImport}>Preview import</button>{#if preview}<ul>{#each preview as p}<li dir="auto">{p.name} · {documentModel(p.document).tracks.length} tracks{p.pending?' · includes device changes':''}</li>{/each}</ul><p>Creates new {service.localOnly?'local':'private'} plans. Existing plans stay intact.</p>{/if}{#if importError}<p role="alert" class="account-error">{importError}</p>{/if}<div class="dialog-actions"><button disabled={busy} onclick={()=>importDialog.close()}>Cancel</button><button disabled={busy||!preview} onclick={importPlans}>{busy?'Importing…':service.localOnly?'Import to browser':'Import to account'}</button></div></dialog>
</section>
