import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile, mkdir, unlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { event, runOperation, aggregate, gate, execute, persist } from './runner.mjs';
import { findings, scan } from './privacy.mjs';
import { checkLinks, workflowDocs } from './docs.mjs';

const task = 'TASK-SYNTHETIC';
test('success/failure events correlate; payload and process output never enter evidence', async () => {
  const events = [];
  for (const code of [0, 9]) {
    const result = await runOperation(task, 'docs', { run: async () => code, write: async record => events.push(record) });
    assert.equal(result.status, code === 0 ? 'PASS' : 'FAIL');
  }
  assert.equal(events.length, 4);
  assert.equal(events[0].id, events[1].id);
  assert.equal(events[2].id, events[3].id);
  assert.equal(events[3].exitCode, 9);
  const synthetic = { password: 'synthetic-password', token: 'synthetic-token', title: 'PRIVATE PLAN', body: 'PRIVATE BODY' };
  const safe = event({ ...synthetic, task, operation: 'docs', id: events[0].id, phase: 'pre' });
  for (const value of Object.values(synthetic)) assert.ok(!JSON.stringify(safe).includes(value));
  const code = await execute({ file: process.execPath, args: ['-e', 'console.log("PRIVATE PLAN");console.error("synthetic-password");process.exit(7)'] });
  assert.equal(code, 7);
});
test('logging failure still runs checks and blocks gate PASS', async () => {
  let ran = false;
  const result = await runOperation(task, 'docs', { run: async () => { ran = true; return 0; }, write: async () => { throw Error('unavailable'); } });
  assert.ok(ran);
  assert.equal(result.evidenceAvailable, false);
  assert.equal(aggregate(['docs'], [result]), 'FAIL');
});
test('failed, missing and unselected required checks cannot pass; report write failure fails closed', async () => {
  const pass = async (_task, operation) => ({ operation, status: 'PASS', exitCode: 0, evidenceAvailable: true });
  const write = async () => {};
  assert.equal((await gate(task, 'docs', { run: pass, write })).verdict, 'PASS');
  assert.equal((await gate(task, 'docs', { run: pass, write, selected: ['docs'] })).verdict, 'FAIL');
  assert.equal((await gate(task, 'docs', { run: async (t, name) => ({ ...await pass(t, name), exitCode: 2, status: 'FAIL' }), write })).verdict, 'FAIL');
  assert.equal((await gate(task, 'docs', { run: pass, write: async () => { throw Error(); } })).verdict, 'FAIL');
  assert.equal(aggregate(['docs'], []), 'FAIL');
  await assert.rejects(() => gate(task, 'invented'), /Invalid/);
  await assert.rejects(() => runOperation('PRIVATE PLAN', 'docs'), /Invalid/);
  await assert.rejects(() => runOperation(task, 'toString'), /Invalid/);
});
test('real failing child propagates through the aggregate gate', async () => {
  const report = await gate(task, 'docs', {
    run: (t, name) => runOperation(t, name, {
      run: () => execute({ file: process.execPath, args: ['-e', 'process.exit(23)'] }),
      write: async () => {},
    }),
    write: async () => {},
  });
  assert.equal(report.verdict, 'FAIL');
  assert.ok(report.results.every(result => result.exitCode === 23 && result.status === 'FAIL'));
});
test('spawn error, timeout and thrown runner are failures', async () => {
  assert.equal(await execute({ file: 'not-a-real-command-for-workflow', args: [] }), 127);
  assert.equal(await execute({ file: process.execPath, args: ['-e', 'setTimeout(()=>{},10000)'] }, { timeout: 50 }), 124);
  const result = await runOperation(task, 'docs', { run: async () => { throw Error('private error'); }, write: async () => {} });
  assert.equal(result.exitCode, 127);
});
test('privacy signatures reject synthetic secrets and sessions but allow public config', () => {
  assert.deepEqual(findings("autocomplete={signup ? 'new-password' : 'current-password'}"), []);
  assert.deepEqual(findings('sb_publishable_example'), []);
  assert.ok(findings('sb_secret_' + 'x'.repeat(20)).includes('secret-key'));
  assert.ok(findings('-----BEGIN ' + 'PRIVATE KEY-----').includes('private-key'));
  assert.ok(findings('password: "synthetic-password"').includes('credential-assignment'));
  const jwt = data => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(data)).toString('base64url')}.synthetic`;
  assert.deepEqual(findings(jwt({ role: 'anon' })), []);
  assert.ok(findings(jwt({ role: 'service_role' })).includes('private-jwt'));
  assert.ok(findings(jwt({ role: 'authenticated', sub: 'synthetic' })).includes('private-jwt'));
});

test('privacy inventory permits deleted tracked files but still scans their replacements', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'party-privacy-'));
  const original = process.cwd();
  try {
    execFileSync('git', ['init', '--quiet', directory]);
    await mkdir(join(directory, 'dist'));
    await writeFile(join(directory, 'old.js'), '// synthetic old bundle');
    execFileSync('git', ['-C', directory, 'add', 'old.js']);
    await unlink(join(directory, 'old.js'));
    await writeFile(join(directory, 'replacement.js'), '// synthetic replacement');
    process.chdir(directory);
    assert.deepEqual(await scan(), []);
    await writeFile(join(directory, 'replacement.js'), 'sb_secret_' + 'x'.repeat(20));
    assert.deepEqual(await scan(), [{file:'replacement.js', rules:['secret-key']}]);
  } finally {
    process.chdir(original);
    await rm(directory, { recursive:true, force:true });
  }
});

test('repository skill packages have bounded valid metadata and no scaffolding', async () => {
  for (const name of ['set-notes-parser', 'standalone-html-release']) {
    const source = await readFile(`.agents/skills/${name}/SKILL.md`, 'utf8');
    const metadata = source.match(/^---\r?\nname: ([a-z0-9-]{1,64})\r?\ndescription: ([^\r\n]+)\r?\n---\r?\n/);
    assert.ok(metadata, 'required frontmatter must parse');
    assert.equal(metadata[1], name);
    assert.ok(metadata[2].length > 20);
    assert.ok(!/\b(?:TODO|TBD)\b/.test(source));
  }
});
test('bounded evidence persists only sanitized records; unavailable directory rejects', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'party-workflow-'));
  try {
    const record = event({ task, operation: 'docs', id: '00000000-0000-4000-8000-000000000000', phase: 'pre' });
    await persist(record, directory);
    assert.deepEqual(JSON.parse(await readFile(join(directory, `${record.id}-pre.json`), 'utf8')), record);
    for (let i = 1; i <= 205; i++) await writeFile(join(directory, `00000000-0000-4000-8000-${String(i).padStart(12, '0')}-pre.json`), '{}');
    await persist(record, directory);
    assert.ok((await readdir(directory)).length <= 198);
    await assert.rejects(() => persist(record, join(directory, `${record.id}-pre.json`)));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('link gate catches broken paths, accepts encoded spaces and ignores fenced examples', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'party-docs-'));
  try {
    await mkdir(join(directory, 'docs'));
    await writeFile(join(directory, 'space file.md'), '# Target');
    const file = join(directory, 'docs', 'sample.md');
    await writeFile(file, '[ok](../space%20file.md) [bad](missing.md)\n```md\n[example](example.md)\n```');
    assert.deepEqual(await checkLinks([file]), [{ file, target: 'missing.md' }]);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('documentation inventory includes nested real task records and repository packages', async () => {
  const files = await workflowDocs();
  assert.ok(files.includes('docs/tasks/pilot-doc-links.md'));
  assert.ok(files.includes('.agents/skills/standalone-html-release/SKILL.md'));
  assert.deepEqual(await checkLinks(files), []);
});
