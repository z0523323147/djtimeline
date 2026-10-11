import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { verifyOfflineHtml } from './check-offline.mjs';

// Current source is already self-contained. E7-S3 will compile shared Svelte
// components into an IIFE before this same validation/packaging boundary.
const source = resolve(process.argv[2] ?? 'dj-set-timeline-v2.html');
const destination = resolve('dist/party-map.html');

try {
  const html = await readFile(source, 'utf8');
  const result = verifyOfflineHtml(html);
  await mkdir(dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  await writeFile(temporary, html, 'utf8');
  await rename(temporary, destination);
  console.log(`Built ${destination} (${result.bytes} bytes).`);
  console.log('Single HTML file; no required sibling assets. Google search remains an intentional outbound action.');
} catch (error) {
  console.error(`Offline build failed: ${error.message}`);
  process.exitCode = 1;
}
