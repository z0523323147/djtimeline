<script lang="ts">
  import type { Model } from '../lib/parser';
  import { boundary, changeTime, clock, color, genreBands, isHip, overviewRuns, peakRuns } from '../lib/timeline';
  export let model: Model;
  export let selected: number;
  export let active: boolean;
  export let select: (id: number, trackId?: number) => void;
  let mapWidth = 1100;
  $: diagramWidth = Math.max(1000, mapWidth - 16);
  $: terminal = model.sections.filter(s => s.start === s.end);
  $: rows = genreBands(model, diagramWidth - 140);
  $: chartRows = rows.length ? rows : terminal.length ? [{ start: terminal[0].start, end: terminal[0].start }] : [];
  $: flow = overviewRuns(model);
  $: peaks = peakRuns(model);
  $: start = model.blocks[0]?.start ?? 0;
  $: end = model.blocks.at(-1)?.start ?? start;
  const x = (time: number, from: number, to: number, width: number) => to > from ? (time - from) / (to - from) * width : 0;
  function ruler(from: number, to: number, width: number) {
    if (to <= from) return [from];
    const step = (to - from) / width * 72 <= 5 ? 5 : 10;
    const interior = Array.from({ length: Math.max(0, Math.ceil(to / step) - Math.floor(from / step) - 1) }, (_, i) => (Math.floor(from / step) + i + 1) * step).filter(t => t > from && t < to && x(t, from, to, width) > 48 && width - x(t, from, to, width) > 48);
    return [from, ...interior, to];
  }
</script>
<section class="overview" aria-labelledby="overview-heading">
  <div class="timeline-head">
    <div><h2 id="overview-heading">Party timeline</h2><p class="hint">Choose a genre section to see its tracks below.</p></div>
    <div class="legend" aria-label="Genre colors"><span><i class="dot" style="--color:var(--cyan)"></i>Other genres</span><span><i class="dot" style="--color:var(--hip)"></i>Hip-hop</span><span><i class="dot" style="--color:var(--fire)"></i>Peak</span></div>
  </div>
  <div class="party-summary" aria-label="Whole-party overview">
    <span>{clock(start)}</span><div class="summary-flow">
      {#each flow as run}<span style={`flex:${run.end-run.start};background:${color(run.genre)}`}></span>{/each}
      {#each terminal as s}<span class="summary-end" style={`background:${color(s.genre)}`} title={`${s.genre} · ${boundary(s)} · ending not noted`}></span>{/each}
    </div><span>{clock(end)} →</span>
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to focus the scroll region to pan the timeline.) -->
  <div class="timeline-scroll" role="region" tabindex="0" aria-label="Genre timeline. Scroll horizontally on smaller screens.">
    <div id="map" bind:clientWidth={mapWidth}>
      {#each chartRows as band, rowIndex}
        {@const endings = rowIndex === chartRows.length - 1 ? terminal : []}
        {@const capWidth = endings.length ? Math.min(140, diagramWidth / endings.length) : 0}
        {@const flowWidth = band.end > band.start ? diagramWidth - endings.length * capWidth : 0}
        <div class="map-row">
          <svg viewBox={`-8 0 ${diagramWidth + 16} 78`} preserveAspectRatio="none" role="group" aria-label={`Estimated party flow from ${clock(band.start)} to ${clock(band.end)}`}>
            {#each ruler(band.start, band.end, flowWidth) as time}
              {@const pos = x(time, band.start, band.end, flowWidth)}
              <line class="ruler-line" x1={pos} x2={pos} y1="23" y2="72" />
              <text class="tick" x={pos} y="15" text-anchor={time === band.start ? 'start' : time === band.end ? 'end' : 'middle'}>{clock(time)}</text>
            {/each}
            {#each model.sections.filter(s => s.end > band.start && s.start < band.end) as s}
              {@const left = x(s.start, band.start, band.end, flowWidth)}
              {@const width = Math.max(2, x(s.end, band.start, band.end, flowWidth) - left)}
              <g class="segment" class:lit={!active && selected === s.id} role="button" tabindex="0" aria-label={`${s.genre}, ${boundary(s)}, open ${s.tracks.length} tracks`} aria-pressed={!active && selected === s.id} onclick={() => select(s.id)} onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(s.id); } }}>
                <title>{s.genre} · {boundary(s)} · Open tracks</title>
                <rect class="genre-fill" x={left + 2} y="27" width={Math.max(0,width-4)} height="44" rx="5" fill={color(s.genre)} />
                <text class="map-label" x={left+10} y="45">{isHip(s.genre) ? 'Hip-hop' : s.genre}</text>
                <text class="map-label change-time" x={left+10} y="62">{changeTime(s)}</text>
              </g>
            {/each}
            {#each peaks.filter(p => p.end > band.start && p.start < band.end) as p}
              <rect x={x(Math.max(p.start,band.start),band.start,band.end,flowWidth)} y="74" width={Math.max(2,x(Math.min(p.end,band.end),band.start,band.end,flowWidth)-x(Math.max(p.start,band.start),band.start,band.end,flowWidth))} height="3" rx="1" fill="var(--fire)" />
            {/each}
            {#each endings as s, index}
              {@const left = flowWidth + index * capWidth}
              <g class="segment terminal-section" class:lit={!active && selected === s.id} role="button" tabindex="0" aria-label={`${s.genre}, ${boundary(s)}, open ${s.tracks.length} tracks`} aria-pressed={!active && selected === s.id} onclick={() => select(s.id)} onkeydown={e => { if(e.key === 'Enter' || e.key === ' ') {e.preventDefault();select(s.id);} }}>
                <title>{s.genre} · {boundary(s)} · End time not noted</title>
                <rect class="genre-fill" x={left+2} y="27" width={capWidth-4} height="44" rx="5" fill={color(s.genre)} />
                <text class="map-label" x={left+10} y="45">{isHip(s.genre) ? 'Hip-hop' : s.genre}</text>
                <text class="map-label change-time" x={left+10} y="62">{changeTime(s)} →</text>
              </g>
            {/each}
          </svg>
        </div>
      {/each}
    </div>
  </div>
  <p class="timeline-note">Estimated time scale · ~ marks a change within a known range · → ending not noted<span class="pan-hint"> · Swipe sideways to explore</span></p>
  <details><summary>Jump to a section or recorded time</summary>
    <div class="section-buttons">{#each model.sections as s}<button data-section={s.id} aria-pressed={!active && selected === s.id} onclick={() => select(s.id)}><span>{s.genre}</span><span>{boundary(s)}</span></button>{/each}</div>
    <div class="time-jumps" role="group" aria-label="Every exact time marker from the notes">{#each model.blocks.filter(b => b.tracks.length) as b}<button onclick={() => select(b.tracks[0].sectionId,b.tracks[0].id)}>{b.time}</button>{/each}</div>
  </details>
</section>
