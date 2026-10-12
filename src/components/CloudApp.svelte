<script lang="ts">
  import { onMount } from 'svelte';
  import PartyApp from './PartyApp.svelte';
  import { createAccountService } from '../lib/supabase';
  import type { AccountService } from '../lib/account';
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let cloud: AccountService | undefined;
  let setupError = '';
  onMount(() => {
    if (!url || !key) { setupError = 'Account sign-in is unavailable: Supabase configuration is missing.'; return; }
    try { cloud = createAccountService(url, key); }
    catch { setupError = 'Account sign-in is unavailable: Supabase configuration is invalid.'; }
  });
</script>
<PartyApp {cloud} {setupError} />
