<script lang="ts">
 import {tick} from 'svelte';
 import {clockMinute,formatTime,type PlanEvent} from '../lib/documents';
 export let genres:string[]=[];
 export let draftKey='party-map-track-draft';
 let sourceUntimed=false;
 export let onSave:(input:{uid?:string;title:string;genre:string;start?:number;end?:number;peak:boolean;download:boolean;idea:boolean})=>void;
 let dialog:HTMLDialogElement;let nameInput:HTMLInputElement;
 let uid:string|undefined,title='',genre='',start='',end='',day=0,endDay=0,peak=false,download=false,idea=false,error='';
 let suggestions=false,index=0;
 $: options=[...new Map(genres.filter(g=>g!=='Unspecified').map(g=>[g.trim().toLocaleLowerCase(),g.trim()])).values()].filter(g=>!genre||g.toLocaleLowerCase().includes(genre.toLocaleLowerCase())).sort((a,b)=>Number(!a.toLocaleLowerCase().startsWith(genre.toLocaleLowerCase()))-Number(!b.toLocaleLowerCase().startsWith(genre.toLocaleLowerCase()))||a.localeCompare(b)).slice(0,8);
 export async function open(event?:PlanEvent,context?:{genre:string;peak:boolean}){
  error='';suggestions=false;uid=event?.uid;sourceUntimed=Boolean(event&&!event.timing);
  if(event?.kind==='song'){title=event.title;genre=event.timing?.genre??event.genreOverride??context?.genre??'';start=event.timing?formatTime(event.timing.start):'';day=event.timing?Math.floor(event.timing.start/1440):0;end=event.timing?.end!==undefined?formatTime(event.timing.end):'';endDay=event.timing?.end!==undefined?Math.floor(event.timing.end/1440):day;peak=context?.peak??event.peakOverride??event.isBanger;download=event.isToDownload;idea=event.isMyIdea;}
  else {title='';genre='';const now=new Date();start=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');end='';day=0;endDay=0;peak=false;download=false;idea=false;try{const saved=JSON.parse(localStorage.getItem(draftKey)??'null');if(saved&&typeof saved.title==='string'&&typeof saved.genre==='string'){title=saved.title;genre=saved.genre;start=saved.start;end=saved.end;day=saved.day;endDay=saved.endDay;peak=Boolean(saved.peak);download=Boolean(saved.download);idea=Boolean(saved.idea);}}catch{}}
  dialog.showModal();await tick();nameInput.focus();
 }
 function choose(value:string){genre=value;suggestions=false;index=0;}
 function keys(e:KeyboardEvent){
  if(e.key==='ArrowDown'){e.preventDefault();suggestions=true;index=Math.min(index+1,options.length-1);}
  if(e.key==='ArrowUp'){e.preventDefault();suggestions=true;index=Math.max(0,index-1);}
  if(e.key==='Enter'&&suggestions&&options.length){e.preventDefault();choose(options[index]??options[0]);}
  if(e.key==='Escape'&&suggestions){e.preventDefault();e.stopPropagation();suggestions=false;}
 }
 function keepDraft(){if(uid)return;try{if(title||genre)localStorage.setItem(draftKey,JSON.stringify({title,genre,start,end,day,endDay,peak,download,idea}));else localStorage.removeItem(draftKey);}catch{}}
 function submit(){try{if(end&&!start)throw new Error('Set an exact start before adding an end time.');onSave({uid,title,genre,...(start?{start:clockMinute(start,Number(day))}:{}),...(end?{end:clockMinute(end,Number(endDay))}:{}),peak,download,idea});title='';genre='';keepDraft();dialog.close();}catch(e){error=(e as Error).message;}}
</script>
<dialog class="track-dialog" bind:this={dialog} aria-labelledby="track-dialog-title" onclose={keepDraft}>
 <form onsubmit={e=>{e.preventDefault();submit();}}>
  <div class="dialog-heading"><h2 id="track-dialog-title">{uid?'Edit track':'Add track'}</h2><button type="button" aria-label="Close track editor" onclick={()=>dialog.close()}>×</button></div>
  <label for="track-name">Track name</label><input id="track-name" bind:this={nameInput} bind:value={title} dir="auto" required maxlength="500" autocomplete="off"/>
  <div class="genre-field"><label for="track-genre">Genre</label><input id="track-genre" bind:value={genre} required maxlength="120" dir="auto" role="combobox" aria-autocomplete="list" aria-expanded={suggestions&&options.length>0} aria-controls="genre-options" aria-activedescendant={suggestions&&options.length?'genre-option-'+index:undefined} autocomplete="off" onfocus={()=>{suggestions=true;index=0;}} oninput={()=>{suggestions=true;index=0;}} onkeydown={keys}/>
   {#if suggestions&&options.length}<ul id="genre-options" role="listbox" aria-label="Existing genres">{#each options as option,i}<li id={'genre-option-'+i} role="option" aria-selected={i===index}><button type="button" tabindex="-1" onmousedown={e=>e.preventDefault()} onclick={()=>choose(option)}>{option}</button></li>{/each}</ul>{/if}
  </div>
  {#if sourceUntimed}<p>Leave start blank to keep the original timing from your notes.</p>{/if}
  <div class="time-fields"><div><label for="track-start">Start time</label><input id="track-start" type="time" bind:value={start} required={!sourceUntimed} dir="ltr" onfocus={()=>suggestions=false}/></div><div><label for="track-end">End time <span>(optional)</span></label><input id="track-end" type="time" bind:value={end} dir="ltr" onfocus={()=>suggestions=false}/></div></div>
  <details class="track-options"><summary>Overnight timing</summary><div class="time-fields"><div><label for="track-day">Start day</label><select id="track-day" bind:value={day}>{#each [0,1,2,3,4,5,6] as d}<option value={d}>{d===0?'Same day':'+ '+d+' day'}</option>{/each}</select></div><div><label for="track-end-day">End day</label><select id="track-end-day" bind:value={endDay}>{#each [0,1,2,3,4,5,6] as d}<option value={d}>{d===0?'Same day':'+ '+d+' day'}</option>{/each}</select></div></div></details>
  <div class="song-flags"><label><input type="checkbox" bind:checked={peak}/>Peak</label><label><input type="checkbox" bind:checked={download}/>Download</label><label><input type="checkbox" bind:checked={idea}/>Idea</label></div>
  {#if error}<p class="account-error" role="alert">{error}</p>{/if}
  <div class="dialog-actions"><button type="button" onclick={()=>dialog.close()}>Cancel</button><button class="primary" type="submit">{uid?'Save track':'Add track'}</button></div>
 </form>
</dialog>
