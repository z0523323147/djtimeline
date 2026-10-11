<script lang="ts">
  import type { Model } from '../lib/parser';
  import { boundary, clock, color, isHip, sectionRange, timeBands } from '../lib/timeline';
  export let model: Model;
  export let selected: number;
  export let active: boolean;
  export let select: (id: number, trackId?: number) => void;
  let mapWidth = 600;
  $: diagramWidth = Math.max(220, mapWidth - 16);
  $: bands = timeBands(model);
  $: section = model.sections[selected];
  $: changes = model.sections.filter((s, i) => i > 0 && isHip(s.genre) !== isHip(model.sections[i - 1].genre));
  const x = (time: number, start: number, end: number) => (time - start) / (end - start) * diagramWidth;
</script>

<section class="overview" aria-labelledby="overview-heading">
  <div class="section-head">
    <h2 id="overview-heading">The whole party</h2>
    <p class="hint">Click or tap a timeline section to open its tracks.</p>
  </div>
  <div class="legend" aria-label="Genre colors">
    <span><i class="dot" style="--color:var(--cyan)"></i>Other genres</span>
    <span><i class="dot" style="--color:var(--hip)"></i>Hip-hop</span>
    <span><i class="dot" style="--color:var(--fire)"></i>Peak sections</span>
  </div>
  <div id="map" bind:clientWidth={mapWidth}>
    {#each bands as band}
      <div class="map-row">
        <div class="row-caption" dir="ltr"><span>{clock(band.start)}</span><span>{clock(band.end)}</span></div>
        <svg viewBox={`-8 0 ${diagramWidth + 16} 76`} preserveAspectRatio="none" role="group" aria-label={`Party flow from ${clock(band.start)} to ${clock(band.end)}`}>
          <rect x="0" y="10" width={diagramWidth} height="32" rx="6" fill="var(--raised)" />
          {#each model.sections.filter(s => s.end > band.start && s.start < band.end) as s}
            {@const left = x(Math.max(s.start, band.start), band.start, band.end)}
            {@const width = Math.max(2, x(Math.min(s.end, band.end), band.start, band.end) - left)}
            <g class="segment" role="button" tabindex="0" aria-label={`${s.genre}, ${boundary(s)}, open ${s.tracks.length} tracks`}
              aria-pressed={!active && selected === s.id} onclick={() => select(s.id)}
              onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(s.id); } }}>
              <title>{s.genre} · {boundary(s)} · Open tracks</title>
              <rect x={left} y="10" {width} height="32" fill={color(s.genre)} stroke={!active && selected === s.id ? 'white' : 'var(--bg)'} stroke-width={!active && selected === s.id ? 2 : 1} />
              <rect class="hit-area" x={left} y="4" {width} height="44" fill="transparent" />
              {#if width > s.genre.length * 8 + 14}<text class="map-label" x={left + 7} y="31">{isHip(s.genre) ? 'Hip-hop' : s.genre}</text>{/if}
            </g>
          {/each}
          {#each model.tracks.filter(t => t.isBanger && t.end > band.start && t.start < band.end) as t}
            <rect x={x(Math.max(t.start, band.start), band.start, band.end)} y="46" width={Math.max(2, x(Math.min(t.end, band.end), band.start, band.end) - x(Math.max(t.start, band.start), band.start, band.end))} height="5" fill="var(--fire)" />
          {/each}
          {#each Array.from({ length: Math.max(0, Math.floor((band.end - band.start - 3) / (diagramWidth < 380 ? 20 : 15))) }, (_, i) => band.start + (i + 1) * (diagramWidth < 380 ? 20 : 15)) as time}
            <text class="tick" x={x(time, band.start, band.end)} y="73" text-anchor="middle">{clock(time)}</text>
          {/each}
        </svg>
      </div>
    {:else}
      <p class="note">No timed flow yet. Choose a genre section below to browse your tracks.</p>
    {/each}
    {#each model.sections.filter(s => s.start === s.end) as s}
      <button class="terminal-section" aria-label={`${s.genre}, ${boundary(s)}, open ${s.tracks.length} tracks`} aria-pressed={!active && selected === s.id} onclick={() => select(s.id)}>
        <span>{boundary(s)} · {s.genre}</span><span>Open {s.tracks.length} tracks →</span>
      </button>
    {/each}
  </div>
  <p class="note">Some genre changes have no exact time in your notes. These show a time range.</p>
  <div class="section-picker">
    <label for="section-select">Choose a time &amp; genre section</label>
    <select id="section-select" value={selected} onchange={e => select(Number(e.currentTarget.value))}>
      {#each model.sections as s}<option value={s.id}>{boundary(s)} · {s.genre}</option>{/each}
    </select>
    {#if section}
      <div class="selected-card" style:border-inline-start-color={color(section.genre)}>
        <strong>{section.genre}</strong><p>{sectionRange(section, model)}</p>
        <button onclick={() => select(section.id)}>Open {section.tracks.length} tracks →</button>
      </div>
    {/if}
  </div>
  <details><summary>All sections · easy selection</summary><div class="section-buttons">
    {#each model.sections as s}<button aria-pressed={!active && selected === s.id} onclick={() => select(s.id)}><span>{s.genre}</span><span>{boundary(s)}</span></button>{/each}
  </div></details>
  <details><summary>Hip-hop changes · view all</summary><div class="switches">
    {#each changes as s}<button class="switch" onclick={() => select(s.id)}><span class="direction">{isHip(s.genre) ? 'Into hip-hop' : 'Back to ' + s.genre}</span><span class="when">{boundary(s)}</span></button>
    {:else}<p class="note">No hip-hop changes in these notes.</p>{/each}
  </div></details>
  <details><summary>All times from your notes</summary><div class="time-jumps" role="group" aria-label="Every exact time marker from the notes">
    {#each model.blocks.filter(b => b.tracks.length) as block}<button onclick={() => select(block.tracks[0].sectionId, block.tracks[0].id)}>{block.time}</button>{/each}
  </div></details>
</section>
