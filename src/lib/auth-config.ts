/** Configuration guard only; Supabase still verifies all authentication tokens. */
export function validatePublicAuthConfig(url: string, key: string): void {
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) {
    throw new Error('Supabase authentication requires an HTTPS project URL without embedded credentials.');
  }
  if (key.startsWith('sb_publishable_')) return;
  if (!key.startsWith('sb_secret_')) {
    try {
      const parts = key.split('.');
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (parts.length === 3 && payload.role === 'anon') return;
    } catch { /* Reject malformed or privileged configuration. */ }
  }
  throw new Error('Use only a Supabase publishable key or legacy anon key in this app. Secret/service-role keys are forbidden.');
}
