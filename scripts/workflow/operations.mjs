// Fixed commands only: no task text, arbitrary shell arguments or request payloads.
const node = (...args) => ({ file: process.execPath, args });
const pnpm = script => process.platform === 'win32'
  ? { file: process.env.ComSpec || 'cmd.exe', args: ['/d', '/s', '/c', `npm exec --offline --yes --package=pnpm@12.11.2 -- pnpm ${script}`] }
  : { file: 'npm', args: ['exec', '--offline', '--yes', '--package=pnpm@12.11.2', '--', 'pnpm', script] };
export const operations = Object.freeze({
  docs: { ...node('scripts/workflow/docs.mjs'), category: 'documentation' },
  privacy: { ...node('scripts/workflow/privacy.mjs'), category: 'repository' },
  tooling: { ...node('--test', 'scripts/workflow/workflow.test.mjs'), category: 'tooling' },
  check: { ...pnpm('check'), category: 'source' },
  test: { ...pnpm('test'), category: 'source' },
  site: { ...pnpm('build:site'), category: 'build' },
  offline: { ...pnpm('build:offline'), category: 'build' },
  connected: { ...pnpm('build:connected'), category: 'build' },
  structure: { ...pnpm('check:offline'), category: 'build' },
  browser: { ...pnpm('test:e2e'), category: 'browser' },
  reproducible: { ...node('scripts/check-reproducible.mjs'), category: 'build' },
});
export const categories = Object.freeze({
  docs: ['docs', 'privacy', 'tooling'],
  tooling: ['docs', 'privacy', 'tooling'],
  model: ['docs', 'privacy', 'tooling', 'check', 'test'],
  state: ['docs', 'privacy', 'tooling', 'check', 'test', 'site', 'offline', 'connected', 'browser'],
  ui: ['docs', 'privacy', 'tooling', 'check', 'test', 'site', 'offline', 'connected', 'browser'],
  packaging: ['docs', 'privacy', 'tooling', 'check', 'test', 'site', 'offline', 'connected', 'structure', 'browser', 'reproducible'],
  release: ['docs', 'privacy', 'tooling', 'check', 'test', 'site', 'offline', 'connected', 'structure', 'browser', 'reproducible'],
});
