import { chromium } from '@playwright/test';
import { loadEnv } from 'vite';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const env=loadEnv('production',process.cwd(),'PUBLIC_');
if(!env.PUBLIC_SUPABASE_URL||!env.PUBLIC_SUPABASE_PUBLISHABLE_KEY)throw new Error('Configure .env.local before checking file Auth connectivity.');
const browser=await chromium.launch();
try {
 const page=await browser.newPage();await page.goto(pathToFileURL(resolve('dist/party-map-connected.html')).href);
 const result=await page.evaluate(async config=>{
  const response=await fetch(config.url+'/auth/v1/settings',{headers:{apikey:config.key}});
  const settings=await response.json();
  return {fileOrigin:location.protocol,status:response.status,emailEnabled:settings.external?.email,signupEnabled:settings.disable_signup===false};
 },{url:env.PUBLIC_SUPABASE_URL,key:env.PUBLIC_SUPABASE_PUBLISHABLE_KEY});
 console.log(JSON.stringify(result));
}finally{await browser.close();}
