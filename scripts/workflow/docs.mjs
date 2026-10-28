import { readFile, access, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function checkLinks(files) {
  const failures = [];
  for (const file of files) {
    const text = (await readFile(file, 'utf8')).replace(/```[\s\S]*?```/g, '');
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const link = match[1].replace(/^<|>$/g, '');
      if (/^(?:https?:|mailto:|#)/i.test(link)) continue;
      try { await access(resolve(dirname(file), decodeURIComponent(link.split('#')[0]))); }
      catch { failures.push({ file, target: link }); }
    }
  }
  return failures;
}

export async function workflowDocs() {
  const roots = ['AGENTS.md', 'README.md', 'plan.md', 'backlog.md', 'SKILLS.md', 'SUBAGENTS.md', 'AGENTIC-ARCHITECTURE-STARTER.md'];
  async function collect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = `${directory}/${entry.name}`;
      if (entry.isDirectory()) await collect(file);
      else if (entry.isFile() && entry.name.endsWith('.md')) roots.push(file);
    }
  }
  await collect('docs');
  for (const name of ['set-notes-parser', 'standalone-html-release']) roots.push(`.agents/skills/${name}/SKILL.md`);
  return roots;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const failures = await checkLinks(await workflowDocs());
    console.log(JSON.stringify({ failures }));
    process.exitCode = failures.length ? 1 : 0;
  } catch { console.error('Documentation check unavailable; no PASS'); process.exitCode = 1; }
}
