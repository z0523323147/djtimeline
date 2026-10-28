import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Deliberately scoped signatures; public publishable/anon configuration is allowed.
export function findings(text) {
  const rules = [
    ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ['secret-key', /sb_secret_[a-zA-Z0-9_-]{12,}/],
    ['credential-assignment', /(?:["'](?:access_token|refresh_token|password|service_role_key)["']|\b(?:access_token|refresh_token|password|service_role_key))\s*[:=]\s*["'](?!["'])([^"'\r\n]{8,})["']/i],
  ];
  const result = rules.filter(([, pattern]) => pattern.test(text)).map(([rule]) => rule);
  for (const match of text.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
    try {
      const payload = JSON.parse(Buffer.from(match[0].split('.')[1], 'base64url').toString());
      if (payload.role !== 'anon' || payload.sub || payload.session_id) result.push('private-jwt');
    } catch { result.push('unclassified-jwt'); }
  }
  return [...new Set(result)];
}

export async function scan() {
  // Includes tracked paths and untracked nonignored changes. Never open .env.local or ignored logs/backups.
  const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  async function artifacts(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) await artifacts(file); else files.push(file);
    }
  }
  await artifacts('dist');
  const failures = [];
  for (const file of new Set(files)) {
    if (!/\.(?:[cm]?js|ts|svelte|astro|html|css|json|ya?ml|md|sql|txt|example)$/i.test(file)) continue;
    let content;
    try { content = await readFile(file, 'utf8'); }
    catch (error) {
      // The index still names files removed by a rebuild or unstaged rename.
      // Only absence is harmless; permission/read failures must still fail closed.
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    const rules = findings(content);
    // Existing tests intentionally contain synthetic secrets. Scan all shipping files;
    // test fixtures are checked structurally by tests rather than relaxed in production.
    if (/^(tests[\\/]|scripts[\\/]workflow[\\/]workflow\.test\.mjs$)/.test(file)) continue;
    if (rules.length) failures.push({ file, rules });
  }
  return failures;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const failures = await scan();
    console.log(JSON.stringify({ scope: 'tracked and nonignored text plus dist; excludes synthetic test fixtures', failures }));
    process.exitCode = failures.length ? 1 : 0;
  } catch { console.error('Privacy scan unavailable; no PASS'); process.exitCode = 1; }
}
