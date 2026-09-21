// Playwright is optional QA tooling; no production dependency is added.
const {chromium, firefox, webkit} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const output = new URL('./evidence/', import.meta.url);
await mkdir(output, {recursive: true});
const base = process.env.TUTORIAL_QA_URL || 'http://localhost:4317';
const selected = process.env.TUTORIAL_QA_BROWSERS?.split(',');
const previous = selected ? JSON.parse(await readFile(new URL('results.json', output), 'utf8').catch(() => '[]')) : [];
const results = previous.filter((entry) => !selected?.includes(entry.browser));
const key = 'ontrack:student-onboarding:100001';
const engines = [
  ['chrome', chromium, {channel: 'chrome'}],
  ['edge', chromium, {channel: 'msedge'}],
  ['firefox', firefox, {}],
  ['webkit', webkit, {}],
];
for (const [name, engine, options] of engines) {
  if (selected && !selected.includes(name)) continue;
  // macOS Firefox can touch protected default app-data before reading -profile.
  // Give this check its own disposable app-data, without changing OS permissions.
  // https://bugzilla.mozilla.org/show_bug.cgi?id=2060476#c7
  const firefoxData = name === 'firefox' ? await mkdtemp(join(tmpdir(), 'ontrack-firefox-qa-')) : null;
  if (firefoxData) await mkdir(join(firefoxData, 'local'));
  let browser;
  try {
    browser = await engine.launch({headless: true, ...options, ...(firefoxData ? {env: {...process.env, MOZ_APP_DATA: firefoxData, MOZ_LOCAL_APP_DATA: join(firefoxData, 'local')}} : {})});
  } catch (error) {
    const result = {browser: name, result: 'blocked', checks: [], error: error.message.includes('Could not find profile folder') ? 'Browser failed before loading the application: Could not find profile folder.' : error.message.split('\n')[0]};
    results.push(result);
    await writeFile(new URL('results.json', output), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(result));
    if (firefoxData) await rm(firefoxData, {recursive: true, force: true});
    continue;
  }
  const context = await browser.newContext({viewport: {width: 1280, height: 900}, reducedMotion: 'reduce'});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const checks = [];
  try {
    await page.goto(base);
    await page.getByRole('button', {name: 'Complete profile setup', exact: true}).click();
    const panel = page.getByRole('dialog');
    await panel.getByRole('heading', {name: 'Welcome to OnTrack', exact: true}).waitFor();
    await panel.getByRole('link').focus();
    await page.keyboard.press('Tab');
    assert.equal(await panel.evaluate((element) => element.contains(document.activeElement)), true);
    checks.push('automatic offer after synthetic empty history and profile completion');
    checks.push('welcome Tab wraps within modal controls');
    await writeFile(new URL(`${name}-welcome-aria.txt`, output), await panel.ariaSnapshot());
    await page.screenshot({path: new URL(`${name}-welcome.png`, output).pathname});
    await panel.getByRole('button', {name: 'Start tutorial', exact: true}).click();
    await panel.getByRole('heading', {name: 'Choose Your Unit', exact: true}).waitFor();
    assert.equal(await panel.getAttribute('aria-modal'), null);
    await page.getByRole('button', {name: 'Select Unit (demo)', exact: true}).click();
    await page.waitForURL('**/projects/1/dashboard');
    await page.goBack();
    await panel.getByRole('heading', {name: 'Choose Your Unit', exact: true}).waitFor();
    checks.push('guided step allows underlying controls and browser Back');
    await panel.getByRole('button', {name: 'Next', exact: true}).focus();
    await page.keyboard.press('Escape');
    await panel.getByRole('heading', {name: 'Skip the tutorial?', exact: true}).waitFor();
    await page.keyboard.press('Escape');
    await panel.getByRole('heading', {name: 'Choose Your Unit', exact: true}).waitFor();
    checks.push('Escape opens confirmation and Escape returns to the guided step');
    for (const title of ['Find Your Tasks', 'Check Your Target Grade', 'Use the Calendar']) {
      await panel.getByRole('button', {name: 'Next', exact: true}).click();
      await panel.getByRole('heading', {name: title, exact: true}).waitFor();
    }
    await panel.getByRole('button', {name: 'Finish', exact: true}).click();
    await panel.getByRole('heading', {name: 'Tutorial complete', exact: true}).waitFor();
    await panel.getByRole('button', {name: 'Finish', exact: true}).click();
    await panel.waitFor({state: 'detached'});
    const stored = await page.evaluate((k) => localStorage.getItem(k), key);
    assert.equal(JSON.parse(stored).state, 'completed');
    checks.push('four steps and completion persist exact minimal schema');
    assert.deepEqual(Object.keys(JSON.parse(stored)).sort(), ['state', 'step', 'version']);
    await page.getByRole('button', {name: 'Tutorial and Help', exact: true}).click();
    await panel.getByRole('button', {name: 'Close', exact: true}).click();
    assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), stored);
    checks.push('manual replay preserves completed state');
    await page.setViewportSize({width: 320, height: 568});
    await page.getByRole('button', {name: 'Tutorial and Help', exact: true}).click();
    await panel.getByRole('button', {name: 'Start tutorial', exact: true}).click();
    const bounds = await panel.boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= 321 && bounds.y >= 0 && bounds.y + bounds.height <= 569);
    assert.equal(await panel.evaluate((element) => getComputedStyle(element).animationName), 'none');
    await page.screenshot({path: new URL(`${name}-320px.png`, output).pathname});
    await writeFile(new URL(`${name}-step-aria.txt`, output), await panel.ariaSnapshot());
    // Firefox considers the first line of this inline link visible, so its
    // protocol scroll/focus alone can leave the second line clipped. Exercise
    // actual keyboard navigation and scroll, then wait for settled geometry.
    await panel.getByRole('button', {name: 'Find unit selector', exact: true}).focus();
    // WebKit follows macOS's default Tab policy; Option+Tab includes links.
    await page.keyboard.press(name === 'webkit' ? 'Alt+Tab' : 'Tab');
    assert.equal(await panel.getByRole('link').evaluate((element) => element === document.activeElement), true);
    await page.keyboard.press('End');
    await page.waitForFunction(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const link = dialog?.querySelector('a');
      if (!dialog || !link) return false;
      const bounds = dialog.getBoundingClientRect();
      const rect = link.getBoundingClientRect();
      return Math.abs(dialog.scrollHeight - dialog.clientHeight - dialog.scrollTop) <= 1 &&
        rect.top >= bounds.top && rect.bottom <= bounds.bottom && rect.top >= 0 && rect.bottom <= innerHeight + 1;
    }, undefined, {timeout: 5000});
    const linkBounds = await panel.getByRole('link').evaluate((element) => element.getBoundingClientRect().toJSON());
    assert(linkBounds.y >= 0 && linkBounds.bottom <= 569, JSON.stringify(linkBounds));
    checks.push('320px panel stays within viewport; reduced-motion animation disabled');
    await panel.getByRole('button', {name: 'Close', exact: true}).click();
    await page.setViewportSize({width: 1280, height: 900});
    await page.evaluate(() => document.documentElement.style.zoom = '2');
    await page.getByRole('button', {name: 'Tutorial and Help', exact: true}).click();
    const zoomBounds = await panel.boundingBox();
    assert(zoomBounds.x >= 0 && zoomBounds.x + zoomBounds.width <= 1281 && zoomBounds.y >= 0 && zoomBounds.y + zoomBounds.height <= 901);
    await page.screenshot({path: new URL(`${name}-css-zoom-200.png`, output).pathname});
    checks.push('200% CSS zoom panel remains within viewport (not native browser zoom)');
    await panel.getByRole('button', {name: 'Close', exact: true}).click();
    await page.evaluate(() => document.documentElement.style.zoom = '');
    for (const query of ['disabled', 'role=Tutor', 'history', 'storageFailure', 'noUnits&missing']) {
      const scenario = await browser.newContext({viewport: {width: 390, height: 844}});
      const p = await scenario.newPage();
      p.on('pageerror', (error) => errors.push(`${query}: ${error.message}`));
      await p.goto(`${base}/?${query}`);
      await p.getByRole('button', {name: 'Complete profile setup', exact: true}).click();
      if (query === 'noUnits&missing') {
        await p.getByRole('button', {name: 'Start tutorial', exact: true}).click();
        await p.getByRole('button', {name: 'Next', exact: true}).click();
        await p.getByRole('button', {name: 'Next', exact: true}).click();
        await p.getByRole('dialog').getByText('No current unit is available.', {exact: false}).waitFor();
        await p.screenshot({path: new URL(`${name}-missing.png`, output).pathname});
        // The non-modal panel may cover this synthetic operator control at 390px.
        // Trigger a runtime setting change by keyboard, not a forced pointer click.
        await p.getByRole('button', {name: 'Disable tutorial', exact: true}).focus();
        await p.keyboard.press('Enter');
      }
      await p.getByRole('dialog').waitFor({state: 'detached'});
      if (query === 'history' || query === 'storageFailure') {
        await p.getByRole('button', {name: 'Tutorial and Help', exact: true}).click();
        await p.getByRole('dialog').getByRole('heading', {name: 'Welcome to OnTrack', exact: true}).waitFor();
        if (query === 'storageFailure') {
          await p.getByRole('dialog').getByText('Progress could not be saved in this browser.', {exact: false}).waitFor();
        }
        await p.getByRole('dialog').getByRole('button', {name: 'Close', exact: true}).click();
      }
      checks.push(`${query}: safe suppression/fallback`);
      await scenario.close();
    }
    const lifecycle = await browser.newContext({viewport: {width: 1280, height: 900}});
    const life = await lifecycle.newPage();
    life.on('pageerror', (error) => errors.push(`lifecycle: ${error.message}`));
    await life.goto(base);
    await life.getByRole('button', {name: 'Complete profile setup', exact: true}).click();
    const dialog = life.getByRole('dialog');
    await dialog.getByRole('button', {name: 'Start tutorial', exact: true}).click();
    await dialog.getByRole('button', {name: 'Next', exact: true}).click();
    await life.reload();
    await life.getByRole('button', {name: 'Complete profile setup', exact: true}).click();
    await dialog.getByRole('heading', {name: 'Find Your Tasks', exact: true}).waitFor();
    await dialog.getByRole('button', {name: 'Skip for now', exact: true}).click();
    await dialog.getByRole('button', {name: 'Skip tutorial', exact: true}).click();
    assert.equal(JSON.parse(await life.evaluate((k) => localStorage.getItem(k), key)).state, 'skipped');
    await life.reload();
    await life.getByRole('button', {name: 'Complete profile setup', exact: true}).click();
    await dialog.getByRole('heading', {name: 'Welcome to OnTrack', exact: true}).waitFor();
    await dialog.getByRole('button', {name: 'Skip for now', exact: true}).click();
    await dialog.getByRole('button', {name: 'Do not show automatically again', exact: true}).click();
    const dismissed = await life.evaluate((k) => localStorage.getItem(k), key);
    assert.equal(JSON.parse(dismissed).state, 'dismissed');
    await life.reload();
    await life.getByRole('button', {name: 'Complete profile setup', exact: true}).click();
    await dialog.waitFor({state: 'detached'});
    await life.getByRole('button', {name: 'Tutorial and Help', exact: true}).click();
    await dialog.getByRole('button', {name: 'Close', exact: true}).click();
    assert.equal(await life.evaluate((k) => localStorage.getItem(k), key), dismissed);
    checks.push('reload resumes; skip reoffers next reload; permanent dismissal survives replay');
    await lifecycle.close();
    const darkContext = await browser.newContext({viewport: {width: 1280, height: 900}, colorScheme: 'dark'});
    const dark = await darkContext.newPage();
    dark.on('pageerror', (error) => errors.push(`dark: ${error.message}`));
    await dark.goto(base);
    await dark.getByRole('button', {name: 'Complete profile setup', exact: true}).click();
    await dark.getByRole('dialog').getByRole('heading', {name: 'Welcome to OnTrack', exact: true}).waitFor();
    assert.equal(await dark.locator('html').getAttribute('data-ot-theme'), 'dark');
    await dark.screenshot({path: new URL(`${name}-dark-welcome.png`, output).pathname});
    checks.push('real pre-boot theme marker selects dark theme; screenshot captured');
    await darkContext.close();
    assert.deepEqual(errors, []);
    results.push({browser: name, version: browser.version(), result: 'passed', checks});
  } catch (error) {
    await page.screenshot({path: new URL(`${name}-failure.png`, output).pathname});
    results.push({browser: name, version: browser.version(), result: 'failed', checks, error: error.stack, errors});
  } finally {
    await browser.close();
    if (firefoxData) await rm(firefoxData, {recursive: true, force: true});
  }
  await writeFile(new URL('results.json', output), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.at(-1)));
}
if (results.some((result) => result.result !== 'passed')) process.exitCode = 1;
