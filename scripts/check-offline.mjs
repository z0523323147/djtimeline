import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Script } from 'node:vm';

/** Build-time structural checks. Browser tests still verify actual offline behavior. */
export function verifyOfflineHtml(html) {
  if (!/^\s*<!doctype html>/i.test(html) || !/<html\b/i.test(html) || !/<\/html>/i.test(html)) {
    throw new Error('Expected a complete HTML document.');
  }
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');
  for (const [index, [, attributes, code]] of scripts.entries()) {
    if (/\bsrc\s*=/i.test(attributes)) throw new Error('Offline scripts must be embedded, not loaded through src.');
    const type = attributes.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (type === 'module') throw new Error('Bundle the offline entry as a classic IIFE script; external module resolution is not portable under file://.');
    if (type && !['text/javascript', 'application/javascript'].includes(type)) continue;
    new Script(code, { filename: `inline-script-${index + 1}.js` });
  }
  for (const [, attributes] of markup.matchAll(/<link\b([^>]*)>/gi)) {
    const rel = attributes.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] ?? '';
    if (/\b(stylesheet|preload|modulepreload|prefetch|icon|manifest)\b/i.test(rel)) {
      throw new Error('Embed linked assets and styles in the offline document.');
    }
  }
  for (const [, tag, attributes] of markup.matchAll(/<(img|source|video|audio|iframe|object|embed)\b([^>]*)>/gi)) {
    if (/\bsrcset\s*=/i.test(attributes)) throw new Error(`Resolve ${tag} srcset before offline packaging.`);
    for (const [, resource] of attributes.matchAll(/\b(?:src|poster|data)\s*=\s*["']([^"']+)["']/gi)) {
      if (!/^(data:|#)/i.test(resource)) throw new Error(`External ${tag} asset: ${resource}`);
    }
  }
  for (const [, css] of markup.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) {
    if (/@import\b/i.test(css)) throw new Error('CSS imports must be bundled before export.');
    for (const [, raw] of css.matchAll(/url\(\s*([^)]*?)\s*\)/gi)) {
      const resource = raw.replace(/^["']|["']$/g, '');
      if (!/^(data:|#)/i.test(resource)) throw new Error(`External CSS asset: ${resource}`);
    }
  }
  return { inlineScripts: scripts.length, bytes: Buffer.byteLength(html, 'utf8') };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const file = process.argv[2] ?? 'dist/party-map.html';
    const result = verifyOfflineHtml(await readFile(file, 'utf8'));
    console.log(`Offline structure verified: ${file} (${result.bytes} bytes, ${result.inlineScripts} embedded scripts).`);
    console.log('Run file:// browser checks to verify behavior and absence of runtime requests.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
