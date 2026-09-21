import {createReadStream, realpathSync, statSync} from 'node:fs';
import {createServer, request} from 'node:http';
import {extname, resolve, sep} from 'node:path';

// Local acceptance only: serve a known application build and proxy to its isolated
// API without starting another Angular compiler. No third-party package needed.
const directory = realpathSync(process.env.TUTORIAL_BUILD_DIR || 'dist/browser');
const upstream = new URL(process.env.TUTORIAL_API_URL || 'http://127.0.0.1:3011');
const port = Number(process.env.TUTORIAL_WEB_PORT || 4320);
if (upstream.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(upstream.hostname)) {
  throw new Error('The acceptance API must be an HTTP loopback address.');
}
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid web port.');
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm',
};
const server = createServer((incoming, outgoing) => {
  const url = new URL(incoming.url, 'http://127.0.0.1');
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    const proxy = request(new URL(incoming.url, upstream), {
      method: incoming.method,
      headers: {...incoming.headers, host: upstream.host},
    }, response => {
      outgoing.writeHead(response.statusCode, response.headers);
      response.pipe(outgoing);
    });
    proxy.on('error', () => {
      if (!outgoing.headersSent) outgoing.writeHead(502, {'content-type': 'text/plain'});
      outgoing.end('The isolated acceptance API is unavailable.');
    });
    incoming.pipe(proxy);
    return;
  }
  if (!['GET', 'HEAD'].includes(incoming.method)) {
    outgoing.writeHead(405).end();
    return;
  }
  let path;
  try {
    path = resolve(directory, `.${decodeURIComponent(url.pathname)}`);
    if (path !== directory && !path.startsWith(directory + sep)) throw new Error('Invalid path');
    if (!statSync(path).isFile()) path = resolve(directory, 'index.html');
  } catch {
    path = resolve(directory, 'index.html');
  }
  outgoing.writeHead(200, {
    'content-type': types[extname(path)] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  if (incoming.method === 'HEAD') outgoing.end();
  else createReadStream(path).on('error', () => outgoing.destroy()).pipe(outgoing);
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Full application: http://127.0.0.1:${port}; isolated API: ${upstream.origin}`);
  console.log(`Built files: ${directory}. Record the source commit before accepting evidence.`);
});
