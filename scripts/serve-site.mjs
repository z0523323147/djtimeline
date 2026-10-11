import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist/site');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
createServer(async (req, res) => {
  const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  const file = path === root ? resolve(root, 'index.html') : path;
  try { res.setHeader('Content-Type', (mime[extname(file)] || 'application/octet-stream') + '; charset=utf-8'); res.end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
}).listen(4180, '127.0.0.1', () => console.log('http://127.0.0.1:4180'));
