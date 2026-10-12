import { expect } from './fixtures';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
export const base = 'https://aemfewsfcrcmtafnypxa.supabase.co';
export const ids = { a: '11111111-1111-4111-8111-111111111111', b: '22222222-2222-4222-8222-222222222222' };
export const user = (id: string, email: string) => ({ id, email, aud:'authenticated', role:'authenticated', app_metadata:{provider:'email'}, user_metadata:{}, created_at:'2026-10-12T10:00:00Z' });
const token = (id: string) => [Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:id,aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600,iss:base+'/auth/v1'})).toString('base64url'),'test-signature'].join('.');
export const url = (name: string) => name.startsWith('connected') ? pathToFileURL(resolve('dist/party-map-connected.html')).href : 'http://127.0.0.1:4180';
export async function mock(page: import('@playwright/test').Page, delayed = false) {
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
    if(path.endsWith('/rpc/list_club_plan_genres')){await route.fulfill({json:['House','Hip hop','Afro tech'],headers});return;}
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
export async function login(page: import('@playwright/test').Page,email: string) {
  await page.getByLabel('Email address',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill('Synthetic-password-123');
  await page.locator('.account-form').getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('heading',{name:'My plans',exact:true})).toBeVisible();
}
