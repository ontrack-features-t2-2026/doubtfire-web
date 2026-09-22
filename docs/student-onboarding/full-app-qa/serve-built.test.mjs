import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {createServer, request} from 'node:http';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

function send(port, path, {method = 'GET', body = '', headers = {}} = {}) {
  return new Promise((resolve, reject) => {
    const outgoing = request({hostname: '127.0.0.1', port, path, method, headers}, response => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { text += chunk; });
      response.on('end', () => resolve({status: response.statusCode, text}));
    });
    outgoing.on('error', reject);
    outgoing.end(body);
  });
}

test('the local acceptance proxy fixes its destination independently of the request target', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'ontrack-proxy-test-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  await writeFile(join(directory, 'index.html'), '<h1>Synthetic application</h1>');
  await writeFile(join(directory, 'main.js'), 'const synthetic = true;');

  const received = [];
  const upstream = createServer(async (incoming, outgoing) => {
    let body = '';
    for await (const chunk of incoming) body += chunk;
    received.push({path: incoming.url, method: incoming.method, host: incoming.headers.host, authorization: incoming.headers.authorization, body});
    outgoing.writeHead(201, {'content-type': 'application/json'}).end('{"synthetic":true}');
  });
  t.after(() => new Promise(resolve => upstream.close(resolve)));
  const upstreamPort = await listen(upstream);

  let alternateRequests = 0;
  const alternate = createServer((incoming, outgoing) => {
    alternateRequests += 1;
    outgoing.end('The proxy must never reach this server.');
  });
  t.after(() => new Promise(resolve => alternate.close(resolve)));
  const alternatePort = await listen(alternate);

  // Reserve an available local port before starting the standalone helper.
  const reservation = createServer();
  const webPort = await listen(reservation);
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, [fileURLToPath(new URL('./serve-built.mjs', import.meta.url))], {
    env: {...process.env, TUTORIAL_BUILD_DIR: directory, TUTORIAL_API_URL: `http://127.0.0.1:${upstreamPort}`, TUTORIAL_WEB_PORT: String(webPort)},
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await once(child, 'exit');
    }
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Acceptance server did not start.')), 5000);
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Acceptance server exited: ${code}`)); });
    child.stdout.on('data', chunk => {
      if (chunk.toString().includes('Full application:')) { clearTimeout(timeout); resolve(); }
    });
  });

  const maliciousTargets = [
    `http://127.0.0.1:${alternatePort}/api/settings`,
    `//127.0.0.1:${alternatePort}/api/settings`,
    `///127.0.0.1:${alternatePort}/api/settings`,
    `/\\127.0.0.1:${alternatePort}/api/settings`,
  ];
  for (const target of maliciousTargets) {
    assert.equal((await send(webPort, target)).status, 400, target);
  }
  assert.equal(alternateRequests, 0);
  assert.deepEqual(received, []);

  const response = await send(webPort, '/api/example?next=https%3A%2F%2Fexample.invalid', {
    method: 'POST', body: '{"synthetic":true}', headers: {authorization: 'Bearer synthetic-test-only', host: 'example.invalid'},
  });
  assert.deepEqual(response, {status: 201, text: '{"synthetic":true}'});
  assert.deepEqual(received, [{
    path: '/api/example?next=https%3A%2F%2Fexample.invalid', method: 'POST',
    host: `127.0.0.1:${upstreamPort}`, authorization: 'Bearer synthetic-test-only', body: '{"synthetic":true}',
  }]);
  const encodedTarget = `/api/%2f%2f127.0.0.1:${alternatePort}/%5csettings?next=http://example.invalid/`;
  assert.equal((await send(webPort, encodedTarget)).status, 201);
  assert.equal(received.at(-1).path, encodedTarget);
  assert.equal((await send(webPort, '/api')).status, 201);
  assert.equal((await send(webPort, '/main.js')).text, 'const synthetic = true;');
  assert.equal((await send(webPort, '/home')).text, '<h1>Synthetic application</h1>');
  assert.equal((await send(webPort, '/home', {method: 'HEAD'})).text, '');
  assert.equal((await send(webPort, '/home', {method: 'POST'})).status, 405);
  assert.equal(alternateRequests, 0);
});
