// Strict static server for production regression tests. No SPA fallback: missing
// bundles must return 404 rather than disguising the failure as index.html.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const prefix = '/secha-jourimanzky-wardrobe/';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' };
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith(prefix)) { res.writeHead(404).end(); return; }
    const relative = decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html';
    const file = resolve(root, relative);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    const headers = { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Accept-Ranges': 'bytes' };
    if (req.headers.range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      if (!match) { res.writeHead(416).end(); return; }
      const start = Number(match[1]), end = match[2] ? Math.min(Number(match[2]), body.length - 1) : body.length - 1;
      if (start > end || start >= body.length) { res.writeHead(416).end(); return; }
      res.writeHead(206, {...headers, 'Content-Range': `bytes ${start}-${end}/${body.length}`, 'Content-Length': end - start + 1});
      res.end(body.subarray(start, end + 1));
    } else { res.writeHead(200, { ...headers, 'Content-Length': body.length }); res.end(body); }
  } catch (error) { console.error(error); res.writeHead(404).end(); }
}).listen(4174, '127.0.0.1');
