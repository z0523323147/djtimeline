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
    if(path.endsWith('/rpc/create_club_plan')){
      const body=req.postDataJSON();expect(body.p_owner_id).toBe(current.id);
      const plan={id:body.p_id,owner_id:current.id,name:body.p_name,created_at:'2026-10-12T11:00:00Z',updated_at:'2026-10-12T11:00:00Z'};plans=[...plans,plan];await route.fulfill({json:plan,headers});return;
    }
    if(path.endsWith('/club_plans')){
      const owner=new URL(req.url()).searchParams.get('owner_id');
      expect(owner).toBe('eq.'+current.id);
      const result=plans.filter(p=>p.owner_id===current.id);
      if(delayed&&current.id===ids.a)await new Promise(r=>setTimeout(r,500));
      await route.fulfill({json:result,headers});return;
    }
    await route.fulfill({status:404,json:{message:'Unexpected test route'},headers});
  });
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
