<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { accountError, type AccountService, type AccountUser, type PrivatePlan } from '../lib/account';
  export let service: AccountService;
  export let active: boolean;
  export let onUser: (user: AccountUser | null) => void;
  let user: AccountUser | null = null;
  let checking = true, busy = false, loading = false;
  let persistentSession = service.persistentSession;
  let email = '', sentEmail = '', code = '', error = '', status = '';
  let plans: PrivatePlan[] = [], page = 0, name = '';
  let operationId: string | null = null, operationName = '';
  let generation = 0, request = 0, alive = true;
  let codeInput: HTMLInputElement;
  let retryAt = 0, seconds = 0;
  async function loadPlans() {
    if (!user) return;
    const owner = user.id, version = generation, query = ++request;
    loading = true; error = '';
    try {
      const result = await service.listPlans(owner, page);
      if (alive && version === generation && query === request) plans = result;
    } catch (e) { if (alive && version === generation && query === request) error = accountError(e); }
    finally { if (alive && version === generation && query === request) loading = false; }
  }
  function updateUser(next: AccountUser | null) {
    if (!alive) return;
    checking = false; persistentSession = service.persistentSession;
    if (next?.id === user?.id) { user = next; onUser(next); return; }
    generation++; request++; user = next; plans = []; page = 0; name = ''; operationId = null;
    busy = false; loading = false; code = ''; sentEmail = ''; email = ''; error = ''; status = ''; retryAt = 0; seconds = 0;
    onUser(next);
    if (next) void loadPlans();
  }
  onMount(() => {
    alive = true;
    const stop = service.subscribe(updateUser);
    const version = generation;
    service.getUser().then(next => { if (version === generation) updateUser(next); }).catch(e => { if (alive && version === generation) { checking = false; error = accountError(e); } });
    const clock = setInterval(() => seconds = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)), 1000);
    return () => { alive = false; generation++; stop(); clearInterval(clock); };
  });
  async function sendCode() {
    if (busy || seconds) return;
    const target = (sentEmail || email).trim(), version = generation;
    busy = true; error = ''; status = '';
    try {
      await service.requestCode(target);
      if (alive && version === generation) {
        sentEmail = target; retryAt = Date.now() + 60000; seconds = 60;
        status = 'Code requested. Check your email and enter the code below.';
        await tick(); codeInput?.focus();
      }
    } catch (e) { if (alive && version === generation) error = accountError(e); }
    finally { if (alive && version === generation) { busy = false; persistentSession = service.persistentSession; } }
  }
  async function verify() {
    if (busy) return;
    const version = generation;
    busy = true; error = '';
    try { await service.verifyCode(sentEmail, code.trim()); }
    catch (e) { if (alive && version === generation) error = accountError(e); }
    finally { if (alive && version === generation) busy = false; }
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
      await service.createPlan(operationId, title, owner);
      if (alive && version === generation) { name = ''; operationId = null; page = 0; status = 'Plan created in your account.'; await loadPlans(); }
    } catch (e) { if (alive && version === generation) error = accountError(e); }
    finally { if (alive && version === generation) busy = false; }
  }
</script>
<section class="account-area" hidden={!active} aria-labelledby="account-title">
  {#if checking}<h2 id="account-title" tabindex="-1">Checking your account…</h2>
  {:else if user}
    <div class="account-head"><div><h2 id="account-title" tabindex="-1">My plans</h2><p class="account-subtitle">{user.email}</p></div><button disabled={busy} onclick={signOut}>Sign out</button></div>
    <p class="account-subtitle">Your private club plans</p>
    <form class="new-plan-form" onsubmit={e => { e.preventDefault(); void createPlan(); }}>
      <div><label for="plan-name">New plan name</label><input id="plan-name" dir="auto" bind:value={name} disabled={busy} required maxlength="120" placeholder="Friday at the club" /></div>
      <button disabled={busy || !name.trim()} type="submit">{busy ? 'Creating…' : 'Create plan'}</button>
    </form>
    {#if loading}<p role="status">Loading your plans…</p>
    {:else if plans.length}
      <ul class="account-plans">{#each plans as plan (plan.id)}<li><strong dir="auto">{plan.name}</strong><span>Created {new Date(plan.created_at).toLocaleDateString()}</span></li>{/each}</ul>
      <p class="account-subtitle">Plan names are stored in your account. Tracks in the local planner stay on this browser.</p>
    {:else if !error}<p class="account-empty">No plans yet. Create your first club plan above.</p>{/if}
    <div class="account-pagination"><button disabled={loading || page === 0} onclick={() => { page--; void loadPlans(); }}>Previous plans</button><button disabled={loading || plans.length < 50} onclick={() => { page++; void loadPlans(); }}>Next plans</button><button disabled={loading} onclick={loadPlans}>Refresh plans</button></div>
  {:else}
    <h2 id="account-title" tabindex="-1">Your own party space</h2>
    <p class="account-subtitle">Sign in or create an account with your email. Your club plans belong to you.</p>
    {#if !sentEmail}
      <form class="account-form" onsubmit={e => { e.preventDefault(); void sendCode(); }}>
        <label for="account-email">Email address</label><input id="account-email" type="email" autocomplete="email" bind:value={email} disabled={busy} required maxlength="254" placeholder="you@example.com" />
        <button disabled={busy} type="submit">{busy ? 'Requesting code…' : 'Send sign-in code'}</button>
      </form>
    {:else}
      <form class="account-form" onsubmit={e => { e.preventDefault(); void verify(); }}>
        <p class="account-subtitle">Enter the code for {sentEmail}.</p>
        <label for="account-code">Email verification code</label><input id="account-code" bind:this={codeInput} bind:value={code} inputmode="numeric" autocomplete="one-time-code" pattern={"[0-9]{6,10}"} required maxlength="10" />
        <button disabled={busy} type="submit">{busy ? 'Signing in…' : 'Verify and sign in'}</button>
      </form>
      <div class="account-secondary"><button disabled={busy || seconds > 0} onclick={sendCode}>{seconds ? `Resend in ${seconds}s` : 'Resend code'}</button><button disabled={busy} onclick={() => { sentEmail = ''; code = ''; status = ''; error = ''; retryAt = 0; seconds = 0; }}>Use another email</button></div>
    {/if}
  {/if}
  {#if error}<p class="account-error" role="alert">{error}</p>{#if user}<button disabled={loading} onclick={loadPlans}>Retry loading plans</button>{/if}{/if}
  {#if status}<p class="account-status" role="status">{status}</p>{/if}
  {#if !persistentSession}<p class="account-subtitle">Browser storage is unavailable. Your sign-in lasts only for this session.</p>{/if}
</section>
