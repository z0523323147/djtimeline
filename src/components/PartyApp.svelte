<script lang="ts">
  import { onMount, tick } from 'svelte';
  import example from '../data/example-notes.txt?raw';
  import { parseNotes, type Track } from '../lib/parser';
  import { emptyFilters, filterActive } from '../lib/search';
  import { importedKey, loadCorrections, saveCorrections } from '../lib/storage';
  import { copyTitle } from '../lib/clipboard';
  import PartyPage from '../views/PartyPage.svelte';
  import TracksPage from '../views/TracksPage.svelte';
  import '../styles/tokens.css';
  import '../styles/app.css';
  let raw = example;
  let model = parseNotes(raw);
  let selected = 0, filters = emptyFilters();
  let allTracks = false;
  let notice = '', storageAvailable = true;
  let heading: HTMLHeadingElement | undefined;
  let dialog: HTMLDialogElement;
  let importText = '', importError = '';
  let timer: ReturnType<typeof setTimeout>;
  onMount(() => {
    try {
      const saved = localStorage.getItem(importedKey);
      if (saved && saved.length <= 500000 && parseNotes(saved).tracks.length) raw = saved;
      model = parseNotes(raw);
      loadCorrections(localStorage, raw, model);
    } catch { storageAvailable = false; }
    return () => clearTimeout(timer);
  });
  function notify(message: string) {
    notice = message; clearTimeout(timer); timer = setTimeout(() => notice = '', 4000);
  }
  async function select(id: number, trackId?: number) {
    if (!model.sections[id]) return;
    selected = id; allTracks = false; filters = emptyFilters();
    await tick(); heading?.focus({ preventScroll: true });
    const list = document.getElementById('tracks');
    const row = trackId ? list?.querySelector<HTMLElement>(`[data-track="${trackId}"]`) : null;
    const top = list && row ? row.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop : 0;
    list?.scrollTo({ top });
    if (trackId || window.innerWidth < 850 || window.innerHeight < 700) document.getElementById('detail')?.scrollIntoView({ block: 'start' });
    else heading?.scrollIntoView({ block: 'nearest' });
  }
  async function showAll() {
    allTracks = true; filters = emptyFilters();
    await tick();
    heading?.focus({ preventScroll: true });
    document.getElementById('tracks')?.scrollTo({ top: 0 });
    document.getElementById('detail')?.scrollIntoView({ block: 'start' });
  }
  function save(id: number, title: string) {
    model.tracks.find(t => t.id === id)!.title = title;
    model = { ...model };
    try { saveCorrections(localStorage, raw, model); storageAvailable = true; }
    catch { storageAvailable = false; }
    notify(storageAvailable ? 'Correction saved on this browser.' : 'Correction kept for this session. Browser storage is unavailable.');
  }
  async function copy(track: Track) {
    try { await copyTitle(track.title); notify('Track name copied.'); }
    catch { notify('Copy unavailable. Select the track name and copy it manually.'); }
  }
  async function readFile(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 500000) { importError = 'Choose a text file smaller than 500 KB.'; return; }
    try { importText = await file.text(); importError = ''; }
    catch { importError = 'Could not read the file. Try pasting the notes.'; }
  }
  function useNotes() {
    const next = importText.trim();
    if (next.length > 500000) { importError = 'Keep your notes under 500,000 characters.'; return; }
    const parsed = parseNotes(next);
    if (!parsed.tracks.length) { importError = 'Add at least one track name to your notes.'; return; }
    raw = next; model = parsed; selected = 0; allTracks = false; filters = emptyFilters();
    storageAvailable = true;
    try { loadCorrections(localStorage, raw, model); } catch { storageAvailable = false; }
    try { localStorage.setItem(importedKey, raw); } catch { storageAvailable = false; }
    dialog.close();
    notify(`Imported ${model.tracks.length} tracks.${storageAvailable ? ' Saved on this browser.' : ' Available for this session.'}`);
  }
</script>
<div class="app">
  <a class="skip" href="#detail">Skip to track details</a>
  <header><div><h1><span class="logo">◈</span> Party map</h1><p>{model.blocks[0]?.time ?? 'No time'} → {model.blocks.at(-1)?.time ?? 'No time'} · {model.tracks.length} tracks</p></div>
    <div class="header-actions"><button onclick={() => { importError = ''; dialog.showModal(); }}>Import notes</button></div>
  </header>
  <main>
    <PartyPage {model} {selected} active={allTracks || filterActive(filters)} {select} />
    <TracksPage {model} {selected} {allTracks} {showAll} bind:filters {storageAvailable} {select} {save} {copy} bind:heading />
  </main>
  <dialog bind:this={dialog} aria-labelledby="import-title">
    <h2 id="import-title">Import your set notes</h2>
    <p>Paste your notes or choose a text file. Use times like 1:50 and genres like (Hip hop). Add --- for downloads, /// for ideas, and הפגזות for peaks. Importing replaces the active set on this browser.</p>
    <label for="import-text">Set notes</label><textarea id="import-text" bind:value={importText} placeholder="12:30&#10;(Afro tech)&#10;Track name ---" spellcheck="false"></textarea>
    <label for="import-file">Or load a .txt file</label><input id="import-file" type="file" accept=".txt,text/plain" onchange={readFile} />
    <p class="import-error" role="alert">{importError}</p>
    <div class="dialog-actions"><button onclick={() => dialog.close()}>Cancel</button><button id="import-use" onclick={useNotes}>Use these notes</button></div>
  </dialog>
  <div id="notice" role="status" aria-live="polite">{notice}</div>
</div>
