import { mkdir, writeFile, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { verifyOfflineHtml } from './check-offline.mjs';
import { embedApp } from './embed.mjs';

const destination = resolve('dist/party-map.html');

try {
  const compiled = await build({
    configFile: false,
    plugins: [svelte()],
    build: {
      write: false,
      cssCodeSplit: false,
      lib: { entry: resolve('src/offline/main.ts'), name: 'PartyMap', formats: ['iife'] },
      rolldownOptions: { output: { codeSplitting: false } },
    },
  });
  const outputs = (Array.isArray(compiled) ? compiled : [compiled]).flatMap(result => result.output);
  const chunks = outputs.filter(item => item.type === 'chunk');
  if (chunks.length !== 1 || chunks[0].imports.length || chunks[0].dynamicImports.length) {
    throw new Error('Expected one embedded IIFE without external imports.');
  }
  const assets = outputs.filter(item => item.type === 'asset');
  if (assets.some(asset => !asset.fileName.endsWith('.css'))) throw new Error('Embed non-CSS assets before offline packaging.');
  const css = assets.map(asset => String(asset.source)).join('\n');
  const html = embedApp(chunks[0].code, css);
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
