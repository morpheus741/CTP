// Tiny static server for local dev & tests (no deps)
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = normalize(join(__dirname, '..'));
const port = process.env.PORT ? Number(process.env.PORT) : 8080;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = normalize(join(root, urlPath));
  if (filePath.endsWith('/')) filePath += 'index.html';
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) filePath = join(filePath, 'index.html');
    const ext = extname(filePath);
    res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
    createReadStream(filePath).pipe(res);
  } catch {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

server.listen(port, () => {
  console.log(`[ctb] Serving on http://localhost:${port}`);
});

process.on('SIGTERM', () => server.close(()=>process.exit(0)));
process.on('SIGINT', () => server.close(()=>process.exit(0)));
