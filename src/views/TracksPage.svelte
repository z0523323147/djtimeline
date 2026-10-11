<script lang="ts">
  import { tick } from 'svelte';
  import type { Model, Track } from '../lib/parser';
  import { sectionRange } from '../lib/timeline';
  import { filterActive, googleSearch, matches, type Filters } from '../lib/search';
  export let model: Model;
  export let selected: number;
  export let allTracks: boolean;
  export let showAll: () => void;
  export let filters: Filters;
  export let storageAvailable: boolean;
  export let select: (id: number) => void;
  export let save: (id: number, title: string) => void;
  export let copy: (track: Track) => void;
  export let heading: HTMLHeadingElement | undefined = undefined;
  let editing: number | null = null;
  let draft = '';
  let editor: HTMLInputElement;
  let list: HTMLOListElement;
  $: active = filterActive(filters);
  $: browsing = allTracks || active;
  $: section = model.sections[selected];
  $: visible = browsing ? model.tracks.filter(t => matches(t, filters)) : section?.tracks ?? [];
  async function edit(track: Track) {
    editing = track.id; draft = track.title;
    await tick(); editor.focus(); editor.select();
  }
  async function close(id: number) {
    editing = null; await tick();
    list.querySelector<HTMLButtonElement>(`[data-track="${id}"] .edit-button`)?.focus();
  }
</script>
<div class="workspace"><section id="detail" class="detail" aria-labelledby="detail-title" tabindex="-1">
  <div class="pane-head">
    <div class="detail-heading"><div>
      <h2 id="detail-title" bind:this={heading} tabindex="-1">{active ? 'Matching tracks' : allTracks ? 'All tracks' : section?.genre ?? 'Tracks'}</h2>
      <p>{browsing ? 'Entire party · source order' : section ? sectionRange(section, model) : 'Import notes to begin'}</p>
    </div><div class="detail-nav">
      <button aria-label="Previous section" disabled={browsing || selected === 0} onclick={() => select(selected - 1)}>←</button>
      <button aria-label="Next section" disabled={browsing || selected >= model.sections.length - 1} onclick={() => select(selected + 1)}>→</button>
    </div></div>
    <div class="filters">
      <input id="search" type="search" aria-label="Search all tracks" placeholder="Search all tracks…" dir="auto" bind:value={filters.query} />
      <select aria-label="Filter genre" bind:value={filters.genre}><option value="">All genres</option>
        {#each [...new Set(model.tracks.map(t => t.genre))] as genre}<option value={genre}>{genre}</option>{/each}
      </select>
    </div>
    <div class="toggles">
      <button aria-pressed={allTracks} onclick={showAll}>All tracks</button>
      <button aria-pressed={filters.isBanger} onclick={() => filters.isBanger = !filters.isBanger}>🔥 Peaks</button>
      <button aria-pressed={filters.isToDownload} onclick={() => filters.isToDownload = !filters.isToDownload}>💾 Downloads</button>
      <button aria-pressed={filters.isMyIdea} onclick={() => filters.isMyIdea = !filters.isMyIdea}>💡 Ideas</button>
      <button onclick={() => allTracks ? showAll() : select(selected)}>Reset</button>
    </div>
  </div>
  <ol id="tracks" class="track-list" bind:this={list}>
    {#each visible as t (t.id)}
      <li class="track" data-track={t.id}>
        <span class="number">{String(t.id).padStart(2, '0')}</span>
        <div><p class="title" dir="auto">{t.title}</p><div class="tags">
          {#if browsing}<span>{t.time} · {t.genre}</span>{/if}
          {#if t.isBanger}<span class="peak">🔥 Peak</span>{/if}
          {#if t.isToDownload}<span class="download">💾 Download</span>{/if}
          {#if t.isMyIdea}<span class="idea">💡 Idea</span>{/if}
          {#if t.title !== t.originalTitle}<span>Edited</span>{/if}
        </div></div>
        <div class="actions">
          <button aria-label={`Copy ${t.title}`} onclick={() => copy(t)}>Copy</button>
          <button class="edit-button" aria-label={`Edit ${t.title}`} onclick={() => edit(t)}>Edit</button>
          <a class="action" href={googleSearch(t.title)} target="_blank" rel="noopener noreferrer" aria-label={`Search Google for ${t.title} download`}>Download ↗</a>
        </div>
        {#if editing === t.id}
          <form class="edit-form" onsubmit={e => { e.preventDefault(); if (draft.trim()) { save(t.id, draft.trim()); close(t.id); } else { editor.setCustomValidity('Enter a track name.'); editor.reportValidity(); } }}>
            <label for={`edit-${t.id}`}>Correct track name</label>
            <input id={`edit-${t.id}`} bind:this={editor} bind:value={draft} dir="auto" required maxlength="500" oninput={() => editor.setCustomValidity('')} onkeydown={e => { if (e.key === 'Escape') { e.preventDefault(); close(t.id); } }} />
            <button type="submit">Save</button><button type="button" onclick={() => close(t.id)}>Cancel</button>
          </form>
        {/if}
      </li>
    {:else}<li class="empty">No tracks match. Reset filters to {allTracks ? 'see all tracks' : 'return to your selected section'}.</li>{/each}
  </ol>
  <p class="result-bar" role="status">{visible.length} tracks shown · {active ? 'Filters combine together' : allTracks ? 'Entire party' : 'Select another section in the overview'}{storageAvailable ? '' : ' · Edits are session-only'}</p>
</section></div>
