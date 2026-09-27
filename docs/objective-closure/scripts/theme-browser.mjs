import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve, sep} from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium, firefox, webkit} = await import(
  process.env.CLOSURE_PLAYWRIGHT_MODULE || 'playwright'
);

// Real Angular routes only. Never substitute static HTML or mock application APIs.
const base = process.env.CLOSURE_QA_URL || 'http://127.0.0.1:4311';
const out = pathToFileURL(resolve(process.env.CLOSURE_QA_OUTPUT || 'qa-output') + sep);
const selected = process.env.CLOSURE_QA_BROWSERS?.split(',');
const stage = process.env.CLOSURE_QA_STAGE || 'signed-out';
await mkdir(out, {recursive: true});
const engines = [
  ['chrome', chromium, {channel: 'chrome'}],
  ['edge', chromium, {channel: 'msedge'}],
  ['firefox', firefox, {}],
  ['webkit', webkit, {}],
];
const previous = selected
  ? JSON.parse(await readFile(new URL(`results-${stage}.json`, out), 'utf8').catch(() => '{}'))
      .results || []
  : [];
const results = previous.filter((entry) => !selected?.includes(entry.browser));
let interrupted = false;
process.on('SIGTERM', () => {
  interrupted = true;
});
const key = 'ontrack.theme.preference';
const expectedMeta = {light: '#fafafa', dark: '#0f1216'};
const sanitise = (value) =>
  String(value).replace(/([?&](?:auth_token|token|password)=)[^&\s]+/gi, '$1[redacted]');
async function save() {
  await writeFile(
    new URL(`results-${stage}.json`, out),
    JSON.stringify(
      {
        recordedAt: new Date().toISOString(),
        base,
        stage,
        testedWeb: process.env.CLOSURE_WEB_SHA || 'UNRECORDED',
        testedApi: process.env.CLOSURE_API_SHA || 'UNRECORDED',
        evidenceScope:
          'Real locally served Angular application with disposable synthetic backend fixtures. WebKit is Playwright WebKit, not Safari. Color-scheme is emulated; CSS zoom is not native browser zoom. Keyboard/DOM checks are automation, not a human screen-reader/usability assessment.',
        results,
      },
      null,
      2,
    ) + '\n',
  );
}
async function snapshot(page, name) {
  await page.screenshot({
    path: new URL(`${name}.png`, out).pathname,
    fullPage: true,
    animations: 'disabled',
    timeout: 20000,
  });
  await writeFile(new URL(`${name}-aria.txt`, out), await page.locator('body').ariaSnapshot());
}
async function themeState(page) {
  return page.evaluate(() => ({
    marker: document.documentElement.getAttribute('data-ot-theme'),
    colorScheme: document.documentElement.style.colorScheme,
    meta: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
    preference: (() => {
      try {
        return localStorage.getItem('ontrack.theme.preference');
      } catch {
        return 'blocked';
      }
    })(),
    firstFrames: window.__themeFrames || [],
    background: getComputedStyle(document.body).backgroundColor,
    foreground: getComputedStyle(document.body).color,
  }));
}
async function assertTheme(page, expected) {
  await page.waitForFunction(
    ({value, meta}) =>
      document.documentElement.getAttribute('data-ot-theme') === value &&
      document.documentElement.style.colorScheme === value &&
      document.querySelector('meta[name="theme-color"]')?.getAttribute('content') === meta,
    {value: expected, meta: expectedMeta[expected]},
    {timeout: 15000},
  );
  const state = await themeState(page);
  assert.equal(state.marker, expected);
  assert.equal(state.colorScheme, expected);
  assert.equal(state.meta, expectedMeta[expected]);
  return state;
}
async function initPreference(context, preference, blocked = false) {
  await context.addInitScript(
    ({preference, key, blocked}) => {
      if (preference !== null) localStorage.setItem(key, preference);
      else localStorage.removeItem(key);
      if (blocked) {
        const nativeGet = Storage.prototype.getItem;
        const nativeSet = Storage.prototype.setItem;
        Storage.prototype.getItem = function (k) {
          if (k === key) throw new DOMException('Synthetic blocked theme storage', 'SecurityError');
          return nativeGet.call(this, k);
        };
        Storage.prototype.setItem = function (k, v) {
          if (k === key) throw new DOMException('Synthetic blocked theme storage', 'SecurityError');
          return nativeSet.call(this, k, v);
        };
      }
      window.__themeFrames = [];
      let frames = 0;
      const record = () => {
        window.__themeFrames.push({
          marker: document.documentElement?.getAttribute('data-ot-theme'),
          time: performance.now(),
        });
        if (++frames < 30) requestAnimationFrame(record);
      };
      requestAnimationFrame(record);
    },
    {preference, key, blocked},
  );
}
async function realAppReady(page) {
  await page.locator('app-root[ng-version]').waitFor({state: 'attached', timeout: 45000});
  await page.getByRole('heading', {name: /Welcome to/}).waitFor({timeout: 45000});
  await page.getByRole('textbox', {name: 'Username', exact: true}).waitFor({timeout: 10000});
}
async function signedOut(browser, name, result) {
  const cases = [
    {id: 'default-light', preference: null, system: 'light', expected: 'light'},
    {id: 'default-dark', preference: null, system: 'dark', expected: 'dark'},
    {id: 'explicit-light', preference: 'light', system: 'dark', expected: 'light'},
    {id: 'explicit-dark', preference: 'dark', system: 'light', expected: 'dark'},
    {id: 'system-dark', preference: 'system', system: 'dark', expected: 'dark'},
    {id: 'invalid-dark', preference: 'unexpected', system: 'dark', expected: 'dark'},
    {id: 'blocked-dark', preference: null, system: 'dark', expected: 'dark', blocked: true},
  ];
  for (const scenario of cases) {
    if (interrupted) break;
    const context = await browser.newContext({
      viewport: {width: 1280, height: 900},
      colorScheme: scenario.system,
      reducedMotion: 'reduce',
    });
    await initPreference(context, scenario.preference, scenario.blocked);
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(90000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(sanitise(error.message)));
    const check = {id: scenario.id, status: 'running'};
    result.checks.push(check);
    try {
      await page.goto(`${base}/sign_in`, {waitUntil: 'domcontentloaded'});
      await realAppReady(page);
      check.initial = await assertTheme(page, scenario.expected);
      const painted = check.initial.firstFrames.filter((frame) => frame.marker);
      assert(painted.length > 0, 'No initial animation-frame marker recorded');
      assert(
        painted.every((frame) => frame.marker === scenario.expected),
        'Theme marker changed during early animation frames',
      );
      check.firstPaintScope =
        'Root marker at early requestAnimationFrame callbacks; not compositor-filmstrip proof.';
      await page.reload({waitUntil: 'domcontentloaded'});
      await realAppReady(page);
      await assertTheme(page, scenario.expected);
      check.reload = 'passed';
      await page.emulateMedia({colorScheme: scenario.system === 'dark' ? 'light' : 'dark'});
      const follows = !['light', 'dark'].includes(scenario.preference);
      await assertTheme(
        page,
        follows ? (scenario.expected === 'dark' ? 'light' : 'dark') : scenario.expected,
      );
      check.liveEmulatedColorScheme = follows ? 'follows system' : 'explicit preference remains';
      if (scenario.id === 'explicit-dark') {
        await snapshot(page, `${name}-signin-dark-desktop`);
        await page.emulateMedia({media: 'print'});
        check.print = await page.evaluate(() => ({
          background: getComputedStyle(document.body).backgroundColor,
          pageToken: getComputedStyle(document.documentElement)
            .getPropertyValue('--ot-color-page')
            .trim(),
          preference: localStorage.getItem('ontrack.theme.preference'),
        }));
        assert.equal(check.print.preference, 'dark');
        await snapshot(page, `${name}-signin-dark-print-media`);
        await page.emulateMedia({media: 'screen'});
      }
      if (scenario.id === 'explicit-light') {
        await page.setViewportSize({width: 320, height: 640});
        check.narrow = await page.evaluate(() => ({
          viewport: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
        }));
        await snapshot(page, `${name}-signin-light-320`);
        await page.setViewportSize({width: 1280, height: 900});
        await page.evaluate(() => (document.documentElement.style.zoom = '2'));
        check.cssZoom200 = await page.evaluate(() => ({
          viewport: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          formBounds: document.querySelector('form')?.getBoundingClientRect().toJSON(),
        }));
        await snapshot(page, `${name}-signin-light-css-zoom-200`);
        await page.evaluate(() => (document.documentElement.style.zoom = ''));
        await page.getByRole('textbox', {name: 'Username', exact: true}).focus();
        await page.keyboard.press('Tab');
        check.keyboard = await page.evaluate(() => ({
          focusedName: document.activeElement?.getAttribute('name'),
          outline: getComputedStyle(document.activeElement).outline,
          boxShadow: getComputedStyle(document.activeElement).boxShadow,
        }));
        assert.equal(check.keyboard.focusedName, 'password');
      }
      check.pageErrors = errors;
      check.status = 'passed';
    } catch (error) {
      check.status = 'failed';
      check.error = sanitise(error.stack);
      await snapshot(page, `${name}-${scenario.id}-failure`).catch(() => {});
    } finally {
      await context.close();
      await save();
    }
  }
}

async function login(page, account) {
  console.log('PHASE login-start');
  await page.goto(`${base}/sign_in`, {waitUntil: 'domcontentloaded'});
  await realAppReady(page);
  console.log('PHASE login-form-ready');
  await page.getByRole('textbox', {name: 'Username', exact: true}).fill(account.username);
  await page.locator('input[name="password"]').fill(account.password);
  await page.getByRole('checkbox', {name: 'Stay logged in', exact: true}).check();
  await page.getByRole('button', {name: 'Sign In', exact: true}).click();
  const menu = page.getByRole('button', {name: 'Open account menu', exact: true});
  const confirm = page.getByRole('button', {name: 'Confirm Account', exact: true});
  await menu.or(confirm).first().waitFor({timeout: 90000});
  if (await confirm.isVisible()) {
    console.log('PHASE confirm-synthetic-profile');
    await confirm.click();
  }
  await menu.waitFor({timeout: 90000});
  console.log('PHASE login-complete');
}
async function profile(page) {
  console.log('PHASE profile-open');
  await page.getByRole('button', {name: 'Open account menu', exact: true}).click();
  await page.getByRole('menuitem', {name: 'My Profile'}).click();
  await page.getByRole('radiogroup', {name: 'Appearance', exact: true}).waitFor();
  console.log('PHASE profile-ready');
}
async function choosePreference(page, preference) {
  console.log('PHASE preference ' + preference);
  const radio = page.getByRole('radio', {
    name: preference[0].toUpperCase() + preference.slice(1),
    exact: true,
  });
  if (await radio.isChecked()) return {status: 'already-selected', preference};
  const responsePromise = page.waitForResponse(
    (response) => {
      const request = response.request();
      if (!['PUT', 'PATCH'].includes(request.method())) return false;
      try {
        return request.postDataJSON()?.user?.theme_preference === preference;
      } catch {
        return false;
      }
    },
    {timeout: 15000},
  );
  await radio.check();
  const response = await responsePromise;
  assert(response.ok(), `Theme account write status ${response.status()}`);
  const body = await response.json();
  const value = body.theme_preference ?? body.user?.theme_preference;
  assert.equal(value, preference);
  return {status: response.status(), preference: value};
}
async function authenticated(browser, name, result) {
  if (!process.env.CLOSURE_QA_FIXTURES)
    throw new Error('Set CLOSURE_QA_FIXTURES to local synthetic fixture JSON');
  const fixtures = JSON.parse(await readFile(process.env.CLOSURE_QA_FIXTURES, 'utf8'));
  const account = fixtures.themeStudent || fixtures.accounts?.themeStudent;
  if (!account?.username || !account?.password)
    throw new Error('Fixture JSON requires themeStudent username/password');
  const context = await browser.newContext({
    viewport: {width: 1280, height: 900},
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(90000);
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(sanitise(error.message)));
  const check = {id: 'real-profile-theme-controls-and-account-persistence', status: 'running'};
  result.checks.push(check);
  try {
    await login(page, account);
    await profile(page);
    check.radioNames = await page.getByRole('radiogroup', {name: 'Appearance'}).ariaSnapshot();
    check.accountWrites = [];
    check.accountWrites.push(await choosePreference(page, 'light'));
    await assertTheme(page, 'light');
    await page.getByRole('radio', {name: 'Light', exact: true}).focus();
    // A real keyboard arrow action, rather than script-dispatching a change event.
    const keyboardResponse = page.waitForResponse((response) => {
      try {
        return (
          ['PUT', 'PATCH'].includes(response.request().method()) &&
          response.request().postDataJSON()?.user?.theme_preference === 'dark'
        );
      } catch {
        return false;
      }
    });
    await page.keyboard.press('ArrowRight');
    const response = await keyboardResponse;
    assert(response.ok());
    assert.equal(await page.getByRole('radio', {name: 'Dark', exact: true}).isChecked(), true);
    await assertTheme(page, 'dark');
    check.keyboardArrowSelection = 'passed';
    check.peerProgressContrast = await page
      .locator('.peer-progress-preference small')
      .evaluate((el) => {
        const foreground = getComputedStyle(el).color;
        let node = el,
          background = '';
        while (node) {
          background = getComputedStyle(node).backgroundColor;
          if (!['rgba(0, 0, 0, 0)', 'transparent'].includes(background)) break;
          node = node.parentElement;
        }
        const luminance = (color) => {
          const rgb = color
            .match(/[\d.]+/g)
            .slice(0, 3)
            .map(Number)
            .map((v) => {
              v /= 255;
              return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
            });
          return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
        };
        const a = luminance(foreground),
          b = luminance(background);
        return {foreground, background, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)};
      });
    assert(
      check.peerProgressContrast.ratio >= 4.5,
      `Peer progress hint contrast ${check.peerProgressContrast.ratio}`,
    );
    await snapshot(page, `${name}-profile-dark-desktop`);
    await page.emulateMedia({colorScheme: 'dark'});
    await assertTheme(page, 'dark');
    check.accountWrites.push(await choosePreference(page, 'system'));
    await assertTheme(page, 'dark');
    await page.emulateMedia({colorScheme: 'light'});
    await assertTheme(page, 'light');
    check.systemLiveChange = 'passed with emulated media';
    await page.setViewportSize({width: 320, height: 640});
    await page.getByRole('radiogroup', {name: 'Appearance'}).scrollIntoViewIfNeeded();
    check.narrow = await page.getByRole('radiogroup', {name: 'Appearance'}).evaluate((el) => ({
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bounds: el.getBoundingClientRect().toJSON(),
    }));
    await snapshot(page, `${name}-profile-system-light-320`);
    assert(
      check.narrow.bounds.x >= 0 &&
        check.narrow.bounds.right <= 321 &&
        check.narrow.documentWidth <= 321,
      `Profile appearance controls exceed 320px viewport: ${JSON.stringify(check.narrow)}`,
    );
    await page.setViewportSize({width: 1280, height: 900});
    if (process.env.CLOSURE_QA_SKIP_CSS_ZOOM === '1') {
      check.cssZoom200 = 'not run: isolating WebKit protocol/frame failure after CSS zoom';
    } else {
      await page.evaluate(() => (document.documentElement.style.zoom = '2'));
      await page.getByRole('radiogroup', {name: 'Appearance'}).scrollIntoViewIfNeeded();
      check.cssZoom200 = await page
        .getByRole('radiogroup', {name: 'Appearance'})
        .evaluate((el) => ({
          viewport: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bounds: el.getBoundingClientRect().toJSON(),
        }));
      await snapshot(page, `${name}-profile-css-zoom-200`);
      await page.evaluate(() => (document.documentElement.style.zoom = ''));
    }
    check.accountWrites.push(await choosePreference(page, 'dark'));
    await assertTheme(page, 'dark');
    await page.reload({waitUntil: 'domcontentloaded'});
    await page.getByRole('radio', {name: 'Dark', exact: true}).waitFor({timeout: 90000});
    assert.equal(await page.getByRole('radio', {name: 'Dark', exact: true}).isChecked(), true);
    await assertTheme(page, 'dark');
    check.reloadAndSessionRestore = 'passed';
    const persistenceBrowser = name === 'webkit' ? await webkit.launch({headless: true}) : null;
    const fresh = await (persistenceBrowser || browser).newContext({
      viewport: {width: 1280, height: 900},
      colorScheme: 'light',
    });
    const freshPage = await fresh.newPage();
    try {
      await login(freshPage, account);
      await profile(freshPage);
      assert.equal(
        await freshPage.getByRole('radio', {name: 'Dark', exact: true}).isChecked(),
        true,
      );
      await assertTheme(freshPage, 'dark');
      check.freshContextAccountPersistence = 'passed with no preloaded theme storage';
      if (persistenceBrowser)
        check.persistenceHarness =
          'Fresh-login check uses a separate WebKit browser process; closing it cannot close a context in the original browser.';
    } finally {
      await fresh.close();
      await persistenceBrowser?.close();
    }
    check.status = 'passed';
  } catch (error) {
    check.status = 'failed';
    check.error = sanitise(error.stack);
    await snapshot(page, `${name}-profile-failure`).catch(() => {});
  }
  await save();
  const calendarCheck = {id: 'real-calendar-modal-keyboard-and-layout', status: 'running'};
  result.checks.push(calendarCheck);
  try {
    const opener = page.getByRole('button', {
      name: 'Open your calendar subscription settings',
      exact: true,
    });
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('heading', {name: 'Web calendar', exact: true}).waitFor();
    await dialog.getByRole('switch', {name: 'Enable web calendar', exact: true}).waitFor();
    calendarCheck.accessibleNames = await dialog.ariaSnapshot();
    await snapshot(page, `${name}-calendar-dark-desktop`);
    await page.setViewportSize({width: 320, height: 640});
    calendarCheck.narrow = await dialog.evaluate((el) => ({
      viewport: innerWidth,
      bounds: el.getBoundingClientRect().toJSON(),
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    await snapshot(page, `${name}-calendar-dark-320`);
    await page.keyboard.press('Escape');
    await dialog.waitFor({state: 'detached'});
    await page.setViewportSize({width: 1280, height: 900});
    calendarCheck.status = 'passed';
  } catch (error) {
    calendarCheck.status = 'failed';
    calendarCheck.error = sanitise(error.stack);
    await page.keyboard.press('Escape').catch(() => {});
  }
  await save();
  const studentRoutes = [...(fixtures.themeRoutes || [])];
  if (account.projectId && !studentRoutes.some((route) => route.id === 'student-gantt'))
    studentRoutes.push({
      id: 'student-gantt',
      path: `/projects/${account.projectId}/plan`,
      readySelector: 'ngx-gantt',
    });
  for (const route of studentRoutes) {
    const routeCheck = {id: `route-${route.id}`, path: route.path, status: 'running'};
    result.checks.push(routeCheck);
    try {
      await page.goto(`${base}${route.path}`, {waitUntil: 'domcontentloaded'});
      await page
        .getByRole('button', {name: 'Open account menu', exact: true})
        .waitFor({timeout: 90000});
      if (route.id === 'student-overview')
        await page
          .getByRole('heading', {name: 'Progress Dashboard', exact: true})
          .waitFor({timeout: 90000});
      else if (route.readySelector)
        await page.locator(route.readySelector).first().waitFor({timeout: 90000});
      else if (route.ready)
        await page.getByText(route.ready, {exact: false}).first().waitFor({timeout: 90000});
      await assertTheme(page, 'dark');
      routeCheck.appearance = await themeState(page);
      routeCheck.surfaces = await page.evaluate(() => ({
        pdf: document.querySelectorAll('f-pdf-viewer').length,
        monaco: document.querySelectorAll('.monaco-editor').length,
        gantt: document.querySelectorAll('ngx-gantt').length,
        calendars: document.querySelectorAll(
          'mwl-calendar-week-view,mwl-calendar-month-view,mwl-calendar-day-view',
        ).length,
        charts: document.querySelectorAll('ngx-charts-chart').length,
      }));
      await snapshot(page, `${name}-${route.id}-dark-desktop`);
      await page.setViewportSize({width: 320, height: 640});
      await snapshot(page, `${name}-${route.id}-dark-320`);
      routeCheck.narrow = await page.evaluate(() => ({
        viewport: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      }));
      await page.setViewportSize({width: 1280, height: 900});
      routeCheck.status = 'passed';
    } catch (error) {
      routeCheck.status = 'failed';
      routeCheck.error = sanitise(error.stack);
      await snapshot(page, `${name}-${route.id}-failure`).catch(() => {});
    }
    await save();
  }
  result.pageErrors = pageErrors;
  await context.close();
}

async function staff(browser, name, result) {
  const fixtures = JSON.parse(await readFile(process.env.CLOSURE_QA_FIXTURES, 'utf8'));
  const unitId = fixtures.unitId ?? fixtures.unit_id;
  for (const role of process.env.CLOSURE_QA_ROLES?.split(',') || ['tutor', 'chair', 'admin']) {
    if (interrupted) break;
    const context = await browser.newContext({
      viewport: {width: 1280, height: 900},
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(90000);
    const check = {id: `real-${role}-routes`, status: 'running', routes: []};
    result.checks.push(check);
    try {
      await login(page, fixtures[role] ?? fixtures.accounts?.[role]);
      await profile(page);
      await choosePreference(page, 'dark');
      await assertTheme(page, 'dark');
      const routes =
        role === 'tutor'
          ? [
              {
                id: 'analytics-calendar-charts',
                path: `/units/${unitId}/analytics`,
                ready: 'f-unit-analytics',
              },
            ]
          : role === 'chair'
            ? [
                {
                  id: 'unit-task-editor',
                  path: `/units/${unitId}/admin/tasks`,
                  ready: 'f-unit-task-editor',
                },
                {
                  id: 'analytics-calendar-charts',
                  path: `/units/${unitId}/analytics`,
                  ready: 'f-unit-analytics',
                },
              ]
            : [
                {
                  id: 'institution-settings',
                  path: '/admin/institution-settings',
                  ready: 'institution-settings',
                },
                {id: 'units-list', path: '/admin/units', ready: 'body'},
              ];
      for (const route of routes) {
        if (interrupted) break;
        const entry = {id: route.id, path: route.path, status: 'running'};
        check.routes.push(entry);
        try {
          await page.goto(`${base}${route.path}`, {waitUntil: 'domcontentloaded'});
          await page
            .getByRole('button', {name: 'Open account menu', exact: true})
            .waitFor({timeout: 90000});
          if (route.ready) await page.locator(route.ready).first().waitFor({timeout: 90000});
          await assertTheme(page, 'dark');
          if (role === 'chair' && route.id === 'unit-task-editor') {
            await page.getByRole('heading', {name: 'Planning Reflection', exact: true}).click();
            entry.sectionContrast = await page
              .locator('section[data-section-id="task-details"] h3')
              .evaluate((el) => {
                const foreground = getComputedStyle(el).color,
                  background = getComputedStyle(el.closest('section')).backgroundColor;
                const luminance = (color) => {
                  const rgb = color
                    .match(/[\d.]+/g)
                    .slice(0, 3)
                    .map(Number)
                    .map((v) => {
                      v /= 255;
                      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
                    });
                  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
                };
                const a = luminance(foreground),
                  b = luminance(background);
                return {
                  foreground,
                  background,
                  ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
                };
              });
            assert(
              entry.sectionContrast.ratio >= 4.5,
              `Editor heading contrast ${entry.sectionContrast.ratio}`,
            );
            await snapshot(page, `${name}-chair-selected-task-dark-after`);
            await page
              .getByRole('button', {name: 'Task Assessment Automation', exact: true})
              .click();
            await page.getByText('Disabled editor preview', {exact: false}).click();
            const editor = page.locator('.monaco-editor').first();
            await editor.waitFor({timeout: 60000});
            entry.editorBefore = await page.evaluate(() => ({
              classes: document.querySelector('.monaco-editor')?.className,
              models: window.monaco?.editor?.getModels().map((model) => ({
                id: model.id,
                version: model.getVersionId(),
                length: model.getValueLength(),
              })),
            }));
            await editor.screenshot({
              path: new URL(`${name}-chair-monaco-dark.png`, out).pathname,
              timeout: 20000,
            });
            await page.getByRole('button', {name: 'Switch to light theme', exact: true}).click();
            await assertTheme(page, 'light');
            await page.waitForFunction(
              () => document.querySelector('.monaco-editor')?.classList.contains('vs'),
              {},
              {timeout: 15000},
            );
            entry.editorAfter = await page.evaluate(() => ({
              classes: document.querySelector('.monaco-editor')?.className,
              models: window.monaco?.editor?.getModels().map((model) => ({
                id: model.id,
                version: model.getVersionId(),
                length: model.getValueLength(),
              })),
            }));
            assert.deepEqual(
              entry.editorAfter.models,
              entry.editorBefore.models,
              'Theme switch must preserve Monaco model identity/version/content length',
            );
            await editor.screenshot({
              path: new URL(`${name}-chair-monaco-light.png`, out).pathname,
              timeout: 20000,
            });
            await page.getByRole('button', {name: 'Switch to dark theme', exact: true}).click();
            await assertTheme(page, 'dark');
            entry.editorScope =
              'Opened disabled synthetic script; changed theme only; did not modify, save or execute code.';
          }
          if (route.id === 'analytics-calendar-charts') {
            await page.locator('mwl-calendar-week-view').waitFor({timeout: 60000});
            await page
              .getByRole('status', {name: 'Loading analytics', exact: true})
              .waitFor({state: 'hidden', timeout: 60000});
          }
          entry.surfaces = await page.evaluate(() => ({
            calendar: document.querySelectorAll('mwl-calendar-week-view').length,
            charts: document.querySelectorAll('ngx-charts-chart,.ngx-charts').length,
            monaco: document.querySelectorAll('.monaco-editor').length,
          }));
          if (route.id === 'analytics-calendar-charts') {
            entry.calendarHeader = await page
              .locator('.cal-day-headers')
              .first()
              .evaluate((el) => {
                const style = getComputedStyle(el),
                  foreground = style.color,
                  background = style.backgroundColor;
                const luminance = (color) => {
                  const rgb = color
                    .match(/[\d.]+/g)
                    .slice(0, 3)
                    .map(Number)
                    .map((v) => {
                      v /= 255;
                      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
                    });
                  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
                };
                const a = luminance(foreground),
                  b = luminance(background);
                return {
                  foreground,
                  background,
                  ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
                };
              });
            assert(
              entry.calendarHeader.ratio >= 4.5,
              `Calendar header contrast ${entry.calendarHeader.ratio}`,
            );
          }
          await snapshot(page, `${name}-${role}-${route.id}-dark-desktop`);
          await page.getByRole('button', {name: 'Switch to light theme', exact: true}).click();
          await assertTheme(page, 'light');
          await snapshot(page, `${name}-${role}-${route.id}-light-desktop`);
          await page.getByRole('button', {name: 'Switch to dark theme', exact: true}).click();
          await assertTheme(page, 'dark');
          await page.setViewportSize({width: 320, height: 640});
          entry.narrow = await page.evaluate(() => ({
            viewport: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
          }));
          await snapshot(page, `${name}-${role}-${route.id}-dark-320`);
          if (['analytics-calendar-charts', 'unit-task-editor'].includes(route.id))
            assert(
              entry.narrow.documentWidth <= 321,
              `Analytics controls exceed viewport: ${JSON.stringify(entry.narrow)}`,
            );
          await page.setViewportSize({width: 1280, height: 900});
          entry.status = 'passed';
        } catch (error) {
          entry.status = 'failed';
          entry.error = sanitise(error.stack);
          await snapshot(page, `${name}-${role}-${route.id}-failure`).catch(() => {});
        }
        await save();
      }
      check.status = check.routes.some((route) => route.status === 'failed') ? 'failed' : 'passed';
    } catch (error) {
      check.status = 'failed';
      check.error = sanitise(error.stack);
      await snapshot(page, `${name}-${role}-failure`).catch(() => {});
    }
    await context.close();
    await save();
  }
}

async function pdfSurface(browser, name, result) {
  const fixtures = JSON.parse(await readFile(process.env.CLOSURE_QA_FIXTURES, 'utf8'));
  const context = await browser.newContext({
    viewport: {width: 1280, height: 900},
    colorScheme: 'light',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(90000);
  const check = {id: 'real-task-sheet-pdf-theme', status: 'running'};
  result.checks.push(check);
  try {
    await login(page, fixtures.themeStudent);
    await profile(page);
    await choosePreference(page, 'dark');
    await page.goto(`${base}/projects/${fixtures.themeStudent.projectId}/dashboard/1.2P/feedback`, {
      waitUntil: 'domcontentloaded',
    });
    await page.getByRole('tab', {name: 'Task Sheet', exact: true}).click();
    await page.locator('f-pdf-viewer').waitFor({timeout: 60000});
    await page.locator('f-pdf-viewer canvas').first().waitFor({timeout: 60000});
    await assertTheme(page, 'dark');
    check.renderedCanvases = await page.locator('f-pdf-viewer canvas').count();
    check.chrome = await page.locator('f-pdf-viewer').evaluate((el) => ({
      background: getComputedStyle(el).backgroundColor,
      color: getComputedStyle(el).color,
    }));
    await snapshot(page, `${name}-task-sheet-pdf-dark-desktop`);
    await page.getByRole('button', {name: 'Switch to light theme', exact: true}).click();
    await assertTheme(page, 'light');
    await snapshot(page, `${name}-task-sheet-pdf-light-desktop`);
    await page.getByRole('button', {name: 'Switch to dark theme', exact: true}).click();
    await assertTheme(page, 'dark');
    await page.setViewportSize({width: 320, height: 640});
    await snapshot(page, `${name}-task-sheet-pdf-dark-320`);
    check.narrow = await page.evaluate(() => ({
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    }));
    check.status = 'passed';
  } catch (error) {
    check.status = 'failed';
    check.error = sanitise(error.stack);
    await snapshot(page, `${name}-task-sheet-pdf-failure`).catch(() => {});
  }
  await context.close();
}

for (const [name, engine, options] of engines) {
  if (interrupted) break;
  if (selected && !selected.includes(name)) continue;
  const result = {browser: name, status: 'running', checks: []};
  results.push(result);
  const firefoxData =
    name === 'firefox' ? await mkdtemp(join(tmpdir(), 'ontrack-closure-firefox-')) : null;
  if (firefoxData) await mkdir(join(firefoxData, 'local'));
  let browser;
  try {
    browser = await engine.launch({
      headless: true,
      ...options,
      ...(firefoxData
        ? {
            env: {
              ...process.env,
              MOZ_APP_DATA: firefoxData,
              MOZ_LOCAL_APP_DATA: join(firefoxData, 'local'),
            },
          }
        : {}),
    });
    result.version = browser.version();
    result.executable = options.channel || engine.executablePath();
    if (stage === 'discovery') result.checks.push({id: 'launch', status: 'passed'});
    else if (stage === 'signed-out') await signedOut(browser, name, result);
    else if (stage === 'authenticated') await authenticated(browser, name, result);
    else if (stage === 'staff') await staff(browser, name, result);
    else if (stage === 'pdf') await pdfSurface(browser, name, result);
    else throw new Error(`Unknown stage: ${stage}`);
    result.status = interrupted
      ? 'interrupted'
      : result.checks.some((check) => check.status === 'failed')
        ? 'failed'
        : 'passed';
  } catch (error) {
    result.status = 'blocked';
    result.error = sanitise(error.message).split('\n').slice(0, 3).join('\n');
  } finally {
    await browser?.close();
    if (firefoxData) await rm(firefoxData, {recursive: true, force: true});
    await save();
    console.log(JSON.stringify(result));
  }
}

if (results.some((result) => ['failed', 'blocked', 'interrupted'].includes(result.status)))
  process.exitCode = 1;
