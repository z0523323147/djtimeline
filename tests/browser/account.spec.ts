import { test, expect } from './fixtures';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const base = 'https://aemfewsfcrcmtafnypxa.supabase.co';
const ids = { a: '11111111-1111-4111-8111-111111111111', b: '22222222-2222-4222-8222-222222222222' };
const user = (id: string, email: string) => ({ id, email, aud:'authenticated', role:'authenticated', app_metadata:{provider:'email'}, user_metadata:{}, created_at:'2026-10-12T10:00:00Z' });
const token = (id: string) => [Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:id,aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600,iss:base+'/auth/v1'})).toString('base64url'),'test-signature'].join('.');
const url = (name: string) => name.startsWith('connected') ? pathToFileURL(resolve('dist/party-map-connected.html')).href : 'http://127.0.0.1:4180';
async function mock(page: import('@playwright/test').Page, delayed = false) {
  let current = user(ids.a,'a@example.test');
  const documents = new Map<string,any>();
  let saveFailure: 'network'|'conflict'|null = null;
  let plans = [{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',owner_id:ids.a,name:'A private plan',created_at:'2026-10-12T10:00:00Z',updated_at:'2026-10-12T10:00:00Z'}];
  await page.route(base+'/**',async route => {
    const req=route.request(),path=new URL(req.url()).pathname;
    const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS','x-supabase-api-version':'2024-01-01','access-control-expose-headers':'x-supabase-api-version'};
    if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
    if(path.endsWith('/signup') || path.endsWith('/token')){
      const body=req.postDataJSON();
      if(body.password!=='Synthetic-password-123'){await route.fulfill({status:400,json:{code:'invalid_credentials',msg:'Invalid login credentials'},headers});return;}
      current=body.email.startsWith('b')?user(ids.b,body.email):user(ids.a,body.email);
      await route.fulfill({json:{access_token:token(current.id),token_type:'bearer',refresh_token:'synthetic-refresh',expires_in:3600,user:current},headers});return;
    }
    if(path.endsWith('/user')){await route.fulfill({json:current,headers});return;}
    if(path.endsWith('/logout')){await route.fulfill({json:{},headers});return;}
    if(path.endsWith('/rpc/create_club_plan') || path.endsWith('/rpc/create_club_plan_with_document')){
      const body=req.postDataJSON();expect(body.p_owner_id).toBe(current.id);
      const plan={id:body.p_id,owner_id:current.id,name:body.p_name,created_at:'2026-10-12T11:00:00Z',updated_at:'2026-10-12T11:00:00Z'};plans=[...plans,plan];if(body.p_document)documents.set(plan.id,{plan_id:plan.id,revision:1,document:body.p_document});await route.fulfill({json:plan,headers});return;
    }
    if(path.endsWith('/club_plan_documents')){
      const id=new URL(req.url()).searchParams.get('plan_id')?.slice(3)!;
      const plan=plans.find(p=>p.id===id && p.owner_id===current.id);
      if(!plan){await route.fulfill({status:404,json:{code:'PGRST116',message:'Not found'},headers});return;}
      const doc=documents.get(id)??{plan_id:id,revision:0,document:{version:1,events:[]}};
      documents.set(id,doc);await route.fulfill({json:doc,headers});return;
    }
    if(path.endsWith('/rpc/save_club_plan_document')){
      const body=req.postDataJSON();expect(body.p_owner_id).toBe(current.id);
      if(saveFailure){const conflict=saveFailure==='conflict';saveFailure=null;await route.fulfill({status:conflict?409:503,json:{code:conflict?'40001':'unavailable',message:conflict?'Plan changed elsewhere. Your draft has been kept.':'Server unavailable'},headers});return;}
      const previous=documents.get(body.p_plan_id);
      expect(body.p_expected_revision).toBe(previous.revision);
      const doc={plan_id:body.p_plan_id,revision:previous.revision+1,document:body.p_document};documents.set(body.p_plan_id,doc);await route.fulfill({json:doc,headers});return;
    }
    if(path.endsWith('/rpc/rename_club_plan')){const body=req.postDataJSON();const plan=plans.find(p=>p.id===body.p_id && p.owner_id===current.id)!;plan.name=body.p_name;await route.fulfill({json:plan,headers});return;}
    if(path.endsWith('/club_plans')){
      const owner=new URL(req.url()).searchParams.get('owner_id');
      expect(owner).toBe('eq.'+current.id);
      const result=plans.filter(p=>p.owner_id===current.id);
      if(delayed&&current.id===ids.a)await new Promise(r=>setTimeout(r,500));
      await route.fulfill({json:result,headers});return;
    }
    await route.fulfill({status:404,json:{message:'Unexpected test route'},headers});
  });
  return {failSave:(kind:'network'|'conflict')=>saveFailure=kind, documents};
}
async function login(page: import('@playwright/test').Page,email: string) {
  await page.getByLabel('Email address',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill('Synthetic-password-123');
  await page.locator('.account-form').getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('heading',{name:'My plans',exact:true})).toBeVisible();
}
test('email/password, private area, account switch, create and reload',async({page},info)=>{
  await mock(page);await page.goto(url(info.project.name));
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByLabel('Email address',{exact:true}).fill('a@example.test');
  await page.getByLabel('Password',{exact:true}).fill('wrong-password');
  await page.locator('.account-form').getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Email or password is incorrect');
  await expect(page.getByLabel('Password',{exact:true})).toHaveValue('');
  await login(page,'a@example.test');
  await expect(page.locator('.account-plans')).toContainText('A private plan');
  await page.getByLabel('New plan name',{exact:true}).fill('My Friday');
  await page.getByRole('button',{name:'Create plan',exact:true}).click();
  await expect(page.locator('#cloud-plan-title')).toHaveText('My Friday');
  await page.locator('.plan-toolbar').getByRole('button',{name:'My plans',exact:true}).click();
  await expect(page.locator('.account-plans')).toContainText('My Friday');
  await page.reload();await expect(page.locator('.account-plans')).toContainText('My Friday');
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.locator('.account-plans')).toHaveCount(0);
  await login(page,'b@example.test');
  await expect(page.locator('.account-empty')).toContainText('No plans yet');
  await expect(page.locator('.account-area')).not.toContainText('A private plan');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('confirmation and missing-schema failures are honest, denied storage remains usable',async({page},info)=>{
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
  await mock(page);
  await page.route(base+'/auth/v1/token**',route=>route.fulfill({status:400,json:{code:'email_not_confirmed',msg:'Not authorized'},headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','x-supabase-api-version':'2024-01-01','access-control-expose-headers':'x-supabase-api-version'}}));
  await page.goto(url(info.project.name));await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByLabel('Email address',{exact:true}).fill('a@example.test');await page.getByLabel('Password',{exact:true}).fill('Synthetic-password-123');await page.locator('.account-form').getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('requires email confirmation');
  await expect(page.locator('.account-area')).toContainText('only for this session');
  await page.unroute(base+'/auth/v1/token**');
  await page.route(base+'/rest/v1/club_plans**',route=>route.fulfill({status:404,json:{code:'PGRST205',message:'Not installed'},headers:{'access-control-allow-origin':'*'}}));
  await login(page,'a@example.test');
  await expect(page.getByRole('alert')).toContainText('database setup is not installed');
  await expect(page.getByRole('button',{name:'Retry loading plans',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Local planner',exact:true}).click();
  await expect(page.locator('#tracks .title').first()).toHaveText('Shakira beautiful life 116 bpm');
});

test('late plan response from a previous account cannot populate the next account',async({page},info)=>{
  await mock(page,true);await page.goto(url(info.project.name));
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await login(page,'a@example.test');
  const previousResponse=page.waitForResponse(r=>r.url().includes('/club_plans')&&r.url().includes(ids.a));
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await login(page,'b@example.test');
  await previousResponse;
  await expect(page.locator('.account-empty')).toContainText('No plans yet');
  await expect(page.locator('.account-area')).not.toContainText('A private plan');
});


test('signup opens a private area only when Supabase returns a session',async({page},info)=>{
  await mock(page);await page.goto(url(info.project.name));
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByRole('button',{name:'New here? Create account',exact:true}).click();
  await page.route(base+'/auth/v1/signup',route=>route.fulfill({json:user(ids.b,'b@example.test'),headers:{'access-control-allow-origin':'*'}}));
  await page.getByLabel('Email address',{exact:true}).fill('b@example.test');
  await page.getByLabel('Password',{exact:true}).fill('Synthetic-password-123');
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await expect(page.locator('.account-status')).toContainText('not signed in yet');
  await expect(page.getByRole('heading',{name:'My plans',exact:true})).toHaveCount(0);
  await expect(page.getByLabel('Password',{exact:true})).toHaveValue('');
  await page.unroute(base+'/auth/v1/signup');
  await page.getByLabel('Password',{exact:true}).fill('Synthetic-password-123');
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await expect(page.getByRole('heading',{name:'My plans',exact:true})).toBeVisible();
  await expect(page.locator('.account-empty')).toContainText('No plans yet');
});


async function addSongToPlan(page:import('@playwright/test').Page,title:string){
  await page.getByLabel('Genre',{exact:true}).fill('Hip hop');
  await page.getByLabel('Start time (optional)',{exact:true}).fill('1:30');
  await page.getByRole('button',{name:'Add section',exact:true}).click();
  await page.getByLabel('Song name',{exact:true}).fill(title);
  await page.getByRole('button',{name:'Add song',exact:true}).click();
  await expect(page.locator('#tracks .title')).toHaveText(title);
}
test('open existing plan, add songs, save, reload and switch independent plans',async({page},info)=>{
 await mock(page);await page.goto(url(info.project.name));await page.getByRole('button',{name:'Sign in',exact:true}).click();await login(page,'a@example.test');
 await page.getByRole('button',{name:'Open A private plan',exact:true}).click();
 await expect(page.locator('#cloud-plan-title')).toHaveText('A private plan');
 await addSongToPlan(page,'כך זה אופק (remix)');
 await expect(page.getByRole('button',{name:'My plans',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Save to account',exact:true}).click();await expect(page.locator('.plan-toolbar')).toContainText('Saved to your account');
 await page.reload();await expect(page.locator('#cloud-plan-title')).toHaveText('A private plan');await expect(page.locator('#tracks .title')).toHaveText('כך זה אופק (remix)');
 await page.getByRole('button',{name:'Edit כך זה אופק (remix)',exact:true}).click();await page.getByLabel('Correct track name',{exact:true}).fill('Corrected Hebrew mix');await page.locator('.edit-form').getByRole('button',{name:'Save',exact:true}).click();
 await page.getByRole('button',{name:'Save to account',exact:true}).click();await expect(page.locator('.plan-toolbar')).toContainText('Saved to your account');
 await page.locator('.plan-toolbar').getByRole('button',{name:'My plans',exact:true}).click();
 await page.getByLabel('New plan name',{exact:true}).fill('Second party');await page.getByRole('button',{name:'Create plan',exact:true}).click();
 await expect(page.locator('#cloud-plan-title')).toHaveText('Second party');await expect(page.locator('#tracks .title')).toHaveCount(0);
 await addSongToPlan(page,'Second plan song');await page.getByRole('button',{name:'Save to account',exact:true}).click();await expect(page.locator('.plan-toolbar')).toContainText('Saved to your account');
 await page.locator('.plan-toolbar').getByRole('button',{name:'My plans',exact:true}).click();await page.getByRole('button',{name:'Open A private plan',exact:true}).click();
 await expect(page.locator('#tracks .title')).toHaveText('Corrected Hebrew mix');
 await page.getByRole('button',{name:'All tracks',exact:true}).click();await expect(page.getByLabel('Genre section',{exact:true})).toHaveValue('');await expect(page.getByRole('button',{name:'Add song',exact:true})).toBeDisabled();await page.locator('.plan-editors summary').filter({hasText:'Add song'}).click();await page.locator('.section-buttons button').first().click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 if(info.project.name==='connected-desktop')await page.screenshot({path:'party-map-cloud.png',fullPage:true});
 if(info.project.name==='connected-phone')await page.screenshot({path:'party-map-cloud-mobile.png',fullPage:true});
});
test('failed save retains a recoverable draft and stale save cannot overwrite account content',async({page},info)=>{
 const api=await mock(page);await page.goto(url(info.project.name));await page.getByRole('button',{name:'Sign in',exact:true}).click();await login(page,'a@example.test');await page.getByRole('button',{name:'Open A private plan',exact:true}).click();
 await addSongToPlan(page,'Recover me');api.failSave('network');await page.getByRole('button',{name:'Save to account',exact:true}).click();await expect(page.locator('.plan-toolbar')).toContainText('Save failed');
 // Simulate a new page context without triggering the native unsaved-work prompt.
 page.on('dialog',dialog=>dialog.accept());await page.reload();await expect(page.locator('#cloud-plan-title')).toHaveText('A private plan');await expect(page.locator('#tracks .title')).toHaveText('Recover me');await expect(page.locator('.plan-toolbar')).toContainText('Recovered unsaved draft');
 await page.getByRole('button',{name:'Save to account',exact:true}).click();await expect(page.locator('.plan-toolbar')).toContainText('Saved to your account');
 await page.locator('.plan-editors summary').filter({hasText:'Add song'}).click();await page.getByLabel('Song name',{exact:true}).fill('Keep on conflict');await page.getByRole('button',{name:'Add song',exact:true}).click();api.failSave('conflict');await page.getByRole('button',{name:'Save to account',exact:true}).click();
 await expect(page.locator('.plan-toolbar')).toContainText('Changed elsewhere');await expect(page.locator('#tracks .title')).toContainText(['Recover me','Keep on conflict']);await expect(page.getByRole('button',{name:'Save to account',exact:true})).toBeDisabled();
});


test('atomic import, plan rename, flags, removal and undo remain in the database document',async({page},info)=>{
 await mock(page);await page.goto(url(info.project.name));await page.getByRole('button',{name:'Sign in',exact:true}).click();await login(page,'a@example.test');await page.getByRole('button',{name:'Open A private plan',exact:true}).click();await expect(page.locator('#cloud-plan-title')).toBeVisible();
 await page.locator('.plan-actions summary').click();await page.locator('.plan-toolbar').getByRole('button',{name:'Import notes',exact:true}).click();await page.getByRole('dialog',{name:'Import notes into your account',exact:true}).getByLabel('Set notes',{exact:true}).fill('1:30\n(Hip hop)\nImported song ---');await page.getByRole('button',{name:'Preview import',exact:true}).click();await page.getByLabel('New plan name',{exact:true}).fill('Imported party');await page.getByRole('button',{name:'Create imported plan',exact:true}).click();await expect(page.locator('#cloud-plan-title')).toHaveText('Imported party');await expect(page.locator('#tracks .title')).toHaveText('Imported song');
 await page.locator('.plan-actions summary').click();await page.getByRole('button',{name:'Rename plan',exact:true}).click();await page.getByLabel('Plan name',{exact:true}).fill('Renamed party');await page.getByRole('button',{name:'Save name',exact:true}).click();await expect(page.locator('#cloud-plan-title')).toHaveText('Renamed party');
 await page.getByRole('button',{name:'Edit Imported song',exact:true}).click();await page.locator('.edit-form').getByLabel('Peak',{exact:true}).check();await page.locator('.edit-form').getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('#tracks .tags').first()).toContainText('Peak');
 await page.getByRole('button',{name:'Remove Imported song',exact:true}).click();await expect(page.locator('#tracks .title')).toHaveCount(0);await page.locator('.plan-editors summary').filter({hasText:'Add song'}).click();await page.getByLabel('Song name',{exact:true}).fill('Added after removal');await page.getByRole('button',{name:'Add song',exact:true}).click();await page.getByRole('button',{name:'Undo song removal',exact:true}).click();await expect(page.locator('#tracks .title')).toHaveText(['Imported song','Added after removal']);
 await page.getByRole('button',{name:'Save to account',exact:true}).click();await expect(page.locator('.plan-toolbar')).toContainText('Saved to your account');await page.reload();await expect(page.locator('#cloud-plan-title')).toHaveText('Renamed party');await expect(page.locator('#tracks .tags').first()).toContainText('Peak');
});
test('explicit local-set migration includes corrected names and leaves guest notes intact',async({page},info)=>{
 await mock(page);await page.goto(url(info.project.name));await page.getByRole('button',{name:'Edit Shakira beautiful life 116 bpm',exact:true}).click();await page.getByLabel('Correct track name',{exact:true}).fill('My corrected local title');await page.locator('.edit-form').getByRole('button',{name:'Save',exact:true}).click();
 await page.getByRole('button',{name:'Sign in',exact:true}).click();await login(page,'a@example.test');await page.getByRole('button',{name:'Local planner',exact:true}).click();await page.getByRole('button',{name:'Save set to account',exact:true}).click();await expect(page.locator('.account-area')).toContainText('126 songs from your local set');await page.getByLabel('New plan name',{exact:true}).fill('My migrated set');await page.getByRole('button',{name:'Create plan',exact:true}).click();await expect(page.locator('#cloud-plan-title')).toHaveText('My migrated set');await expect(page.locator('#tracks .title').first()).toHaveText('My corrected local title');
 await page.getByRole('button',{name:'Local planner',exact:true}).click();await expect(page.locator('#tracks .title').first()).toHaveText('My corrected local title');
});
