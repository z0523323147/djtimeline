import { spawn } from 'node:child_process';
import { mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { operations, categories } from './operations.mjs';

export const evidenceDirectory = resolve('.workflow-evidence');
const safeTask = value => /^TASK-[A-Z0-9-]{1,48}$/.test(value);

// Allowlisting is the redaction mechanism: raw metadata is never serialized.
export function event({ task, operation, id, phase, exitCode, durationMs }) {
  if (!safeTask(task) || !Object.hasOwn(operations, operation) || !/^[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid evidence identity');
  if (!['pre', 'post'].includes(phase)) throw new Error('Invalid evidence phase');
  return { schema: 1, task, operation, id, phase, timestamp: new Date().toISOString(),
    intent: 'project-check', resource: operations[operation].category,
    result: phase === 'pre' ? 'STARTED' : exitCode === 0 ? 'PASS' : 'FAIL',
    exitCode: phase === 'post' && Number.isInteger(exitCode) ? exitCode : null,
    durationMs: phase === 'post' && Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs)) : null,
    evidence: `${id}-${phase}.json` };
}

export async function persist(record, directory = evidenceDirectory) {
  await mkdir(directory, { recursive: true });
  // One bounded file per event/report; prune only our own UUID-named evidence.
  const names = (await readdir(directory)).filter(name => /^[a-f0-9-]{36}(?:-pre|-post|-report)?\.json$/.test(name));
  const files = await Promise.all(names.map(async name => ({ name, info: await stat(join(directory, name)) })));
  files.sort((a, b) => b.info.mtimeMs - a.info.mtimeMs);
  for (const [index, file] of files.entries()) {
    if (index >= 197 || Date.now() - file.info.mtimeMs > 7 * 86400000) await unlink(join(directory, file.name));
  }
  const suffix = record.phase ? `-${record.phase}` : '-report';
  await writeFile(join(directory, `${record.id}${suffix}.json`), JSON.stringify(record, null, 2) + '\n', { mode: 0o600 });
}

export function execute(command, { timeout = 600000 } = {}) {
  return new Promise(resolveResult => {
    // Output is deliberately discarded: never persist or forward private stdout/stderr.
    const child = spawn(command.file, command.args, { cwd: process.cwd(), stdio: 'ignore', shell: false, windowsHide: true });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === 'win32') {
        const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true });
        killer.on('error', () => child.kill('SIGKILL'));
      }
      // Direct-child fallback also works when taskkill is unavailable/restricted.
      child.kill('SIGKILL');
    }, timeout);
    child.once('error', () => { clearTimeout(timer); resolveResult(127); });
    child.once('close', code => { clearTimeout(timer); resolveResult(timedOut ? 124 : Number.isInteger(code) ? code : 1); });
  });
}

export async function runOperation(task, operation, { run = execute, write = persist } = {}) {
  const id = randomUUID();
  const started = Date.now();
  const pre = event({ task, operation, id, phase: 'pre' });
  let evidenceAvailable = true;
  try { await write(pre); } catch { evidenceAvailable = false; }
  let exitCode;
  try { exitCode = await run(operations[operation]); } catch { exitCode = 127; }
  if (!Number.isInteger(exitCode)) exitCode = 127;
  const post = event({ task, operation, id, phase: 'post', exitCode, durationMs: Date.now() - started });
  try { await write(post); } catch { evidenceAvailable = false; }
  return { operation, status: exitCode === 0 ? 'PASS' : 'FAIL', exitCode, evidenceAvailable, evidence: `${id}-post.json` };
}

export function aggregate(required, results) {
  return required.every(name => results.some(result => result.operation === name && result.status === 'PASS' && result.exitCode === 0 && result.evidenceAvailable)) ? 'PASS' : 'FAIL';
}

export async function gate(task, category, { selected, run = runOperation, write = persist } = {}) {
  if (!safeTask(task) || !Object.hasOwn(categories, category)) throw new Error('Invalid task/category');
  const required = categories[category];
  if (selected && selected.some(name => !required.includes(name))) throw new Error('Unknown selected check');
  const results = [];
  for (const operation of required) {
    results.push(selected && !selected.includes(operation)
      ? { operation, status: 'NOT RUN', reason: 'Not selected; required for category' }
      : await run(task, operation));
  }
  const report = { schema: 1, id: randomUUID(), task, category, timestamp: new Date().toISOString(), verdict: aggregate(required, results), results,
    applicability: Object.keys(operations).filter(name => !required.includes(name)).map(operation => ({ operation, status: 'NOT APPLICABLE', reason: 'Outside selected change category; task review must confirm scope' })),
    release: 'NOT VERIFIED: hosted E14/E15/E16 and native accessibility remain separate' };
  try { await write(report); } catch { report.verdict = 'FAIL'; report.evidenceUnavailable = true; }
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [mode, task, category, ...extra] = process.argv.slice(2);
    if (extra.length) throw new Error('Unexpected arguments');
    const report = mode === 'gate' ? await gate(task, category)
      : mode === 'run' ? await runOperation(task, category) : null;
    if (!report) throw new Error('Use gate TASK-ID category or run TASK-ID operation');
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = (report.verdict ?? report.status) === 'PASS' && report.evidenceAvailable !== false ? 0 : 1;
  } catch { console.error('Workflow runner failed; no PASS. Check fixed operation, task ID, category and evidence access.'); process.exitCode = 1; }
}
