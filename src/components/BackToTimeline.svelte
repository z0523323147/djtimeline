<script lang="ts">
 import {onMount} from 'svelte';
 let visible=false;
 onMount(()=>{
  let frame=0;
  const update=()=>{frame=0;const timeline=document.querySelector('.overview'),tracks=document.getElementById('detail');visible=Boolean(timeline&&tracks&&timeline.getBoundingClientRect().top< -40&&tracks.getBoundingClientRect().top<innerHeight/2&&tracks.getBoundingClientRect().bottom>0);};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);update();
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
 });
 function back(){window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});(document.getElementById('overview-heading') as HTMLElement|null)?.focus({preventScroll:true});}
</script>
{#if visible}<button class="back-to-timeline" onclick={back} aria-label="Back to party timeline">↑ Top</button>{/if}
