export async function copyTitle(text: string) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return; }
  } catch { /* The fallback also works when clipboard permission is denied. */ }
  const active = document.activeElement as HTMLElement | null;
  const input = document.createElement('textarea');
  input.value = text;
  input.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.append(input); input.select();
  try { if (!document.execCommand('copy')) throw new Error('Copy unavailable'); }
  finally { input.remove(); active?.focus(); }
}
