<script lang="ts">
  import { tick, onMount } from 'svelte';
  import type { Model, Track } from '../lib/parser';
  import { sectionRange,trackTiming } from '../lib/timeline';
  import { filterActive, googleSearch, matches, type Filters } from '../lib/search';
  export let emptyHint = 'Import notes to begin';
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
  export let updateFlags: ((id:number,flags:{isBanger:boolean;isToDownload:boolean;isMyIdea:boolean})=>void) | undefined = undefined;
  export let removeSong: ((id:number)=>void) | undefined = undefined;
  export let editTrack:((track:Track)=>void)|undefined=undefined;
  export let onSectionVisible: (id:number)=>void = ()=>{};
  let draftPeak=false,draftDownload=false,draftIdea=false;
  let editing: number | null = null;
  let draft = '';
  let editor: HTMLInputElement;
  let list: HTMLOListElement;
  onMount(() => {
    let frame=0;
    const update=()=>{
      frame=0;
      const dock=list.closest('.cloud-plan')?.querySelector('.timeline-dock');
      const threshold=(dock?.getBoundingClientRect().bottom??0)+16;
      if(list.getBoundingClientRect().top>threshold||list.getBoundingClientRect().bottom<threshold)return;
      // Ignore a subpixel remnant of the preceding row at the reading edge.
      const row=[...list.querySelectorAll<HTMLElement>('[data-section-id]')].find(el=>el.getBoundingClientRect().bottom>threshold+1);
      if(row&&row.getBoundingClientRect().top<window.innerHeight)onSectionVisible(Number(row.dataset.sectionId));
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
    return()=>{window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);cancelAnimationFrame(frame);};
  });
  $: active = filterActive(filters);
  $: browsing = allTracks || active;
  $: section = model.sections[selected];
  $: visible = browsing ? model.tracks.filter(t => matches(t, filters)) : section?.tracks ?? [];
  async function edit(track: Track) {
    editing = track.id; draft = track.title;draftPeak=track.isBanger;draftDownload=track.isToDownload;draftIdea=track.isMyIdea;
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
      <p>{browsing ? 'Entire party' : section ? sectionRange(section, model) : emptyHint}</p>
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
      {@const timing=trackTiming(t)}
      <li class="track" data-track={t.id} data-section-id={t.sectionId}>
        <div><p class="title" dir="auto">{t.title}</p><div class="tags">
          <span class="track-time" dir="ltr" title={timing.estimated?'Estimated from the track count between recorded times; ~ means estimated.':undefined}>{timing.text}</span>{#if timing.estimated}<span class="estimate-tag">Estimated</span>{/if}{#if browsing}<span dir="auto">{t.genre}</span>{/if}
          {#if t.isBanger}<span class="peak">🔥 Peak</span>{/if}
          {#if t.isToDownload}<span class="download">💾 Download</span>{/if}
          {#if t.isMyIdea}<span class="idea">💡 Idea</span>{/if}
          {#if t.title !== t.originalTitle}<span>Edited</span>{/if}
        </div></div>
        <div class="actions">
          <button aria-label={`Copy ${t.title}`} title="Copy track name" onclick={() => copy(t)}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg></button>
          <button class="edit-button" aria-label={`Edit ${t.title}`} title="Edit track" onclick={() => editTrack?editTrack(t):edit(t)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4 5 5M4 20l5-1L20 8a3 3 0 0 0-4-4L5 15Z"/></svg></button>
          <a class="action" href={googleSearch(t.title)} target="_blank" rel="noopener noreferrer" aria-label={`Search Google for ${t.title} download`} title="Search Google for this track"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg></a>
        {#if removeSong}<button aria-label={`Remove ${t.title}`} title="Remove track" onclick={()=>removeSong?.(t.id)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></svg></button>{/if}</div>
        {#if editing === t.id}
          <form class="edit-form" onsubmit={e => { e.preventDefault(); if (draft.trim()) { save(t.id, draft.trim());updateFlags?.(t.id,{isBanger:draftPeak,isToDownload:draftDownload,isMyIdea:draftIdea}); close(t.id); } else { editor.setCustomValidity('Enter a track name.'); editor.reportValidity(); } }}>
            <label for={`edit-${t.id}`}>Correct track name</label>
            <input id={`edit-${t.id}`} bind:this={editor} bind:value={draft} dir="auto" required maxlength="500" oninput={() => editor.setCustomValidity('')} onkeydown={e => { if (e.key === 'Escape') { e.preventDefault(); close(t.id); } }} />
            {#if updateFlags}<div class="song-flags"><label><input type="checkbox" bind:checked={draftPeak}/>Peak</label><label><input type="checkbox" bind:checked={draftDownload}/>Download</label><label><input type="checkbox" bind:checked={draftIdea}/>Idea</label></div>{/if}
            <button type="submit">Save</button><button type="button" onclick={() => close(t.id)}>Cancel</button>
          </form>
        {/if}
      </li>
    {:else}<li class="empty">{#if !model.tracks.length}{emptyHint}.{:else}No tracks match. Reset filters to {allTracks ? 'see all tracks' : 'return to your selected section'}.{/if}</li>{/each}
  </ol>
  <p class="result-bar" role="status">{visible.length} tracks shown · {active ? 'Filters combine together' : allTracks ? 'Entire party' : 'Selected genre section'}{storageAvailable ? '' : ' · Edits are session-only'}</p>
</section></div>
