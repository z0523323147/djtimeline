export interface AccountUser { id: string; email: string }
export interface PrivatePlan { id: string; name: string; created_at: string; updated_at: string }
export interface AccountService {
  persistentSession: boolean;
  getUser: () => Promise<AccountUser | null>;
  subscribe: (listener: (user: AccountUser | null) => void) => () => void;
  requestCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  listPlans: (userId: string, page: number) => Promise<PrivatePlan[]>;
  createPlan: (id: string, name: string, userId: string) => Promise<PrivatePlan>;
}
export function accountError(error: unknown): string {
  const value = error as { code?: string; message?: string };
  if (value?.code === 'PGRST205' || value?.code === 'PGRST202') return 'Your account is signed in. The private-plan database setup is not installed yet. Follow the Supabase setup guide, then retry.';
  if (value?.code === 'over_email_send_rate_limit') return 'Too many code requests. Wait a little before trying again.';
  if (value?.code === 'email_address_not_authorized') return 'This project cannot send to that email yet. Custom SMTP must be configured for users outside the project team.';
  if (value?.code === 'otp_expired') return 'That code is invalid or expired. Request a new code and try again.';
  return value?.message || 'Could not connect. Check your internet connection and try again.';
}
