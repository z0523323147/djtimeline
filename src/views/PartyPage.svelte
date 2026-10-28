<script lang="ts">
  import { onMount } from 'svelte';
  import {formatTime} from '../lib/documents';
  import type { Model } from '../lib/parser';
  import { boundary, changeTime, fullClock, color, isHip, position } from '../lib/timeline';
  export let model: Model;
  export let selected: number;
  export let focused = false;
  export let highlighted = false;
  export let resetScale: () => void = () => {};
  export let select: (id: number, trackId?: number) => void;
  let mapWidth = 1000;
  let dock: HTMLElement;
  onMount(() => {
    const parent = dock.closest<HTMLElement>('.cloud-plan');
    const update = () => parent?.style.setProperty('--timeline-offset', (dock.getBoundingClientRect().height + 16) + 'px');
    const observer = new ResizeObserver(update);observer.observe(dock);update();
    return () => {observer.disconnect();parent?.style.removeProperty('--timeline-offset');};
  });
  $: width = Math.max(100, mapWidth - 12);
  $: start = model.blocks[0]?.start ?? 0;
  $: end = Math.max(start,...model.blocks.map(b=>b.end),...model.sections.map(s=>s.end));
  $: gridStep = Math.max(5,Math.ceil((end-start)/2000/5)*5);
  $: hourStep = Math.max(60,Math.ceil(52/Math.max(.01,width/Math.max(1,end-start))/60)*60);
  $: step = width < 600 ? 10 : 5;
  $: minuteStep = Math.max(step,Math.ceil(14/Math.max(.01,width/Math.max(1,end-start))/step)*step);
  $: ticks = !model.blocks.length ? [] : [start, ...Array.from({length:Math.max(0,Math.ceil(end/gridStep)-Math.floor(start/gridStep)-1)},(_,i)=>(Math.floor(start/gridStep)+i+1)*gridStep).filter(t=>t>start&&t<end),...(end>start?[end]:[])];
  $: hours = ticks.filter(t=>t===start||t===end||t%hourStep===0).filter(t=>t===start||t===end||position(t,start,end,width)>42&&width-position(t,start,end,width)>42);
  $: minutes = ticks.filter(t=>t!==start&&t!==end&&t%60!==0&&t%minuteStep===0);
  $: current = model.sections.find(s=>s.id===selected);
  $: display = model.clock24?formatTime:fullClock;
  $: next = current ? model.sections[current.id+1] : undefined;
  $: ending = current ? next?.start===current.end?changeTime(next):current.end>current.start?(current.tracks.at(-1)?.explicitEnd!==undefined?'':'~')+display(current.end):'not recorded' : '';
  $: entryLabel = current ? 'Start '+changeTime(current) : '';
  $: exitLabel = 'End '+ending;
  $: entryWidth = entryLabel.length*7;
  $: exitWidth = exitLabel.length*7;
  $: entryX = current ? Math.max(0,Math.min(width-entryWidth,position(current.start,start,end,width)-entryWidth/2)) : 0;
  $: exitX = current ? Math.max(entryX+entryWidth+8,Math.min(width-exitWidth,position(current.end,start,end,width)-exitWidth/2)) : 0;
  $: labelShift = Math.max(0,exitX+exitWidth-width);
</script>
<section class="timeline-dock" bind:this={dock} aria-labelledby="overview-heading">
  <div class="timeline-head">
    <h2 id="overview-heading" tabindex="-1">Party timeline</h2>
    <div class="legend" aria-label="Genre colors"><span><i class="dot" style="--color:var(--cyan)"></i>Other genres</span><span><i class="dot" style="--color:var(--hip)"></i>Hip-hop</span><span><i class="dot" style="--color:var(--fire)"></i>Peak</span></div>
  </div>
  <div class="party-summary" bind:clientWidth={mapWidth}>
    <svg viewBox={'-6 0 '+(width+12)+' '+(highlighted?92:66)} style={'height:'+(highlighted?92:66)+'px'} role="group" aria-label="Party time ruler">
      {#if !model.blocks.length}<text class="tick" x="0" y="13">Time not noted</text>{/if}
      {#each ticks as time}<line class="ruler-grid" x1={position(time,start,end,width)} x2={position(time,start,end,width)} y1="34" y2="66"/>{/each}
      {#if end>start&&width/(end-start)>=4}{#each Array.from({length:Math.max(0,Math.ceil(end)-Math.floor(start))},(_,i)=>Math.floor(start)+i).filter(t=>t>start&&t<end&&t%5!==0) as minute}<line class="minor-grid" x1={position(minute,start,end,width)} x2={position(minute,start,end,width)} y1="34" y2="66"/>{/each}{/if}
      {#each hours.filter(t=>!focused||t%60===0) as time}<text class="tick ruler-label hour-label" data-minute={time} x={position(time,start,end,width)} y="13" text-anchor={time===end?'end':'start'}>{display(time)}</text>{/each}
      {#if !focused}{#each minutes as time}<text class="tick ruler-label minute-label" data-minute={time} x={position(time,start,end,width)} y="29" text-anchor="middle">{String(Math.floor(time)%60).padStart(2,'0')}</text>{/each}{/if}
      {#each model.sections as section}
        {@const left=position(section.start,start,end,width)}
        {@const barWidth=Math.max(4,position(section.end,start,end,width)-left)}
        <g class="ruler-section" class:lit={selected===section.id} data-ruler-section={section.id} role="button" tabindex="0" aria-label={section.genre+', '+boundary(section)+', open '+section.tracks.length+' tracks'} aria-pressed={selected===section.id} onclick={()=>select(section.id)} onkeydown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(section.id);}}}>
          <title>{section.genre} · {boundary(section)} · {section.tracks.length} tracks</title>
          <rect class="ruler-hit" x={Math.min(width-4,left)} y="34" width={barWidth} height="32" fill="transparent"/>
          <rect class="ruler-bar" x={Math.min(width-4,left)} y="39" width={barWidth} height="22" rx="2" fill={color(section.genre)}/>
          {#if section.tracks.some(t=>t.isBanger)}<line x1={left} x2={Math.min(width,left+barWidth)} y1="62" y2="62" stroke="var(--fire)" stroke-width="2"/>{/if}
        </g>
      {/each}
      {#if highlighted&&current}
        <g class="section-boundaries" aria-label={entryLabel+', '+exitLabel}>
          <line class="boundary-guide" x1={position(current.start,start,end,width)} x2={Math.max(0,entryX-labelShift)+entryWidth/2} y1="64" y2="70"/>
          <line class="boundary-guide" x1={position(current.end,start,end,width)} x2={exitX-labelShift+exitWidth/2} y1="64" y2="70"/>
          <text class="boundary-label entry-time" x={Math.max(0,entryX-labelShift)} y="84">{entryLabel}</text>
          <text class="boundary-label exit-time" x={exitX-labelShift} y="84">{exitLabel}</text>
        </g>
      {/if}
    </svg>
  </div>
  {#if highlighted&&current}<div class="ruler-focus"><span dir="auto">{current.genre}</span><span class="selected-times" dir="ltr">In {changeTime(current)} · Out {ending}</span><button class="scale-reset" aria-label={focused?'Show full time scale':'Show section times only'} onclick={resetScale}>{focused?'Full scale':'Section times'}</button></div>{/if}
</section>
<details class="overview genre-sequence" aria-label="Genre sections">
  <summary>Genre sections <span class="filter-count">{model.sections.length}</span><span class="sequence-hint">Choose a section</span></summary>
  <div class="section-buttons" role="group" aria-label="Genre sequence">
    {#each model.sections as s}
      <button data-section={s.id} class:wide={s.genre.length>15||s.genre==='Unspecified'} class:terminal-section={s.start===s.end} class:lit={selected===s.id} style={'--genre:'+color(s.genre)} aria-label={s.genre+', '+boundary(s)+', open '+s.tracks.length+' tracks'} aria-pressed={selected===s.id} title={boundary(s)+(s.start===s.end?' · ending not noted':'')} onclick={()=>select(s.id)}>
        <span class="genre-label"><span class="genre-name" dir="auto">{isHip(s.genre)?'Hip-hop':s.genre}</span><span class="genre-time" dir="ltr">{changeTime(s)}</span></span><span class="section-count" aria-label={s.tracks.length+' tracks'}>{s.tracks.length}</span>
      </button>
    {/each}
  </div>
  <details><summary>Jump to a section or recorded time</summary><div class="time-jumps" role="group" aria-label="Every exact time marker from the notes">{#each model.blocks.filter(b=>b.tracks.length) as b}<button onclick={()=>select(b.tracks[0].sectionId,b.tracks[0].id)}>{b.time}</button>{/each}</div></details>
</details>
