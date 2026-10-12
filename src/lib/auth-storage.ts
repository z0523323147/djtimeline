type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Persistent reads stay authoritative across tabs; fallback is session-only. */
export function createAuthStorage(getStorage: () => StoragePort) {
  const memory = new Map<string, string>();
  let store: StoragePort | undefined;
  try { store = getStorage(); } catch { store = undefined; }
  return {
    get persistentSession() { return store !== undefined; },
    getItem(key: string): string | null {
      if (!store) return memory.get(key) ?? null;
      try {
        const value = store.getItem(key);
        if (value === null) memory.delete(key); else memory.set(key, value);
        return value;
      } catch {
        // Do not authenticate using a cached token when storage cannot be read.
        throw new Error('Could not read browser sign-in storage. Restore browser storage access and retry.');
      }
    },
    setItem(key: string, value: string): void {
      if (store) {
        try { store.setItem(key, value); }
        catch {
          // Before switching to memory, remove any older account's persisted token.
          try { store.removeItem(key); }
          catch { throw new Error('Could not replace or clear the stored sign-in. Clear this page’s browser storage before signing in again.'); }
          store = undefined;
        }
      }
      memory.set(key, value);
    },
    removeItem(key: string): void {
      if (store) {
        try { store.removeItem(key); }
        catch { throw new Error('Sign-out could not clear browser sign-in storage. Restore storage access or clear this page’s browser data, then retry.'); }
      }
      memory.delete(key);
    },
  };
}
