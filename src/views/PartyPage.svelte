<script lang="ts">
  import type { Model } from '../lib/parser';
  import { boundary, changeTime, clock, color, genreBands, isHip, overviewRuns, peakRuns, timeBands } from '../lib/timeline';
  export let model: Model;
  export let selected: number;
  export let active: boolean;
  export let select: (id: number, trackId?: number) => void;
  let mapWidth = 600;
  let showGenres = true;
  $: diagramWidth = Math.max(220, mapWidth - 16);
  $: bands = timeBands(model);
  $: zoomBands = genreBands(model, Math.max(160, diagramWidth - 116));
  $: rows = showGenres ? zoomBands.map(b => ({ ...b, startLabel: boundary(b.first), endLabel: model.sections[b.last.id + 1] ? boundary(model.sections[b.last.id + 1]) : 'End not noted' })) : bands.map(b => ({ ...b, startLabel: clock(b.start), endLabel: clock(b.end) }));
  $: terminal = model.sections.filter(s => s.start === s.end);
  $: chartRows = rows.length ? rows : terminal.length ? [{ start: terminal[0].start, end: terminal[0].start, startLabel: boundary(terminal[0]), endLabel: 'End not noted' }] : [];
  $: flow = overviewRuns(model);
  $: peaks = peakRuns(model);
  $: changes = model.sections.filter((s, i) => i > 0 && isHip(s.genre) !== isHip(model.sections[i - 1].genre));
  const x = (time: number, start: number, end: number, width = diagramWidth) => end > start ? (time - start) / (end - start) * width : 0;
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
    <span>→ End not noted</span>
  </div>
  {#if showGenres}
    <div class="macro-map" aria-label="Whole-party overview">
      {#each bands as band}
        <div class="macro-caption"><span>{clock(band.start)}</span><span>{clock(band.end)}</span></div>
        <svg viewBox={`0 0 ${diagramWidth} 16`} preserveAspectRatio="none" aria-label={`Overview ${clock(band.start)} to ${clock(band.end)}`}>
          {#each flow.filter(run => run.end > band.start && run.start < band.end) as run}
            <rect x={x(Math.max(run.start, band.start), band.start, band.end)} y="0" width={x(Math.min(run.end, band.end), band.start, band.end) - x(Math.max(run.start, band.start), band.start, band.end)} height="16" fill={color(run.genre)} />
          {/each}
        </svg>
      {/each}
    </div>
  {/if}
  <button class="genre-detail-toggle" aria-pressed={showGenres} onclick={() => showGenres = !showGenres}>Genre details {showGenres ? '−' : '+'}</button>
  <div id="map" bind:clientWidth={mapWidth}>
    {#each chartRows as band, rowIndex}
      {@const endings = rowIndex === chartRows.length - 1 ? terminal : []}
      {@const capWidth = endings.length ? Math.min(116, diagramWidth / endings.length) : 0}
      {@const flowWidth = band.end > band.start ? diagramWidth - endings.length * capWidth : 0}
      <div class="map-row">
        <div class="row-caption" dir="ltr"><span>{band.startLabel}</span><span>{endings.length ? 'End not noted' : band.endLabel}</span></div>
        <svg viewBox={`-8 0 ${diagramWidth + 16} 88`} preserveAspectRatio="none" role="group" aria-label={`Party flow from ${band.startLabel} to ${endings.length ? 'an unrecorded end' : band.endLabel}`}>
          <rect x="0" y="10" width={diagramWidth} height="44" rx="6" fill="var(--raised)" />
          {#each flow.filter(run => run.end > band.start && run.start < band.end) as run}
            <rect class="flow-band" x={x(Math.max(run.start, band.start), band.start, band.end, flowWidth)} y="10"
              width={x(Math.min(run.end, band.end), band.start, band.end, flowWidth) - x(Math.max(run.start, band.start), band.start, band.end, flowWidth)} height="44" fill={color(run.genre)} />
          {/each}
          {#each model.sections.filter(s => s.end > band.start && s.start < band.end) as s}
            {@const left = x(Math.max(s.start, band.start), band.start, band.end, flowWidth)}
            {@const width = Math.max(2, x(Math.min(s.end, band.end), band.start, band.end, flowWidth) - left)}
            <g class="segment" role="button" tabindex="0" aria-label={`${s.genre}, ${boundary(s)}, open ${s.tracks.length} tracks`}
              aria-pressed={!active && selected === s.id} onclick={() => select(s.id)}
              onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(s.id); } }}>
              <title>{s.genre} · {boundary(s)} · Open tracks</title>
              <rect class="genre-fill" x={left} y="10" {width} height="44" fill="transparent" />
              {#if !active && selected === s.id}<rect class="selection-mark" x={left} y="50" {width} height="4" fill="var(--bg)" />{/if}
              <rect class="hit-area" x={left} y="10" {width} height="44" fill="transparent" />
              {#if showGenres || width > s.genre.length * 8 + 14}<text class="map-label" x={left + 7} y={showGenres ? 28 : 36}>{isHip(s.genre) ? 'Hip-hop' : s.genre}</text>{/if}
              {#if showGenres}<text class="map-label change-time" x={left + 7} y="46">{changeTime(s)}</text>{/if}
            </g>
          {/each}
          {#each peaks.filter(t => t.end > band.start && t.start < band.end) as t}
            <rect x={x(Math.max(t.start, band.start), band.start, band.end, flowWidth)} y="58" width={Math.max(2, x(Math.min(t.end, band.end), band.start, band.end, flowWidth) - x(Math.max(t.start, band.start), band.start, band.end, flowWidth))} height="5" fill="var(--fire)" />
          {/each}
          {#each Array.from({ length: Math.max(0, Math.floor((band.end - band.start - 3) / (diagramWidth < 380 ? 20 : 15))) }, (_, i) => band.start + (i + 1) * (diagramWidth < 380 ? 20 : 15)) as time}
            <text class="tick" x={x(time, band.start, band.end, flowWidth)} y="84" text-anchor="middle">{clock(time)}</text>
          {/each}
          {#each endings as s, index}
            {@const left = flowWidth + index * capWidth}
            <g class="segment terminal-section" role="button" tabindex="0" aria-label={`${s.genre}, ${boundary(s)}, open ${s.tracks.length} tracks`}
              aria-pressed={!active && selected === s.id} onclick={() => select(s.id)}
              onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(s.id); } }}>
              <title>{s.genre} · {boundary(s)} · End time not noted</title>
              <rect class="genre-fill" x={left} y="10" width={capWidth} height="44" fill={color(s.genre)} />
              {#if !active && selected === s.id}<rect x={left} y="50" width={capWidth} height="4" fill="var(--bg)" />{/if}
              <text class="map-label" x={left + 7} y="28">{isHip(s.genre) ? 'Hip-hop' : s.genre}</text>
              <text class="map-label" x={left + 7} y="46">{s.tracks[0]?.time === 'Unscheduled' ? 'No time' : clock(s.start)} →</text>
            </g>
          {/each}
        </svg>
      </div>
    {:else}
      <p class="note">No timed flow yet. Open a section below to browse your tracks.</p>
    {/each}
  </div>
  <p class="note">~ means the change happened within this time range; your notes do not give an exact minute.</p>
  <details><summary>Browse all sections</summary><div class="section-buttons">
    {#each model.sections as s}<button data-section={s.id} aria-pressed={!active && selected === s.id} onclick={() => select(s.id)}><span>{s.genre}</span><span>{boundary(s)}</span></button>{/each}
  </div></details>
  <details><summary>Hip-hop changes · view all</summary><div class="switches">
    {#each changes as s}<button class="switch" onclick={() => select(s.id)}><span class="direction">{isHip(s.genre) ? 'Into hip-hop' : 'Back to ' + s.genre}</span><span class="when">{boundary(s)}</span></button>
    {:else}<p class="note">No hip-hop changes in these notes.</p>{/each}
  </div></details>
  <details><summary>All times from your notes</summary><div class="time-jumps" role="group" aria-label="Every exact time marker from the notes">
    {#each model.blocks.filter(b => b.tracks.length) as block}<button onclick={() => select(block.tracks[0].sectionId, block.tracks[0].id)}>{block.time}</button>{/each}
  </div></details>
</section>
