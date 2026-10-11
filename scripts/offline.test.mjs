import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyOfflineHtml } from './check-offline.mjs';

const document = body => `<!doctype html><html><head><style>body{color:white}</style></head><body>${body}</body></html>`;

test('current planner is structurally self-contained with valid embedded JavaScript', async () => {
  const html = await readFile(new URL('../dj-set-timeline-v2.html', import.meta.url), 'utf8');
  assert.equal(verifyOfflineHtml(html).inlineScripts, 1);
});
test('explicit Google search links remain allowed', () => {
  assert.doesNotThrow(() => verifyOfflineHtml(document('<a href="https://www.google.com/search?q=track">Download</a>')));
});
test('external scripts and split modules fail the packaging boundary', () => {
  assert.throws(() => verifyOfflineHtml(document('<script src="/app.js"></script>')), /embedded/);
  assert.throws(() => verifyOfflineHtml(document('<script type="module">import "./chunk.js";</script>')), /IIFE/);
});
test('external styles, fonts, and images cannot silently enter the offline artifact', () => {
  assert.throws(() => verifyOfflineHtml(document('<link rel="stylesheet" href="app.css">')), /linked assets/);
  assert.throws(() => verifyOfflineHtml(document('<style>@font-face{src:url(font.woff2)}</style>')), /CSS asset/);
  assert.throws(() => verifyOfflineHtml(document('<img src="cover.png">')), /External img/);
});
test('data assets and SVG fragment references remain self-contained', () => {
  assert.doesNotThrow(() => verifyOfflineHtml(document('<img src="data:image/png;base64,aA=="><style>svg{filter:url(#glow)}</style>')));
});
test('malformed documents and invalid scripts fail before packaging', () => {
  assert.throws(() => verifyOfflineHtml('<p>not a document</p>'), /complete HTML/);
  assert.throws(() => verifyOfflineHtml(document('<script>const broken = ;</script>')), SyntaxError);
});
