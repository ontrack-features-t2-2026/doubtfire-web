const {chromium} = require('playwright');
const {createServer, request} = require('node:http');
const {readFile, stat, writeFile, mkdtemp, rm, realpath} = require('node:fs/promises');
const {resolve, extname, join, relative, isAbsolute, sep} = require('node:path');
const {tmpdir} = require('node:os');
const assert = require('node:assert/strict');

const root = resolve(process.env.WEB_DIST_DIR || 'dist/browser');
let output;
const apiPort = Number(process.env.QA_API_PORT || 4331);
const webPort = Number(process.env.QA_WEB_PORT || 4332);
const origin = `http://localhost:${webPort}`;
const username = process.env.QA_USERNAME || 'demo_student';
const types = {
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
const result = {
  scope:
    'Production web build with real isolated development Rails/MariaDB and guarded synthetic demo fixtures. No API response mocks.',
  checks: [],
  apiResponses: [],
  externalRequests: [],
  pageErrors: [],
};
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path.startsWith('/api/')) {
      const proxy = request(
        {
          hostname: '127.0.0.1',
          port: apiPort,
          path: req.url,
          method: req.method,
          headers: {...req.headers, host: `localhost:${webPort}`},
        },
        (upstream) => {
          result.apiResponses.push({path, method: req.method, status: upstream.statusCode});
          res.writeHead(upstream.statusCode, upstream.headers);
          upstream.pipe(res);
        },
      );
      proxy.on('error', () => {
        res.writeHead(502);
        res.end();
      });
      req.pipe(proxy);
      return;
    }
    let file = resolve(root, '.' + decodeURIComponent(path));
    if (!file.startsWith(root + '/') && file !== root) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      if (!(await stat(file)).isFile()) file = join(root, 'index.html');
    } catch {
      if (extname(path) || path.startsWith('/assets/')) {
        res.writeHead(404);
        res.end();
        return;
      }
      file = join(root, 'index.html');
    }
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(500);
    res.end();
  }
});

(async () => {
  // Resolve symlinks before rejecting output parents inside the checkout or build.
  // Every run creates a unique child so checked-in evidence is never overwritten.
  const outputParent = await realpath(resolve(process.env.QA_OUTPUT_DIR || tmpdir()));
  assert((await stat(outputParent)).isDirectory(), 'QA_OUTPUT_DIR must be an existing directory.');
  const protectedDirectories = await Promise.all([
    realpath(resolve(__dirname, '../../../..')),
    realpath(root),
  ]);
  for (const directory of protectedDirectories) {
    const pathFromDirectory = relative(directory, outputParent);
    const isInside =
      pathFromDirectory === '' ||
      (pathFromDirectory !== '..' &&
        !pathFromDirectory.startsWith(`..${sep}`) &&
        !isAbsolute(pathFromDirectory));
    assert(!isInside, 'QA_OUTPUT_DIR must be outside the repository and served build.');
  }
  output = await mkdtemp(join(outputParent, 'desktop-pwa-auth-results-'));
  console.log(`Authentication check output: ${output}`);
  await new Promise((resolve) => server.listen(webPort, '127.0.0.1', resolve));
  if (process.argv.includes('--serve-only')) {
    console.log(`Real synthetic API proxy ${origin}`);
    return;
  }
  assert(
    process.env.QA_PASSWORD,
    'Set QA_PASSWORD to the synthetic fixture password. It is never written to results.',
  );
  const profile = await mkdtemp(join(tmpdir(), 'desktop-pwa-qa-auth-'));
  let context, page;
  try {
    context = await chromium.launchPersistentContext(profile, {
      channel: 'chrome',
      headless: true,
      viewport: {width: 1440, height: 1000},
    });
    page = await context.newPage();
    page.on('pageerror', (error) => result.pageErrors.push(String(error)));
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === 'localhost' || url.protocol === 'data:') return route.continue();
      result.externalRequests.push(url.origin + url.pathname);
      if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'cdn.jsdelivr.net')
        return route.continue();
      return route.abort();
    });
    await page.goto(`${origin}/notifications`, {waitUntil: 'domcontentloaded'});
    await page.getByRole('textbox', {name: 'Username', exact: true}).waitFor({timeout: 60000});
    assert(new URL(page.url()).pathname === '/sign_in');
    result.checks.push({
      check: 'Unauthenticated protected route redirects to sign-in',
      pass: true,
      path: new URL(page.url()).pathname,
    });
    await page.getByRole('textbox', {name: 'Username', exact: true}).fill(username);
    await page.getByLabel('Password', {exact: true}).fill('incorrect-local-password');
    const invalid = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/auth' && r.request().method() === 'POST',
    );
    await page.getByRole('button', {name: 'Sign In', exact: true}).click();
    assert.equal((await invalid).status(), 401);
    result.checks.push({check: 'Database rejects incorrect password', pass: true});
    await page.getByLabel('Password', {exact: true}).fill(process.env.QA_PASSWORD);
    await page.getByRole('checkbox', {name: 'Stay logged in', exact: true}).check();
    const login = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/auth' && r.request().method() === 'POST',
    );
    const notificationLoad = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/notifications/' && r.request().method() === 'GET',
    );
    await page.getByRole('button', {name: 'Sign In', exact: true}).click();
    const loginResponse = await login;
    assert.equal(loginResponse.status(), 201);
    await page.waitForURL('**/notifications', {timeout: 60000});
    await page
      .getByRole('button', {name: 'Open account menu', exact: true})
      .waitFor({timeout: 60000});
    result.checks.push({
      check: 'Valid database sign-in returns to original protected route',
      pass: true,
      path: new URL(page.url()).pathname,
    });
    const notificationResponse = await notificationLoad;
    const notifications = await notificationResponse.json();
    assert.equal(notificationResponse.status(), 200);
    assert(Array.isArray(notifications) && notifications.length > 0);
    await page.locator('.app-splash-screen').waitFor({state: 'hidden', timeout: 60000});
    await page.getByRole('heading', {name: 'Notifications', exact: true}).waitFor({timeout: 30000});
    if (await page.getByRole('button', {name: 'Close', exact: true}).isVisible()) {
      await page.getByRole('button', {name: 'Close', exact: true}).click();
      await page.getByRole('button', {name: 'Close', exact: true}).waitFor({state: 'hidden'});
    }
    result.checks.push({
      check: 'Authenticated notification route loads real database records',
      pass: true,
      notificationCount: notifications.length,
    });
    await page.screenshot({path: join(output, 'authenticated-notifications.png'), fullPage: true});
    const reloadNotifications = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/notifications/' && r.request().method() === 'GET',
    );
    await page.reload({waitUntil: 'domcontentloaded'});
    await page
      .getByRole('button', {name: 'Open account menu', exact: true})
      .waitFor({timeout: 60000});
    assert.equal(new URL(page.url()).pathname, '/notifications');
    result.checks.push({
      check: 'Authenticated reload restores session using refresh cookie',
      pass: true,
    });
    const protectedRequest = await reloadNotifications;
    const activeHeaders = await protectedRequest.request().allHeaders();
    assert(activeHeaders.username && activeHeaders['auth-token']);
    await page.getByRole('button', {name: 'Open account menu', exact: true}).click();
    const logout = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/auth' && r.request().method() === 'DELETE',
    );
    await page.getByRole('menuitem', {name: /Sign Out/}).click();
    const logoutResponse = await logout;
    assert(logoutResponse.status() >= 200 && logoutResponse.status() < 300);
    await page.getByRole('textbox', {name: 'Username', exact: true}).waitFor({timeout: 30000});
    result.checks.push({
      check: 'Sign-out deletes server session and returns to sign-in',
      pass: true,
      logoutStatus: logoutResponse.status(),
    });
    if (activeHeaders) {
      const revoked = await fetch(`${origin}/api/notifications/`, {
        headers: {username: activeHeaders.username, 'auth-token': activeHeaders['auth-token']},
      });
      assert.equal(revoked.status, 419);
      assert.match((await revoked.json()).error, /Authentication|authenticate/);
      result.checks.push({
        check: 'API rejects access token captured before sign-out',
        pass: true,
        status: revoked.status,
      });
    }
    const refresh = await context.request.post(`${origin}/api/auth/access-token`, {data: {}});
    const refreshBody = await refresh.json();
    assert(!refreshBody?.auth_token);
    result.checks.push({
      check: 'Refresh cookie cannot restore session after logout',
      pass: true,
      status: refresh.status(),
    });
    await page.goto(`${origin}/notifications`, {waitUntil: 'domcontentloaded'});
    await page.getByRole('textbox', {name: 'Username', exact: true}).waitFor({timeout: 30000});
    assert.equal(new URL(page.url()).pathname, '/sign_in');
    result.checks.push({check: 'Protected route denied after logout', pass: true});
    await page.screenshot({path: join(output, 'signed-out.png'), fullPage: true});
    assert.deepEqual(
      result.pageErrors,
      [],
      'Uncaught browser page errors must be resolved before this check passes.',
    );
    result.status = 'passed';
  } catch (error) {
    result.status = 'failed';
    result.error = String(error);
    if (page) {
      result.failureUrl = page.url();
      result.failureBody = await page
        .locator('body')
        .innerText()
        .catch(() => '');
      await page.screenshot({path: join(output, 'failure.png'), fullPage: true}).catch(() => {});
    }
    process.exitCode = 1;
  } finally {
    await writeFile(join(output, 'results.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(
      JSON.stringify({status: result.status, checks: result.checks, error: result.error}, null, 2),
    );
    await context?.close();
    await rm(profile, {recursive: true, force: true});
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  server.close();
});
