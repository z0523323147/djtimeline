import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validatePublicAuthConfig} from '../src/lib/auth-config.ts';
const legacy=(role:string)=>'synthetic-header.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.synthetic-signature';
test('Auth configuration permits public keys over HTTPS',()=>{
 assert.doesNotThrow(()=>validatePublicAuthConfig('https://example.supabase.co','sb_publishable_fixture'));
 assert.doesNotThrow(()=>validatePublicAuthConfig('https://example.supabase.co',legacy('anon')));
});
test('Auth configuration refuses privileged keys and insecure/credential-bearing endpoints',()=>{
 for(const key of ['sb_secret_fixture',legacy('service_role'),'invalid'])assert.throws(()=>validatePublicAuthConfig('https://example.supabase.co',key),/publishable key/);
 for(const url of ['http://example.supabase.co','https://user:password@example.supabase.co'])assert.throws(()=>validatePublicAuthConfig(url,'sb_publishable_fixture'),/HTTPS project URL/);
});
