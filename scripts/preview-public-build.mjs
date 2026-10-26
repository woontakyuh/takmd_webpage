import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export function parseHeaders(source) {
  const rules = [];
  let current;
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      if (!line.startsWith('/') || line.includes(':') || line.split('*').length > 2) throw new Error('Preview supports path rules with at most one wildcard.');
      const expression = line.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
      current = { pattern: new RegExp(`^${expression}$`), headers: {} };
      rules.push(current);
    } else {
      const match = line.trim().match(/^([\w-]+):\s*(.+)$/);
      if (!current || !match) throw new Error('Unsupported public header syntax.');
      current.headers[match[1].toLowerCase()] = match[2];
    }
  }
  return rules;
}

export function headersForPath(rules, pathname) {
  const headers = {};
  for (const rule of rules) {
    if (rule.pattern.test(pathname)) {
      for (const [name, value] of Object.entries(rule.headers)) headers[name] = headers[name] ? `${headers[name]}, ${value}` : value;
    }
  }
  return headers;
}

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.mp4': 'video/mp4', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.m3u8': 'application/vnd.apple.mpegurl', '.ts': 'video/mp2t',
  '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.wasm': 'application/wasm',
};

export async function startPublicPreview(directory, port = 0) {
  const root = await realpath(resolve(directory));
  const rules = parseHeaders(await readFile(join(root, '_headers'), 'utf8'));
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      for (const [name, value] of Object.entries(headersForPath(rules, pathname))) response.setHeader(name, value);
      if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
      let file = resolve(root, `.${pathname}`);
      if (!file.startsWith(`${root}${sep}`) && file !== root) { response.writeHead(403); response.end(); return; }
      if (['/_headers', '/_redirects', '/_routes.json'].includes(pathname)) { response.writeHead(404); response.end(); return; }
      let info = await stat(file);
      if (info.isDirectory()) { file = join(file, 'index.html'); info = await stat(file); }
      file = await realpath(file);
      if (!file.startsWith(`${root}${sep}`)) { response.writeHead(403); response.end(); return; }
      if (!info.isFile()) { response.writeHead(404); response.end(); return; }
      if (!response.hasHeader('content-type')) response.setHeader('content-type', types[extname(file)] ?? 'application/octet-stream');
      response.setHeader('accept-ranges', 'bytes');
      let start = 0;
      let end = info.size - 1;
      if (request.headers.range) {
        const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
        if (!range || !(range[1] || range[2])) { response.writeHead(416, { 'content-range': `bytes */${info.size}` }); response.end(); return; }
        start = range[1] ? Number(range[1]) : Math.max(0, info.size - Number(range[2]));
        end = range[1] && range[2] ? Math.min(Number(range[2]), end) : end;
        if (start > end || start >= info.size) { response.writeHead(416, { 'content-range': `bytes */${info.size}` }); response.end(); return; }
        response.statusCode = 206;
        response.setHeader('content-range', `bytes ${start}-${end}/${info.size}`);
      }
      response.setHeader('content-length', Math.max(0, end - start + 1));
      if (request.method === 'HEAD' || !info.size) { response.end(); return; }
      createReadStream(file, { start, end }).pipe(response);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 400);
      response.end();
    }
  });
  await new Promise((ready, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', ready); });
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(done => { server.closeAllConnections(); server.close(done); }) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const preview = await startPublicPreview(process.argv[3] ?? 'dist', Number(process.argv[2] ?? 4323));
  console.log(`Public build with _headers: ${preview.origin}`);
  process.once('SIGINT', () => void preview.close());
  process.once('SIGTERM', () => void preview.close());
}
