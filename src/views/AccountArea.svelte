<script lang="ts">
  import type { PlanDocument } from '../lib/documents';
  import CloudPlanWorkspace from './CloudPlanWorkspace.svelte';
  import { onMount } from 'svelte';
  import { accountError, type AccountService, type AccountUser, type PrivatePlan } from '../lib/account';
  export let initialDocument:PlanDocument|undefined=undefined;
  export let onImported:()=>void=()=>{};
  export let service: AccountService;
  export let active: boolean;
  export let onUser: (user: AccountUser | null) => void;
  $: if(initialDocument && opened)backToPlans();
  let opened: PrivatePlan | null = null, dirtyPlan = false;
  let user: AccountUser | null = null;
  function openPlan(plan:PrivatePlan) { status='';error='';opened=plan; try {localStorage.setItem('party-map-active-'+user!.id,plan.id);} catch {} }
  function backToPlans() { opened=null; if(user)try{localStorage.removeItem('party-map-active-'+user.id);}catch{} void loadPlans(); }
  let checking = true, busy = false, loading = false;
  let persistentSession = service.persistentSession;
  let email = '', password = '', signup = false, error = '', status = '';
  let plans: PrivatePlan[] = [], page = 0, name = '';
  let operationId: string | null = null, operationName = '';
  let generation = 0, request = 0, alive = true;
  async function loadPlans() {
    if (!user) return;
    const owner = user.id, version = generation, query = ++request;
    loading = true; error = '';
    try {
      const result = await service.listPlans(owner, page);
      if (alive && version === generation && query === request) {
        plans = result;
        if (!opened) { try { const id=localStorage.getItem('party-map-active-'+owner); const plan=plans.find(p=>p.id===id);if(plan)opened=plan;}catch{} }
      }
    } catch (e) { if (alive && version === generation && query === request) error = accountError(e); }
    finally { if (alive && version === generation && query === request) loading = false; }
  }
  function updateUser(next: AccountUser | null) {
    if (!alive) return;
    checking = false; persistentSession = service.persistentSession;
    if (next?.id === user?.id) { user = next; onUser(next); return; }
    generation++; request++; opened=null;dirtyPlan=false; user = next; plans = []; page = 0; name = ''; operationId = null;
    busy = false; loading = false; password = ''; email = ''; error = ''; status = ''; signup = false;
    onUser(next);
    if (next) void loadPlans();
  }
  onMount(() => {
    alive = true;
    const stop = service.subscribe(updateUser);
    const version = generation;
    service.getUser().then(next => { if (version === generation) updateUser(next); }).catch(e => { if (alive && version === generation) { checking = false; error = accountError(e); } });
    return () => { alive = false; generation++; password = ''; stop(); };
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
</script>
<section class="account-area" hidden={!active} aria-labelledby="account-title">
  {#if checking}<h2 id="account-title" tabindex="-1">Checking your account…</h2>
  {:else if user}
    <div class="account-head" class:plan-open={!!opened}><div><h2 id="account-title" tabindex="-1">My plans</h2><p class="account-subtitle">{user.email}</p></div><button disabled={busy || dirtyPlan} onclick={signOut}>Sign out</button></div>
    {#if opened}
      {#key user.id + opened.id}<CloudPlanWorkspace {service} {user} plan={opened} onOpen={openPlan} onBack={backToPlans} onDirty={value=>dirtyPlan=value}/>{/key}
    {:else}
    <p class="account-subtitle">Your private club plans</p>
    {#if initialDocument}<p role="status">Create a new plan with {initialDocument.events.filter(e=>e.kind==='song').length} songs from your local set, including title corrections.</p><button onclick={onImported}>Cancel local set import</button>{/if}
    <form class="new-plan-form" onsubmit={e => { e.preventDefault(); void createPlan(); }}>
      <div><label for="plan-name">New plan name</label><input id="plan-name" dir="auto" bind:value={name} disabled={busy} required maxlength="120" placeholder="Friday at the club" /></div>
      <button disabled={busy || !name.trim()} type="submit">{busy ? 'Creating…' : 'Create plan'}</button>
    </form>
    {#if loading}<p role="status">Loading your plans…</p>
    {:else if plans.length}
      <ul class="account-plans">{#each plans as plan (plan.id)}<li><button onclick={()=>openPlan(plan)} aria-label={`Open ${plan.name}`}><strong dir="auto">{plan.name}</strong><span>Open plan →</span></button><span>Updated {new Date(plan.updated_at).toLocaleDateString()}</span></li>{/each}</ul>
      <p class="account-subtitle">Open a plan to manage its songs and timeline.</p>
    {:else if !error}<p class="account-empty">No plans yet. Create your first club plan above.</p>{/if}
    <div class="account-pagination"><button disabled={loading || page === 0} onclick={() => { page--; void loadPlans(); }}>Previous plans</button><button disabled={loading || plans.length < 50} onclick={() => { page++; void loadPlans(); }}>Next plans</button><button disabled={loading} onclick={loadPlans}>Refresh plans</button></div>
    {/if}
  {:else}
    <h2 id="account-title" tabindex="-1">Your own party space</h2>
    <p class="account-subtitle">Sign in or create an account with your email. Your club plans belong to you.</p>
      <form class="account-form" onsubmit={e => { e.preventDefault(); void authenticate(); }}>
        <label for="account-email">Email address</label><input id="account-email" type="email" autocomplete="email" bind:value={email} disabled={busy} required maxlength="254" placeholder="you@example.com" />
        <label for="account-password">Password</label><input id="account-password" type="password" autocomplete={signup ? 'new-password' : 'current-password'} bind:value={password} disabled={busy} required minlength={signup ? 6 : undefined} aria-describedby={signup ? 'password-hint' : undefined} />
        {#if signup}<p id="password-hint" class="account-subtitle">Use at least 6 characters.</p>{/if}
        <button disabled={busy} type="submit">{busy ? (signup ? 'Creating account…' : 'Signing in…') : (signup ? 'Create account' : 'Sign in')}</button>
      </form>
      <div class="account-secondary"><button disabled={busy} onclick={() => { signup = !signup; password = ''; status = ''; error = ''; }}>{signup ? 'Already have an account? Sign in' : 'New here? Create account'}</button></div>
  {/if}
  {#if error}<p class="account-error" role="alert">{error}</p>{#if user}<button disabled={loading} onclick={loadPlans}>Retry loading plans</button>{/if}{/if}
  {#if status}<p class="account-status" role="status">{status}</p>{/if}
  {#if !persistentSession}<p class="account-subtitle">Browser storage is unavailable. Your sign-in lasts only for this session.</p>{/if}
</section>
