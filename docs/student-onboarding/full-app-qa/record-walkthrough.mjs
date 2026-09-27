// Optional Playwright QA tooling; not a production dependency.
const {chromium, firefox} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import {mkdir, mkdtemp, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const base = process.env.TUTORIAL_QA_URL || 'http://127.0.0.1:4320';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) {
  throw new Error('Recording is restricted to a loopback acceptance environment.');
}
if (!process.env.TUTORIAL_CREDENTIALS) throw new Error('Set TUTORIAL_CREDENTIALS to a private local fixture file.');
const credentials = JSON.parse(await readFile(process.env.TUTORIAL_CREDENTIALS, 'utf8'));
const account = credentials.enrolled_student;
const output = new URL('./evidence/', import.meta.url);
await mkdir(output, {recursive: true});
const browserName = process.env.TUTORIAL_BROWSER || 'chrome';
if (!['chrome', 'edge', 'firefox'].includes(browserName)) throw new Error('Unsupported QA browser.');
const record = process.env.TUTORIAL_RECORD !== '0';
// Disposable Firefox app-data avoids the macOS protected default directory.
// https://bugzilla.mozilla.org/show_bug.cgi?id=2060476#c7
const firefoxData = browserName === 'firefox' ? await mkdtemp(join(tmpdir(), 'ontrack-full-app-firefox-')) : null;
if (firefoxData) await mkdir(join(firefoxData, 'local'));
const browser = browserName === 'firefox'
  ? await firefox.launch({headless: true, env: {...process.env, MOZ_APP_DATA: firefoxData, MOZ_LOCAL_APP_DATA: join(firefoxData, 'local')}})
  : await chromium.launch({channel: browserName === 'edge' ? 'msedge' : 'chrome', headless: true});
const context = await browser.newContext({
  viewport: {width: 1280, height: 800},
  ...(record ? {recordVideo: {dir: fileURLToPath(output), size: {width: 1280, height: 800}}} : {}),
});
const checks = [];
const errors = [];
let video;
const started = Date.now();
const chapters = [];
const webSource = process.env.TUTORIAL_WEB_SOURCE;
const apiSource = process.env.TUTORIAL_API_SOURCE;
if (!webSource || !apiSource) throw new Error('Set the exact TUTORIAL_WEB_SOURCE and TUTORIAL_API_SOURCE commits.');
const date = new Date().toISOString().slice(0, 10);
try {
  // Authenticate the disposable context before any recorded page exists. This
  // uses the real API and cookie flow, without filming or saving credentials.
  const login = await context.request.post(`${base}/api/auth`, {
    data: {username: account.username, password: account.password, remember: true},
  });
  assert.equal(login.status(), 201);
  const page = await context.newPage();
  video = page.video();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/home`);
  await page.getByRole('button', {name: 'Open account menu', exact: true}).waitFor();
  async function caption(message, hold = 1800) {
    if (!record) return;
    chapters.push({secondsSinceAutomationStart: Math.round((Date.now() - started) / 100) / 10, message});
    await page.evaluate(({message, date, webSource, apiSource}) => {
      let note = document.getElementById('qa-recording-caption');
      if (!note) {
        note = document.createElement('aside');
        note.id = 'qa-recording-caption';
        note.setAttribute('aria-hidden', 'true');
        note.style.cssText = 'position:fixed;bottom:16px;left:16px;width:690px;box-sizing:border-box;padding:14px;border:2px solid #172033;border-radius:8px;background:#fff;color:#172033;z-index:3000;pointer-events:none;font:16px/1.4 sans-serif;';
        document.body.append(note);
      }
      note.textContent = `OnTrack tutorial v1 | ${date} | Synthetic full application\n${message}\nWeb ${webSource} · API ${apiSource} · Automated recording; human review pending`;
      note.style.whiteSpace = 'pre-line';
    }, {message, date, webSource, apiSource});
    await page.waitForTimeout(hold); // Deliberate reading time in a silent guide.
  }
  await caption('Open the account menu and choose Tutorial and Help to replay at any time.');
  await page.getByRole('button', {name: 'Open account menu', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Tutorial and Help', exact: true}).click();
  const panel = page.getByRole('dialog', {name: 'Welcome to OnTrack'});
  await panel.waitFor();
  await caption('Welcome: start the optional guide, skip for now, or close it.');
  if (record) await page.screenshot({path: fileURLToPath(new URL('full-app-welcome.png', output))});
  await writeFile(new URL(`${browserName}-full-app-welcome-aria.txt`, output), await panel.ariaSnapshot());
  await panel.getByRole('button', {name: 'Start tutorial', exact: true}).click();
  let step = page.getByRole('dialog');
  await step.getByRole('heading', {name: 'Choose Your Unit', exact: true}).waitFor();
  await caption('1 of 4: choose your unit yourself. The tutorial never selects a unit for you.');
  await page.locator('[data-onboarding-target="unit-selector"]').click();
  await page.getByRole('menuitem').filter({hasText: 'Synthetic Migration Acceptance'}).click();
  await page.waitForURL(`**/projects/${account.project_id}/dashboard`);
  await page.locator('[data-onboarding-target="target-grade"]').waitFor();
  checks.push('actual unit selector navigates to the seeded student dashboard');
  await step.getByRole('button', {name: 'Next', exact: true}).click();
  await step.getByRole('heading', {name: 'Find Your Tasks', exact: true}).waitFor();
  await caption('2 of 4: find task navigation on your unit dashboard.');
  assert(await page.locator('[data-onboarding-target="task-dashboard"]').isVisible());
  if (record) await page.screenshot({path: fileURLToPath(new URL('full-app-tasks.png', output))});
  await step.getByRole('button', {name: 'Next', exact: true}).click();
  await step.getByRole('heading', {name: 'Check Your Target Grade', exact: true}).waitFor();
  await step.getByRole('button', {name: 'Find target grade', exact: true}).click();
  await caption('3 of 4: locate Select Target Grade. Reading the guide does not change your grade.');
  if (record) await page.screenshot({path: fileURLToPath(new URL('full-app-target-grade.png', output))});
  await step.getByRole('button', {name: 'Next', exact: true}).click();
  await step.getByRole('heading', {name: 'Use the Calendar', exact: true}).waitFor();
  await step.getByRole('button', {name: 'Find Calendar', exact: true}).click();
  await caption('4 of 4: find Calendar options. The tutorial creates no subscription.');
  await writeFile(new URL(`${browserName}-full-app-step-aria.txt`, output), await step.ariaSnapshot());
  if (record) await page.screenshot({path: fileURLToPath(new URL('full-app-calendar.png', output))});
  await step.getByRole('button', {name: 'Finish', exact: true}).click();
  await step.getByRole('heading', {name: 'Tutorial complete', exact: true}).waitFor();
  await caption('Finish closes the guide. The written tutorial remains available from every panel.');
  await step.getByRole('button', {name: 'Finish', exact: true}).click();
  await step.waitFor({state: 'detached'});
  checks.push('all four production steps and completion work against actual API data');
  await page.getByRole('button', {name: 'Open account menu', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Tutorial and Help', exact: true}).click();
  await page.getByRole('dialog').getByRole('heading', {name: 'Welcome to OnTrack', exact: true}).waitFor();
  await caption('Replay is always available for eligible students while the institution switch is on.');
  await page.getByRole('dialog').getByRole('button', {name: 'Close', exact: true}).click();
  assert.equal(await page.getByRole('button', {name: 'Open account menu', exact: true}).evaluate(element => element === document.activeElement), true);
  checks.push('replay closes and returns focus to the real account-menu trigger');
  await caption('Synthetic data only. This recording is a draft pending a second human review.', 2000);
  assert.deepEqual(errors, []);
  await writeFile(new URL(record ? 'walkthrough-result.json' : `${browserName}-full-app-result.json`, output), JSON.stringify({
    date, webSource, apiSource, tutorialVersion: 1, browser: browserName, browserVersion: browser.version(),
    viewport: {width: 1280, height: 800}, result: 'passed', checks, pageErrors: errors,
    capture: record ? 'headless Playwright recording of full application; caption overlay only' : 'headless Playwright check of full application',
    secondHumanReview: 'pending',
  }, null, 2));
  if (record) await writeFile(new URL('walkthrough-automation-timeline.json', output), JSON.stringify(chapters, null, 2));
} finally {
  await context.close();
  if (video) await rename(await video.path(), new URL(`tutorial-v1-${date.replaceAll('-', '')}-full-app.webm`, output));
  await browser.close();
  if (firefoxData) await rm(firefoxData, {recursive: true, force: true});
}
