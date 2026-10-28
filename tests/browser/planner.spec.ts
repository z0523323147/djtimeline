import {test,expect} from './fixtures';import {mock,login} from './cloud-fixture';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
async function start(page:any,name:string){const offline=name.startsWith('offline');if(!offline)await mock(page);await page.goto(offline?pathToFileURL(resolve('dist/party-map.html')).href:'http://127.0.0.1:4180');if(!offline)await login(page,'a@example.test');const toggle=page.locator('.mobile-plans');if(await toggle.isVisible())await toggle.click();}
async function original(page:any){await page.getByRole('button',{name:'Import original party'}).click();await page.getByRole('button',{name:/Import to (account|browser)/}).click();}
test('empty-first shell, original template, full ruler and timeline above tracks',async({page},info)=>{
 await start(page,info.project.name);await expect(page.locator('.overview')).toHaveCount(0);await original(page);await expect(page.locator('.section-buttons button')).toHaveCount(26);await expect(page.locator('.ruler-section')).toHaveCount(26);await expect(page.locator('.hip-change,.uncertain-range')).toHaveCount(0);await expect(page.locator('.ruler-label')).toHaveCount(info.project.name.includes('phone')?22:43);await expect(page.locator('.tick').first()).toHaveText('12:30');await expect(page.locator('.hour-label').last()).toHaveText('04:00');
 const minuteRows=await page.locator('.minute-label').evaluateAll(labels=>new Set(labels.map(l=>Math.round(l.getBoundingClientRect().top))).size);expect(minuteRows).toBe(1);
 const geometry=await page.locator('.timeline-dock').evaluate(el=>{const labels=[...el.querySelectorAll('.ruler-label')].map(e=>e.getBoundingClientRect());return {positions:[...el.querySelectorAll('.ruler-label')].map(e=>({text:e.textContent,x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})),overflow:document.documentElement.scrollWidth>innerWidth,collision:labels.some((a,i)=>labels.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top))};});expect(geometry.overflow).toBe(false);expect(geometry.collision,JSON.stringify(geometry)).toBe(false);
 if(info.project.name==='offline-desktop')await page.screenshot({path:'party-map-track-first-desktop.png',fullPage:false});if(info.project.name==='offline-phone')await page.screenshot({path:'party-map-track-first-phone.png',fullPage:false});
 await expect(page.locator('.track-time').first()).toHaveText('12:30 → ~12:33');

 await page.locator('.genre-sequence > summary').click();const last=page.locator('.section-buttons button').last();await last.focus();await last.press('Enter');await expect(last).toHaveClass(/lit/);await expect(page.locator('.minute-label')).toHaveCount(0);await expect(page.locator('.selected-times')).toContainText('Out not recorded');await expect(page.locator('#tracks .title').last()).toHaveText('Me pregunto');await expect(page.locator('#tracks .title')).toHaveCount(126);await page.getByRole('button',{name:'All tracks',exact:true}).click();await expect(page.locator('#tracks .title')).toHaveCount(126);await expect(page.locator('.track-dialog')).not.toBeVisible();
});
test('track dialog validation, same-genre merge, multilingual copy/search and theme persistence',async({page},info)=>{
 await start(page,info.project.name);await page.getByLabel('New plan name',{exact:true}).fill('New party');await page.getByRole('button',{name:'Create plan',exact:true}).click();await page.getByRole('button',{name:'+ Add track',exact:true}).click();await page.getByLabel('Track name',{exact:true}).fill('שלום & Вечер');await page.getByLabel('Genre',{exact:true}).fill('House');await page.getByLabel('Start time',{exact:true}).fill('01:00');await page.getByLabel('End time (optional)',{exact:true}).fill('00:59');await page.locator('.track-dialog').getByRole('button',{name:'Add track',exact:true}).click();await expect(page.locator('.track-dialog [role=alert]')).toBeVisible();await page.getByLabel('End time (optional)',{exact:true}).fill('');await page.locator('.track-dialog').getByRole('button',{name:'Add track',exact:true}).click();await expect(page.locator('.track-dialog')).not.toBeVisible();
 const search=page.getByRole('link',{name:'Search Google for שלום & Вечер download',exact:true});expect(new URL((await search.getAttribute('href'))!).searchParams.get('q')).toBe('שלום & Вечер download');await page.getByRole('button',{name:'+ Add track',exact:true}).click();await page.getByLabel('Track name',{exact:true}).fill('Second');await page.getByLabel('Genre',{exact:true}).fill('house');await page.getByLabel('Start time',{exact:true}).fill('01:05');await page.locator('.track-dialog').getByRole('button',{name:'Add track',exact:true}).click();await expect(page.locator('.section-buttons button')).toHaveCount(1);
 await page.getByLabel('Color theme').selectOption('light');await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','light');await expect(page.locator('.plan-empty')).toBeVisible();
});

test('sticky ruler selects tracks and follows all-track scrolling without filtering',async({page},info)=>{
 await start(page,info.project.name);await original(page);
 const dock=page.locator('.timeline-dock');expect(await dock.evaluate(el=>el.getBoundingClientRect().height)).toBeLessThan(180);
 await page.locator('[data-ruler-section="7"]').press('Enter');
 await expect(page.locator('#detail-title')).toHaveText('Hip hop');await expect(page.locator('.minute-label')).toHaveCount(0);await expect(page.locator('.selected-times')).toHaveText('In 01:50 · Out 01:57');
 expect(await page.locator('.hour-label').evaluateAll(labels=>labels.every(el=>Number(el.getAttribute('data-minute'))%60===0))).toBe(true);
 expect(await dock.evaluate(el=>Math.abs(el.getBoundingClientRect().top))).toBeLessThan(2);
 expect(await page.locator('[data-chapter-id="7"]').evaluate(el=>el.getBoundingClientRect().top-document.querySelector('.timeline-dock')!.getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(8);
 await page.getByRole('button',{name:'All tracks',exact:true}).click();await expect(page.locator('#tracks .title')).toHaveCount(126);
 const fifth=page.locator('#tracks [data-section-id="17"]').first();await fifth.evaluate(el=>el.scrollIntoView({block:'start'}));await page.mouse.wheel(0,1);await expect(page.locator('[data-ruler-section="17"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#tracks .title')).toHaveCount(126);await expect(page.getByRole('button',{name:'All tracks',exact:true})).toHaveAttribute('aria-pressed','true');expect(await dock.evaluate(el=>Math.abs(el.getBoundingClientRect().top))).toBeLessThan(2);
 await page.locator('#tracks [data-section-id="3"]').first().evaluate(el=>el.scrollIntoView({block:'start'}));await page.mouse.wheel(0,1);await expect(page.locator('[data-ruler-section="3"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('.selected-times')).toContainText('~01:23–01:30');
 await page.getByRole('button',{name:'Show full time scale'}).click();await expect(page.locator('.minute-label')).not.toHaveCount(0);
 await page.locator('#tracks [data-section-id="7"]').first().evaluate(el=>el.scrollIntoView({block:'start'}));await page.mouse.wheel(0,1);await expect(page.locator('[data-ruler-section="7"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('.minute-label')).not.toHaveCount(0);await expect(page.locator('.entry-time')).toHaveText('Start 01:50');await expect(page.locator('.exit-time')).toHaveText('End 01:57');
 const bounds=await page.locator('.section-boundaries').evaluate(el=>{const labels=[...el.querySelectorAll('text')].map(e=>e.getBoundingClientRect());return {overlap:labels[0].right>labels[1].left,overflow:labels.some(l=>l.left<0||l.right>innerWidth)};});expect(bounds).toEqual({overlap:false,overflow:false});
 await page.getByRole('button',{name:'Show section times only'}).click();await expect(page.locator('.minute-label')).toHaveCount(0);await expect(page.getByRole('button',{name:'Back to party timeline'})).toBeVisible();await page.getByRole('button',{name:'Back to party timeline'}).click();await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
 await page.locator('[data-ruler-section="25"]').press('Space');await expect(page.locator('#tracks .title').last()).toHaveText('Me pregunto');await expect(page.locator('#tracks .title')).toHaveCount(126);await expect(page.locator('.selected-times')).toContainText('Out not recorded');await expect(page.locator('.track-dialog')).not.toBeVisible();
});

test('numbered chapters continue on scroll, counted filters and compact accessible navigation',async({page},info)=>{
 await start(page,info.project.name);await original(page);
 await expect(page.locator('.genre-sequence')).not.toHaveAttribute('open','');
 const initial=await page.locator('.track').first().boundingBox();expect(initial!.y).toBeLessThan(info.project.name.includes('short')?700:info.project.name.includes('phone')?780:850);
 await expect(page.locator('.track-number').first()).toHaveText('1.');await expect(page.locator('.track-number').last()).toHaveText('126.');
 await expect(page.getByRole('button',{name:'All tracks',exact:true})).toContainText('126');
 await expect(page.getByRole('button',{name:/Downloads/})).toContainText('42');await expect(page.getByRole('button',{name:/Ideas/})).toContainText('2');await expect(page.getByRole('button',{name:/Peaks/})).toContainText('25');
 await expect(page.getByLabel('Filter genre').locator('option').filter({hasText:'Hip hop'})).toContainText('31');
 await page.locator('[data-ruler-section="7"]').press('Enter');await expect(page.locator('[data-chapter-id="7"]')).toBeFocused();
 await expect(page.locator('#tracks .title')).toHaveCount(126);
 const scale=await page.getByRole('button',{name:'Show full time scale'}).boundingBox();expect(scale!.height).toBeGreaterThanOrEqual(44);
 const last=page.locator('.track[data-section-id="7"]').last();await last.evaluate(e=>e.scrollIntoView({block:'start'}));
 const delta=await page.locator('.track[data-section-id="8"]').first().evaluate(e=>e.getBoundingClientRect().top-document.querySelector('.timeline-dock')!.getBoundingClientRect().bottom+24);
 await page.mouse.wheel(0,Math.max(50,delta));await expect(page.locator('[data-ruler-section="8"]')).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:/Downloads/}).click();await expect(page.locator('.track')).toHaveCount(42);
 const numbers=await page.locator('.track-number').allTextContents();expect(numbers).not.toEqual(numbers.map((_,i)=>`${i+1}.`));
 await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.locator('.track')).toHaveCount(126);
 await page.getByLabel('Color theme').selectOption('light');
 const contrast=await page.locator('.tags .download').first().evaluate(e=>{const rgb=(s:string)=>s.match(/[\d.]+/g)!.slice(0,3).map(Number);const l=(c:number[])=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);const a=l(rgb(getComputedStyle(e).color)),b=l(rgb(getComputedStyle(document.querySelector('.detail')!).backgroundColor));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});expect(contrast).toBeGreaterThan(4.5);
 await expect(page.locator('.search-action').first()).toContainText('Find');
 await page.getByRole('button',{name:'My plans',exact:true}).click();
 if(info.project.name.includes('phone')){await expect(page.locator('.plans-rail')).toBeVisible();await expect(page.getByLabel('Search plans')).toBeFocused();}
 await page.getByRole('button',{name:'New plan',exact:true}).click();await expect(page.getByLabel('New plan name',{exact:true})).toBeFocused();
});
