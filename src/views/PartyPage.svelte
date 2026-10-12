<script lang="ts">
  import { onMount } from 'svelte';
  import type { Model } from '../lib/parser';
  import { annotationLanes, boundary, clock, color, hipChanges, isHip, overviewRuns, peakRuns, position } from '../lib/timeline';
  export let model: Model;
  export let selected: number;
  export let active: boolean;
  export let select: (id: number, trackId?: number) => void;
  let mapWidth = 1000;
  let measure: ((text: string) => number) | undefined;
  onMount(() => {
    const context = document.createElement('canvas').getContext('2d');
    if (context) {
      context.font = '12px system-ui, sans-serif';
      measure = text => context.measureText(text).width + 4;
    }
  });
  $: width = Math.max(100, mapWidth - 12);
  $: start = model.blocks[0]?.start ?? 0;
  $: end = model.blocks.at(-1)?.start ?? start;
  $: flow = overviewRuns(model);
  $: peaks = peakRuns(model);
  $: changes = hipChanges(model);
  $: annotations = annotationLanes(changes.map(c => ({ anchor: position(c.section.start, start, end, width), width: measure ? measure(c.label) : c.label.length * 8 })), width);
  $: lanes = Math.max(0, ...annotations.map(a => a.lane + 1));
  $: chartHeight = 54 + lanes * 24;
  $: step = width < 600 ? 60 : 30;
  $: ticks = !model.blocks.length ? [] : [start, ...Array.from({ length: Math.max(0, Math.ceil(end / 10) - Math.floor(start / 10) - 1) }, (_, i) => (Math.floor(start / 10) + i + 1) * 10).filter(t => t > start && t < end), ...(end > start ? [end] : [])];
  $: current = !active ? model.sections.find(s => s.id === selected) : undefined;
</script>
<section class="overview" aria-labelledby="overview-heading">
  <div class="timeline-head">
    <h2 id="overview-heading" tabindex="-1">Party timeline</h2>
    <div class="legend" aria-label="Genre colors"><span><i class="dot" style="--color:var(--cyan)"></i>Other genres</span><span><i class="dot" style="--color:var(--hip)"></i>Hip-hop</span><span><i class="dot" style="--color:var(--fire)"></i>Peak</span></div>
  </div>
  <div class="party-summary" bind:clientWidth={mapWidth}>
    <svg viewBox={`-6 0 ${width + 12} ${chartHeight}`} style={`height:${chartHeight}px`} role="img" aria-label={`Estimated whole-party time scale, ${model.blocks[0]?.time ?? 'Time not noted'} to ${model.blocks.at(-1)?.time ?? 'Time not noted'}. ${changes.map(c => `${c.entering ? 'Into' : 'Out of'} hip-hop, ${boundary(c.section)}`).join('; ')}. Ending not recorded.`}>
      {#if !model.blocks.length}<text class="tick" x="0" y="13">Time not noted</text>{/if}
      {#each ticks as time}
        {@const x = position(time, start, end, width)}
        {@const labeled = time === start || time === end || time % step === 0 && x > 55 && width - x > 55 && !changes.some(c => c.section.exact && c.section.start === time)}
        <line class="ruler-line" x1={x} x2={x} y1="21" y2={labeled ? 28 : 25} />
        {#if labeled}<text class="tick" x={x} y="13" text-anchor={time === start ? 'start' : time === end ? 'end' : 'middle'}>{time === start && model.blocks[0]?.time === 'Unscheduled' ? 'Time not noted' : clock(time)}</text>{/if}
      {/each}
      {#each flow as run}
        <rect x={position(run.start,start,end,width)} y="29" width={position(run.end,start,end,width)-position(run.start,start,end,width)} height="12" fill={color(run.genre)} opacity=".65" />
      {/each}
      {#each peaks as peak}
        <rect x={position(peak.start,start,end,width)} y="43" width={Math.max(2,position(peak.end,start,end,width)-position(peak.start,start,end,width))} height="3" fill="var(--fire)" />
      {/each}
      {#if current}
        <rect class="overview-selection" data-selected={current.id} x={Math.max(0,position(current.start,start,end,width)-1)} y="28" width={Math.max(2,position(current.end,start,end,width)-position(current.start,start,end,width))} height="14" rx="2" fill={color(current.genre)} />
      {/if}
      {#each changes as change, i}
        {@const a = annotations[i]}
        {@const anchor = position(change.section.start,start,end,width)}
        <g class="hip-change" data-entering={change.entering} aria-label={`${change.entering ? 'Into' : 'Out of'} hip-hop, ${boundary(change.section)}`}>
          <title>{change.entering ? 'Into' : 'Out of'} hip-hop · {boundary(change.section)}{change.section.start === change.section.end ? ' · ending not noted' : ''}</title>
          {#if !change.section.exact}
            <rect class="uncertain-range" x={position(change.section.boundStart,start,end,width)} y="27" width={Math.max(2,position(change.section.boundEnd,start,end,width)-position(change.section.boundStart,start,end,width))} height="16" />
          {:else}<line class="switch-marker" x1={anchor} x2={anchor} y1="27" y2="46" />{/if}
          <path class="switch-guide" d={`M${anchor},47 V${52+a.lane*24} L${a.left+a.width/2},${52+a.lane*24}`} />
          <text class="switch-label" x={a.left} y={68+a.lane*24}>{change.label}</text>
        </g>
      {/each}
      {#if model.sections.some(s => s.end === s.start)}<text class="open-end" x={width} y="39" text-anchor="end"><title>Ending not recorded</title>→</text>{/if}
    </svg>
  </div>
  <h3 class="sequence-heading">Genre sequence</h3>
  <div class="section-buttons" role="group" aria-label="Genre sequence">
    {#each model.sections as s, index}
      <button data-section={s.id} class:wide={s.genre.length > 15 || s.genre === 'Unspecified'} class:terminal-section={s.start === s.end} class:lit={!active && selected === s.id} style={`--genre:${color(s.genre)}`} aria-label={`${s.genre}, ${boundary(s)}, open ${s.tracks.length} tracks`} aria-pressed={!active && selected === s.id} title={`${boundary(s)}${s.start === s.end ? ' · ending not noted' : ''}`} onclick={() => select(s.id)}>
        <span class="ordinal" aria-hidden="true">{index + 1}</span><span class="genre-name" dir="auto">{isHip(s.genre) ? 'Hip-hop' : s.genre}</span>
      </button>
    {/each}
  </div>
  <details><summary>Jump to a section or recorded time</summary>
    <p class="timing-key">Dotted outline: hip-hop changes somewhere within that time range. The notes do not give an exact minute.</p>
    <div class="time-jumps" role="group" aria-label="Every exact time marker from the notes">{#each model.blocks.filter(b => b.tracks.length) as b}<button onclick={() => select(b.tracks[0].sectionId,b.tracks[0].id)}>{b.time}</button>{/each}</div>
  </details>
</section>
