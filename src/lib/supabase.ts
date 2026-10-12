import { createClient, type User } from '@supabase/supabase-js';
import type { AccountService, AccountUser, PrivatePlan } from './account';

export function createAccountService(url: string, key: string): AccountService {
  const memory = new Map<string, string>();
  let persistentSession = true;
  let store: Storage | undefined;
  try { store = window.localStorage; store.setItem('party-map-auth-probe', '1'); store.removeItem('party-map-auth-probe'); }
  catch { persistentSession = false; }
  const client = createClient(url, key, {
    auth: {
      detectSessionInUrl: false,
      storageKey: `party-map-auth-${new URL(url).hostname}`,
      storage: {
        getItem: key => { if (memory.has(key)) return memory.get(key)!; try { return store?.getItem(key) ?? null; } catch { persistentSession = false; store = undefined; return null; } },
        setItem: (key, value) => { memory.set(key, value); try { store?.setItem(key, value); } catch { persistentSession = false; store = undefined; } },
        removeItem: key => { memory.delete(key); try { store?.removeItem(key); } catch { persistentSession = false; } },
      },
    },
  });
  const user = (u: User | null): AccountUser | null => u ? { id: u.id, email: u.email ?? '' } : null;
  return {
    get persistentSession() { return persistentSession; },
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
    async requestCode(email) {
      const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw error;
    },
    async verifyCode(email, token) {
      const { error } = await client.auth.verifyOtp({ email, token, type: 'email' });
      if (error) throw error;
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
    async createPlan(id, name, owner) {
      const { data, error } = await client.rpc('create_club_plan', { p_id: id, p_name: name, p_owner_id: owner });
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as PrivatePlan;
    },
  };
}
