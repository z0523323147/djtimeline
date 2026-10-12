<script lang="ts">
 import {onMount} from 'svelte';
 import AccountArea from '../views/AccountArea.svelte';
 import type {AccountService} from '../lib/account';
 import {createLocalPlanService} from '../lib/local-plans';
 import '../styles/tokens.css';import '../styles/app.css';
 export let cloud:AccountService|undefined=undefined;
 export let connectedMode=false;
 export let setupError='';
 let local:AccountService|undefined;let theme='system';
 $: service=cloud??local;
 function applyTheme(){document.documentElement.dataset.theme=theme;try{localStorage.setItem('party-map-theme',theme);}catch{}}
 onMount(()=>{if(!connectedMode)local=createLocalPlanService();try{const saved=localStorage.getItem('party-map-theme');if(saved&&['dark','light','system'].includes(saved))theme=saved;}catch{}applyTheme();});
</script>
<div class="app"><a class="skip" href="#account-title">Skip to plans</a><header><div><h1><span class="logo">◈</span> Party map</h1><p>{connectedMode?'Your private plans':'Local plans'}</p></div><div class="header-actions"><select aria-label="Color theme" bind:value={theme} onchange={applyTheme}><option value="system">System theme</option><option value="dark">Dark theme</option><option value="light">Light theme</option></select></div></header><main>{#if setupError}<p role="alert">{setupError}</p>{/if}{#if service}<AccountArea {service} active={true} onUser={()=>{}}/>{:else}<p role="status">Connecting to your account…</p>{/if}</main></div>
