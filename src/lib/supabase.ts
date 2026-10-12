import { validatePublicAuthConfig } from './auth-config';
import { createAuthStorage } from './auth-storage';
import { createClient, type User } from '@supabase/supabase-js';
import { validateDocument } from './documents';
import type { AccountService, AccountUser, PrivatePlan } from './account';

export function createAccountService(url: string, key: string): AccountService {
  validatePublicAuthConfig(url, key);
  const storage = createAuthStorage(() => window.localStorage);
  const client = createClient(url, key, {
    auth: {
      detectSessionInUrl: false,
      storageKey: `party-map-auth-${new URL(url).hostname}`,
      storage,
    },
  });
  const user = (u: User | null): AccountUser | null => u ? { id: u.id, email: u.email ?? '' } : null;
  return {
    get persistentSession() { return storage.persistentSession; },
    async getUser() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) return null;
      const result = await client.auth.getUser();
      if (result.error) throw result.error;
      return user(result.data.user);
    },
    subscribe(listener) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        // SDK callbacks hold its auth lock; schedule UI/database work outside it.
        if (_event !== 'INITIAL_SESSION') setTimeout(() => listener(user(session?.user ?? null)), 0);
      });
      return () => data.subscription.unsubscribe();
    },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUp(email, password) {
      if (password.length < 12) throw new Error('Choose a password of at least 12 characters for a new account.');
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw error;
      return Boolean(data.session);
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
    },
    async listPlans(userId, page) {
      const { data, error } = await client.from('club_plans').select('id,name,created_at,updated_at').eq('owner_id', userId).order('updated_at', { ascending: false }).order('id').range(page * 50, page * 50 + 49);
      if (error) throw error;
      return data as PrivatePlan[];
    },
    async createPlanDocument(id,name,owner,document) {
      validateDocument(document);
      const {data,error}=await client.rpc('create_club_plan_with_document',{p_id:id,p_name:name,p_owner_id:owner,p_document:document});
      if(error)throw error;
      return (Array.isArray(data)?data[0]:data) as PrivatePlan;
    },
    async loadDocument(planId) {
      const {data,error} = await client.from('club_plan_documents').select('plan_id,revision,document').eq('plan_id',planId).single();
      if (error) throw error;
      validateDocument(data.document);
      return data;
    },
    async saveDocument(planId, owner, revision, operationId, document) {
      validateDocument(document);
      const {data,error} = await client.rpc('save_club_plan_document',{p_plan_id:planId,p_owner_id:owner,p_expected_revision:revision,p_operation_id:operationId,p_document:document});
      if (error) throw error;
      validateDocument(data.document);
      return data;
    },
    async renamePlan(planId, name) {
      const {error} = await client.rpc('rename_club_plan',{p_id:planId,p_name:name});
      if (error) throw error;
    },
    async createPlan(id, name, owner) {
      const { data, error } = await client.rpc('create_club_plan', { p_id: id, p_name: name, p_owner_id: owner });
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as PrivatePlan;
    },
  };
}
