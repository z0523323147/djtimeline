import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const run = () => {
  const result = spawnSync(process.execPath, ['scripts/build-offline.mjs'], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Offline build failed');
};
run();
const first = await readFile('dist/party-map.html');
run();
const second = await readFile('dist/party-map.html');
if (!first.equals(second)) throw new Error('Unchanged source produced different offline bytes');
console.log('Reproducible offline SHA-256:', createHash('sha256').update(second).digest('hex'));
