#!/usr/bin/env node
'use strict';

// Tests the real production Angular worker/updater against explicitly synthetic
// release variants. The supplied production output and repository are read-only.
const {chromium} = require('playwright');
const {createServer} = require('node:http');
const {readFile, stat, access, realpath, cp, rm, writeFile, mkdtemp} = require('node:fs/promises');
const {constants} = require('node:fs');
const {createHash, randomUUID} = require('node:crypto');
const {resolve, extname, join, relative, isAbsolute, sep, delimiter} = require('node:path');
const {tmpdir, homedir} = require('node:os');
const assert = require('node:assert/strict');

const repository = resolve(__dirname, '../../../..');
const source = resolve(process.argv[2] || join(repository, 'dist/browser'));
const mime = {
  '.html': 'text/html',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
const sha1 = (value) => createHash('sha1').update(value).digest('hex');
const isWithin = (parent, child) => {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..' + sep) && path !== '..' && !isAbsolute(path));
};

async function chromeExecutable() {
  const override = process.env.CHROME_EXECUTABLE;
  const candidates = override
    ? [resolve(override)]
    : [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        join(homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/opt/google/chrome/chrome',
        ...['PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA']
          .filter((name) => process.env[name])
          .map((name) => join(process.env[name], 'Google/Chrome/Application/chrome.exe')),
        ...(process.env.PATH || '')
          .split(delimiter)
          .filter(Boolean)
          .flatMap((directory) =>
            ['google-chrome', 'google-chrome-stable', 'chrome.exe'].map((name) =>
              join(directory, name),
            ),
          ),
      ];
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.R_OK | constants.X_OK);
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {}
  }
  throw new Error(
    'Installed Google Chrome not found. Set CHROME_EXECUTABLE to its absolute executable path.',
  );
}

async function release(directory, label, timestamp) {
  await cp(source, directory, {recursive: true});
  const indexPath = join(directory, 'index.html');
  const index = await readFile(indexPath, 'utf8');
  await writeFile(
    indexPath,
    index.replace('</head>', `<meta name="synthetic-test-release" content="${label}"></head>`),
  );
  const config = JSON.parse(await readFile(join(directory, 'ngsw.json'), 'utf8'));
  config.timestamp = timestamp;
  for (const asset of Object.keys(config.hashTable)) {
    config.hashTable[asset] = sha1(await readFile(join(directory, asset)));
  }
  await writeFile(join(directory, 'ngsw.json'), JSON.stringify(config, null, 2));
  return {
    label,
    versionHash: sha1(JSON.stringify(config)),
    indexHash: config.hashTable['/index.html'],
    assetTableHash: sha1(JSON.stringify(config.hashTable)),
    timestamp,
  };
}

(async () => {
  // Always retain output outside the repository and the supplied build. Each run
  // gets a unique directory and never overwrites the checked-in evidence.
  const outputParent = await realpath(process.env.PWA_OUTPUT_ROOT || tmpdir());
  const sourceRealPath = await realpath(source);
  const repositoryRealPath = await realpath(repository);
  assert(
    !isWithin(repositoryRealPath, outputParent),
    'PWA_OUTPUT_ROOT must be outside the repository',
  );
  assert(
    !isWithin(sourceRealPath, outputParent),
    'PWA_OUTPUT_ROOT must be outside the supplied build',
  );
  const output = await mkdtemp(join(outputParent, 'ontrack-pwa-update-evidence-'));
  const runDirectory = await mkdtemp(join(output, '.run-'));
  const report = {
    startedAt: new Date().toISOString(),
    source: relative(repository, source) || '.',
    browser: null,
    syntheticApi: true,
    syntheticReleaseVariants: true,
    actualProductionCodeChanged: false,
    osInstallationTested: false,
    institutionalSsoTested: false,
    realNotificationDeliveryTested: false,
    checks: [],
    events: [],
    states: {},
  };
  let server, context, page;
  const errors = [];
  try {
    const executablePath = await chromeExecutable();
    const initialTimestamp = Date.now();
    const releaseA = join(runDirectory, 'release-a');
    const releaseB = join(runDirectory, 'release-b');
    const releaseRollback = join(runDirectory, 'release-rollback');
    report.releases = {
      A: await release(releaseA, 'A', initialTimestamp),
      B: await release(releaseB, 'B', initialTimestamp + 1),
      rollback: await release(releaseRollback, 'A', initialTimestamp + 2),
    };
    report.identity = JSON.parse(await readFile(join(releaseA, 'manifest.webmanifest'), 'utf8'));
    assert.equal(
      await readFile(join(releaseA, 'manifest.webmanifest'), 'utf8'),
      await readFile(join(releaseB, 'manifest.webmanifest'), 'utf8'),
    );
    let serving = releaseA;
    server = createServer(async (req, res) => {
      try {
        const path = new URL(req.url, 'http://localhost').pathname;
        if (path.startsWith('/api/')) {
          const fixtures = {
            '/api/settings/public': {
              externalName: 'OnTrack',
              hasLogo: false,
              logoUrl: null,
              logoLinkUrl: '/',
            },
            '/api/auth/signout_url': {auth_signout_url: '/sign_in'},
            '/api/auth/method': {},
          };
          res.writeHead(fixtures[path] ? 200 : 401, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          });
          res.end(JSON.stringify(fixtures[path] || {error: 'Synthetic signed-out test session'}));
          return;
        }
        let file = resolve(serving, '.' + decodeURIComponent(path));
        if (!isWithin(serving, file)) {
          res.writeHead(403);
          res.end();
          return;
        }
        try {
          if (!(await stat(file)).isFile()) file = join(serving, 'index.html');
        } catch {
          if (extname(path) || path.startsWith('/assets/')) {
            res.writeHead(404);
            res.end();
            return;
          }
          file = join(serving, 'index.html');
        }
        res.writeHead(200, {
          'Content-Type': mime[extname(file)] || 'application/octet-stream',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        });
        res.end(await readFile(file));
      } catch {
        res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
        res.end('Internal server error');
      }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    report.origin = `http://127.0.0.1:${server.address().port}`;
    const invalidPathResponse = await fetch(report.origin + '/%');
    assert.equal(invalidPathResponse.status, 500);
    assert.equal(await invalidPathResponse.text(), 'Internal server error');
    report.checks.push('Malformed request paths return a generic error without exception details.');
    context = await chromium.launchPersistentContext(join(runDirectory, 'profile'), {
      executablePath,
      headless: true,
      viewport: {width: 1440, height: 1000},
    });
    page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    report.browser = await cdp.send('Browser.getVersion');
    await page.exposeFunction('captureWorkerMessage', (data) => {
      report.events.push({at: new Date().toISOString(), ...data});
    });
    await page.addInitScript(() => {
      window.__documentId = crypto.randomUUID();
      navigator.serviceWorker.addEventListener('message', (event) =>
        window.captureWorkerMessage(event.data),
      );
    });
    page.on('pageerror', (error) => errors.push(error.message));
    const getLabel = () =>
      page.locator('meta[name="synthetic-test-release"]').getAttribute('content');
    const getState = () => page.evaluate(async () => (await fetch('/ngsw/state')).text());
    const checkForUpdate = () =>
      page.evaluate(
        () =>
          new Promise((resolve, reject) => {
            const nonce = Math.floor(Math.random() * 1000000000);
            const timeout = setTimeout(() => {
              navigator.serviceWorker.removeEventListener('message', onMessage);
              reject(new Error('Worker update operation timed out'));
            }, 60000);
            function onMessage(event) {
              if (event.data.type !== 'OPERATION_COMPLETED' || event.data.nonce !== nonce) return;
              clearTimeout(timeout);
              navigator.serviceWorker.removeEventListener('message', onMessage);
              event.data.error ? reject(new Error(event.data.error)) : resolve(event.data.result);
            }
            navigator.serviceWorker.addEventListener('message', onMessage);
            navigator.serviceWorker.controller.postMessage({action: 'CHECK_FOR_UPDATES', nonce});
          }),
      );

    await page.goto(report.origin + '/sign_in');
    await page.locator('f-pwa-install-button button').waitFor({timeout: 60000});
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, {
      timeout: 60000,
    });
    await page.waitForFunction(
      async () => {
        const config = await (await fetch('/ngsw.json')).json();
        const urls = config.assetGroups
          .filter((g) => g.installMode === 'prefetch')
          .flatMap((g) => g.urls);
        return (
          await Promise.all(urls.map((url) => caches.match(new URL(url, location.origin).href)))
        ).every(Boolean);
      },
      undefined,
      {timeout: 60000},
    );
    assert.equal(await getLabel(), 'A');
    report.states.initial = await getState();
    assert.match(report.states.initial, /Driver state: NORMAL/);
    assert(report.states.initial.includes(report.releases.A.versionHash));
    report.registration = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return {scope: registration.scope, scriptURL: registration.active.scriptURL};
    });
    report.checks.push(
      'Synthetic release A caches successfully in the actual production Angular worker, which reaches NORMAL.',
    );

    // This DOM sentinel explicitly represents unsaved browser state; no live account
    // or course editor is involved in this signed-out test.
    const sentinel = `Unsaved local regression sentinel ${randomUUID()}`;
    await page.evaluate((value) => {
      const draft = document.createElement('textarea');
      draft.id = 'synthetic-unsaved-work';
      draft.setAttribute('aria-label', 'Synthetic unsaved work regression sentinel');
      draft.style.cssText =
        'position:fixed;left:24px;top:100px;width:600px;height:70px;z-index:9999;background:#fff';
      draft.value = value;
      document.body.append(draft);
    }, sentinel);
    const originalDocument = await page.evaluate(() => window.__documentId);
    const originalUrl = page.url();
    serving = releaseB;
    assert.equal(await checkForUpdate(), true);
    await page
      .getByText('A new version of OnTrack is ready. Reload to update now.', {exact: true})
      .waitFor({timeout: 60000});
    await page.waitForTimeout(10000);
    assert.equal(await page.evaluate(() => window.__documentId), originalDocument);
    assert.equal(page.url(), originalUrl);
    assert.equal(await page.locator('#synthetic-unsaved-work').inputValue(), sentinel);
    assert.equal(await getLabel(), 'A');
    report.checks.push(
      'Real VERSION_READY for B shows the app Reload action; the existing document and synthetic unsaved DOM value survive 10 seconds with no automatic navigation.',
    );
    await page.screenshot({
      path: join(output, 'update-ready-preserves-document.png'),
      fullPage: true,
    });
    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', {name: 'Reload', exact: true}).click(),
    ]);
    await page.locator('f-pwa-install-button button').waitFor();
    assert.equal(await getLabel(), 'B');
    assert.notEqual(await page.evaluate(() => window.__documentId), originalDocument);
    report.states.updated = await getState();
    assert.match(report.states.updated, /Driver state: NORMAL/);
    report.checks.push(
      'Clicking the actual app Reload action activates synthetic release B and reloads successfully; worker remains NORMAL.',
    );

    // Angular ignores a known version hash instead of making it latest again.
    // Record that limitation first, then exercise a coherent freshly published
    // rollback of A's asset content with a new Angular config timestamp/hash.
    serving = releaseA;
    const beforeRollback = await page.evaluate(() => window.__documentId);
    assert.equal(await checkForUpdate(), false);
    report.states.exactRestore = await getState();
    assert(
      report.states.exactRestore.includes('Latest manifest hash: ' + report.releases.B.versionHash),
    );
    assert.equal(await getLabel(), 'B');
    report.checks.push(
      'Restoring a previously known identical ngsw manifest is correctly recorded as insufficient: Angular returns NO_NEW_VERSION_DETECTED and retains B as latest.',
    );
    const newClient = await context.newPage();
    const launchResponse = await newClient.goto(report.origin + '/sign_in');
    await newClient.locator('f-pwa-install-button button').waitFor({timeout: 60000});
    assert.equal(
      await newClient.locator('meta[name="synthetic-test-release"]').getAttribute('content'),
      'B',
    );
    assert(launchResponse.fromServiceWorker());
    report.exactRestoreNewClient = {
      release: 'B',
      responseFromServiceWorker: launchResponse.fromServiceWorker(),
    };
    await newClient.close();
    report.checks.push(
      'A newly opened client on the same browser profile still receives cached B after the identical old-image restore, confirming the rollback limitation also affects subsequent app launches.',
    );
    assert.equal(report.releases.rollback.indexHash, report.releases.A.indexHash);
    assert.equal(report.releases.rollback.assetTableHash, report.releases.A.assetTableHash);
    serving = releaseRollback;
    assert.equal(await checkForUpdate(), true);
    await page
      .getByText('A new version of OnTrack is ready. Reload to update now.', {exact: true})
      .waitFor({timeout: 60000});
    assert.equal(await getLabel(), 'B');
    assert.equal(await page.evaluate(() => window.__documentId), beforeRollback);
    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', {name: 'Reload', exact: true}).click(),
    ]);
    await page.locator('f-pwa-install-button button').waitFor();
    assert.equal(await getLabel(), 'A');
    report.states.rolledBack = await getState();
    assert.match(report.states.rolledBack, /Driver state: NORMAL/);
    assert(
      report.states.rolledBack.includes(
        'Latest manifest hash: ' + report.releases.rollback.versionHash,
      ),
    );
    const readyEvents = report.events.filter((event) => event.type === 'VERSION_READY');
    assert(
      readyEvents.some(
        (event) =>
          event.currentVersion.hash === report.releases.A.versionHash &&
          event.latestVersion.hash === report.releases.B.versionHash,
      ),
    );
    assert(
      readyEvents.some(
        (event) =>
          event.currentVersion.hash === report.releases.B.versionHash &&
          event.latestVersion.hash === report.releases.rollback.versionHash,
      ),
    );
    assert.deepEqual(
      await page.evaluate(async () => {
        const reg = await navigator.serviceWorker.ready;
        return {scope: reg.scope, scriptURL: reg.active.scriptURL};
      }),
      report.registration,
    );
    const restoredIdentity = await page.evaluate(async () =>
      (await fetch('/manifest.webmanifest')).json(),
    );
    assert.deepEqual(restoredIdentity, report.identity);
    report.checks.push(
      'Publishing A asset content as a fresh Angular manifest produces a real rollback VERSION_READY; app Reload restores A successfully with unchanged manifest identity and worker scope.',
    );

    await context.setOffline(true);
    await cdp.send('Network.overrideNetworkState', {
      offline: true,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
    await page.waitForFunction(() => !navigator.onLine);
    const response = await page.reload();
    assert(response.fromServiceWorker());
    assert.equal(await getLabel(), 'A');
    await page.waitForFunction(() =>
      document.querySelector('f-pwa-connection-status')?.textContent.includes('offline'),
    );
    report.offline = await page.evaluate(() => ({
      online: navigator.onLine,
      bodyText: document.body.innerText,
    }));
    report.checks.push(
      'Rolled-back A reloads from the real service worker while offline and shows the app offline warning.',
    );
    await page.screenshot({path: join(output, 'rollback-a-offline.png'), fullPage: true});
    await context.setOffline(false);
    await cdp.send('Network.overrideNetworkState', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
    await page.waitForFunction(() => navigator.onLine);
    assert.equal(await checkForUpdate(), false);
    report.checks.push(
      'Reconnect succeeds; checking the restored release again correctly reports no newer version.',
    );
    assert.deepEqual(errors, []);
    report.result = 'PASS';
  } catch (error) {
    report.result = 'FAIL';
    report.failure = error.stack;
    process.exitCode = 1;
    if (page) {
      await page.screenshot({path: join(output, 'failure.png'), fullPage: true}).catch(() => {});
      try {
        report.states.failure = await page.evaluate(async () =>
          (await fetch('/ngsw/state')).text(),
        );
      } catch {}
    }
  } finally {
    report.pageErrors = errors;
    report.finishedAt = new Date().toISOString();
    await writeFile(join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
    console.log(`Evidence directory: ${output}`);
    if (context) await context.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    await rm(runDirectory, {recursive: true, force: true});
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
