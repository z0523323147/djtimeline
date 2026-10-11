import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseNotes } from '../src/lib/parser.ts';
import { changeTime } from '../src/lib/timeline.ts';
const model = parseNotes(readFileSync('src/data/example-notes.txt','utf8'));
const browser = await chromium.launch();
const results = [];
try {
  for (const viewport of [{width:1280,height:900},{width:390,height:844},{width:1280,height:600}]) {
    const page = await browser.newPage({viewport});
    await page.goto('http://127.0.0.1:4180');
    await page.locator('.section-buttons button').last().waitFor();
    await page.evaluate(() => document.fonts.ready);
    results.push(await page.evaluate(({sections,viewport}) => {
      const root = document.querySelector('.overview'), sequence = root.querySelector('.section-buttons');
      const width = sequence.clientWidth;
      const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      ctx.font = getComputedStyle(root.querySelector('.genre-name')).font;
      const names = sections.map(s => ({...s, nameWidth:ctx.measureText(s.genre).width}));
      ctx.font = getComputedStyle(root.querySelector('.switch-label')).font;
      const timed = names.map(s => ({...s, labelWidth:Math.max(s.nameWidth,ctx.measureText(s.time).width)+20}));
      // Render disposable alternatives with measured fonts and real section coordinates.
      const prototype = document.createElement('div');
      prototype.style.cssText = 'position:absolute;left:-10000px;top:0;width:'+width+'px';
      document.body.append(prototype);
      const groups=[];let group=[];
      const fit = list => list.every(s => (s.end-s.start)/(list.at(-1).end-list[0].start)*width >= Math.max(44,s.labelWidth));
      for (const s of timed.filter(s => s.end>s.start)) {if(group.length&&!fit([...group,s])){groups.push(group);group=[];}group.push(s);}if(group.length)groups.push(group);
      for (const group of groups) {
        const row=document.createElement('div');row.style.cssText='display:flex;height:60px';
        for(const s of group){const b=document.createElement('button');const genre=document.createElement('span'),time=document.createElement('span');genre.textContent=s.genre;time.textContent=s.time;genre.style.display='block';time.style.cssText='display:block;font-size:12px';b.append(genre,time);b.style.cssText='width:'+((s.end-s.start)/(group.at(-1).end-group[0].start)*width)+'px;flex:none;font-size:14px';row.append(b);}prototype.append(row);
      }
      for(const s of timed.filter(s=>s.end===s.start)){const row=document.createElement('div'),b=document.createElement('button');b.textContent=s.genre+' '+s.time+' →';row.append(b);prototype.append(row);}
      const proportionalRows=prototype.children.length;
      const proportionalSectionCount=prototype.querySelectorAll('button').length;
      prototype.replaceChildren();
      const ends=[];
      for(const s of names){const w=Math.max(64,s.nameWidth+20),anchor=(s.start-sections[0].start)/(sections.at(-1).start-sections[0].start)*width,left=Math.max(0,Math.min(width-w,anchor-w/2));let lane=ends.findIndex(e=>e+5<=left);if(lane<0)lane=ends.length;ends[lane]=left+w;const b=document.createElement('button');b.textContent=s.genre;b.style.cssText=`position:absolute;top:${lane*49}px;left:${left}px;width:${w}px;font-size:14px`;prototype.append(b);}
      const staggeredRows=ends.length;prototype.remove();
      const buttons=[...sequence.querySelectorAll('button')], boxes=buttons.map(b=>b.getBoundingClientRect());
      const labels=[...root.querySelectorAll('.switch-label')].map(l=>l.getBoundingClientRect());
      const first=document.querySelector('#tracks .track').getBoundingClientRect();
      return {viewport,availableWidth:width,sectionCount:buttons.length,proportionalFullLabelsRows:proportionalRows,proportionalSectionCount,staggeredLabelLanes:staggeredRows,wrappedGenreRows:new Set(boxes.map(b=>Math.round(b.top))).size,wrapAreaLowerBoundRows:Math.ceil(boxes.reduce((sum,b)=>sum+b.width+5,0)/(width+5)),overviewHeight:root.getBoundingClientRect().height,annotationLanes:new Set(labels.map(l=>Math.round(l.top))).size,minimumTarget:{width:Math.min(...boxes.map(b=>b.width)),height:Math.min(...boxes.map(b=>b.height))},timelineOverflow:root.scrollWidth>root.clientWidth+1||root.scrollHeight>root.clientHeight+1,firstTrackVisible:first.top>=0&&first.bottom<=viewport.height};
    },{sections:model.sections.map(s=>({...s,tracks:undefined,time:changeTime(s)})),viewport}));
    await page.close();
  }
} finally { await browser.close(); }
writeFileSync('docs/timeline-layout-metrics.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
