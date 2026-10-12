import type { PlanDocument, PlanSnapshot } from './documents';
export interface AccountUser { id: string; email: string }
export interface PrivatePlan { id: string; name: string; created_at: string; updated_at: string; song_count?: number }
export interface AccountService {
  persistentSession: boolean;
  getUser: () => Promise<AccountUser | null>;
  subscribe: (listener: (user: AccountUser | null) => void) => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  listPlans: (userId: string, page: number) => Promise<PrivatePlan[]>;
  createPlanDocument: (id:string,name:string,owner:string,document:PlanDocument) => Promise<PrivatePlan>;
  loadDocument: (planId: string) => Promise<PlanSnapshot>;
  saveDocument: (planId: string, owner: string, revision: number, operationId: string, document: PlanDocument) => Promise<PlanSnapshot>;
  renamePlan: (planId: string, name: string) => Promise<void>;
  createPlan: (id: string, name: string, userId: string) => Promise<PrivatePlan>;
}
export function accountError(error: unknown): string {
  const value = error as { code?: string; message?: string };
  if (value?.code === 'PGRST205' || value?.code === 'PGRST202') return 'Your account is signed in. The private-plan database setup is not installed yet. Follow the Supabase setup guide, then retry.';
  if (value?.code === 'invalid_credentials') return 'Email or password is incorrect. Try again, or create an account if you are new.';
  if (value?.code === 'email_not_confirmed') return 'This account requires email confirmation. Contact the project owner to check the Supabase email settings.';
  if (value?.code === 'user_already_exists') return 'An account already exists for this email. Choose Sign in.';
  if (value?.code === 'weak_password') return 'Choose a stronger password that meets the project password requirements.';
  return value?.message || 'Could not connect. Check your internet connection and try again.';
}
