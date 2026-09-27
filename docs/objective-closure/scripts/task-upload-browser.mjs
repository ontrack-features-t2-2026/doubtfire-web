import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {isAbsolute, resolve, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

// Optional QA tooling: no Playwright dependency is added to the application.
const moduleName = process.env.CLOSURE_PLAYWRIGHT_MODULE || 'playwright';
const playwright = await import(
  isAbsolute(moduleName) ? pathToFileURL(moduleName).href : moduleName
);
const {chromium} = playwright.default || playwright;
assert(
  process.env.CLOSURE_QA_FIXTURES,
  'Set CLOSURE_QA_FIXTURES to a private synthetic-account JSON file.',
);
const data = JSON.parse(await readFile(resolve(process.env.CLOSURE_QA_FIXTURES), 'utf8'));
const out = pathToFileURL(resolve(process.env.CLOSURE_QA_OUTPUT || 'qa-output') + sep);
const samples = new URL('../samples/', import.meta.url);
await mkdir(out, {recursive: true, mode: 0o700});
const base = (process.env.CLOSURE_QA_URL || 'http://127.0.0.1:4311').replace(/\/$/, '');
const stage = process.env.TASK_UPLOAD_STAGE || 'inspect-student';
assert(
  [
    'inspect-student',
    'inspect-chair',
    'verify-chair',
    'chair-footer-fix',
    'submit-spreadsheet',
    'verify-submission-history',
  ].includes(stage),
  'Unknown TASK_UPLOAD_STAGE.',
);
const account = stage.includes('chair') ? data.chair : data.uploadStudent;
assert(
  typeof account?.username === 'string' &&
    account.username.length > 0 &&
    typeof account?.password === 'string' &&
    account.password.length > 0,
  'The selected synthetic role needs a username and password.',
);
const browser = await chromium.launch({channel: 'chrome', headless: true});
const context = await browser.newContext({
  viewport: {width: 1440, height: 900},
  acceptDownloads: true,
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(45000);
page.setDefaultNavigationTimeout(90000);
const result = {
  stage,
  recordedAt: new Date().toISOString(),
  browser: 'Chrome ' + browser.version(),
  webRevision: process.env.CLOSURE_WEB_SHA || 'unrecorded',
  apiRevision: process.env.CLOSURE_API_SHA || 'unrecorded',
  revisionScope:
    'Caller-supplied revision metadata; the harness does not verify the running source.',
  scope:
    'Real local Angular application and synthetic backend; automated browser/AX/keyboard check, not human usability or screen-reader observation.',
  checks: [],
};
const safe = (e) =>
  String(e)
    .replaceAll(account.password, '[redacted]')
    .replace(/([?&](?:auth_token|token|password)=)[^&\s]+/gi, '$1[redacted]');
const capture = async (name) => {
  await writeFile(new URL(name + '-aria.txt', out), await page.locator('body').ariaSnapshot());
  await page.screenshot({
    path: fileURLToPath(new URL(name + '.png', out)),
    fullPage: true,
    timeout: 20000,
  });
};
try {
  await page.goto(base + '/sign_in');
  await page.getByLabel('Username', {exact: true}).fill(account.username);
  await page.getByLabel('Password', {exact: true}).fill(account.password);
  await page.getByRole('button', {name: 'Sign In', exact: true}).click();
  await page
    .getByRole('button', {name: 'Open account menu', exact: true})
    .waitFor({timeout: 90000});
  if (stage.includes('chair')) {
    await page.goto(base + `/units/${data.unitId}/admin/tasks`);
    await page.getByRole('heading', {name: 'Spreadsheet Investigation', exact: true}).click();
    await page.locator('f-task-definition-editor').waitFor();
    if (stage === 'verify-chair' || stage === 'chair-footer-fix') {
      const table = page.getByRole('table', {name: 'Task upload requirements', exact: true});
      const filename = table.getByRole('textbox', {
        name: 'Filename for upload requirement 1',
        exact: true,
      });
      assert.equal(await filename.inputValue(), 'Analysis Spreadsheet');
      const type = table.getByRole('combobox', {
        name: 'File type for Analysis Spreadsheet',
        exact: true,
      });
      const history = table.getByRole('checkbox', {
        name: 'Retain Analysis Spreadsheet in submission history',
        exact: true,
      });
      assert.equal(await history.isChecked(), true);
      assert(
        await table
          .getByRole('button', {
            name: 'Delete upload requirement Analysis Spreadsheet',
            exact: true,
          })
          .count(),
      );
      assert(
        await table.getByRole('button', {name: 'Add upload requirement', exact: true}).count(),
      );
      let definitionWrites = 0;
      page.on('request', (r) => {
        if (
          ['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method()) &&
          new URL(r.url()).pathname.includes('task_definitions')
        )
          definitionWrites++;
      });
      await filename.focus();
      await page.keyboard.press('Tab');
      assert.equal(await type.evaluate((el) => el === document.activeElement), true);
      await page.keyboard.press('Space');
      await page.getByRole('option', {name: 'Code', exact: true}).waitFor();
      await page.keyboard.press('Home');
      await page.keyboard.press('Enter');
      assert.equal((await type.innerText()).trim(), 'Code');
      await type.focus();
      await page.keyboard.press('Space');
      await page.keyboard.press('Home');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      assert.equal((await type.innerText()).trim(), 'Spreadsheet (CSV, XLS, XLSX)');
      await history.focus();
      await page.keyboard.press('Space');
      assert.equal(await history.isChecked(), false);
      await page.keyboard.press('Space');
      assert.equal(await history.isChecked(), true);
      assert.equal(definitionWrites, 0);
      result.checks.push({
        id: 'chair-accessible-names-and-native-keyboard-category',
        status: 'passed',
        categoryRestored: 'Spreadsheet (CSV, XLS, XLSX)',
        historyRestored: true,
        definitionWrites,
      });
      await table.scrollIntoViewIfNeeded();
      const evidenceName =
        stage === 'chair-footer-fix'
          ? 'chair-requirement-controls-footer-fixed'
          : 'chair-requirement-controls';
      if (stage === 'chair-footer-fix') {
        await page.waitForFunction(() => {
          const e = document.querySelector('f-task-definition-upload mat-toolbar');
          return e && getComputedStyle(e).backgroundColor !== 'rgb(255, 255, 255)';
        });
        const appearance = await table.evaluate((el) => {
          const toolbar = el.querySelector('mat-toolbar'),
            button = toolbar.querySelector('button'),
            probe = document.createElement('span');
          probe.style.backgroundColor = 'var(--ot-color-surface)';
          toolbar.append(probe);
          const semantic = getComputedStyle(probe).backgroundColor;
          probe.remove();
          const style = getComputedStyle(toolbar),
            bs = getComputedStyle(button);
          const luminance = (color) =>
            color
              .match(/[\d.]+/g)
              .slice(0, 3)
              .map(Number)
              .map((v) => {
                v /= 255;
                return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
              })
              .reduce((v, c, i) => v + c * [0.2126, 0.7152, 0.0722][i], 0);
          const contrast = (a, b) => {
            const x = luminance(a),
              y = luminance(b);
            return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
          };
          return {
            theme: document.documentElement.dataset.otTheme,
            semanticSurface: semantic,
            footer: {
              background: style.backgroundColor,
              foreground: style.color,
              contrast: contrast(style.color, style.backgroundColor),
            },
            addButton: {
              background: bs.backgroundColor,
              foreground: bs.color,
              contrast: contrast(bs.color, bs.backgroundColor),
            },
          };
        });
        assert.equal(appearance.theme, 'dark');
        assert.equal(appearance.footer.background, appearance.semanticSurface);
        assert(appearance.footer.contrast >= 4.5);
        assert(appearance.addButton.contrast >= 4.5);
        result.checks.push({
          id: 'dark-footer-uses-semantic-surface-and-readable-text',
          status: 'passed',
          ...appearance,
        });
      }
      await writeFile(new URL(evidenceName + '-aria.txt', out), await table.ariaSnapshot());
      await table.screenshot({path: fileURLToPath(new URL(evidenceName + '.png', out))});
      await page.reload();
      await page.getByRole('heading', {name: 'Spreadsheet Investigation', exact: true}).click();
      assert.equal(
        (
          await page
            .getByRole('combobox', {name: 'File type for Analysis Spreadsheet', exact: true})
            .innerText()
        ).trim(),
        'Spreadsheet (CSV, XLS, XLSX)',
      );
      result.checks.push({id: 'chair-fixture-remains-unchanged-after-reload', status: 'passed'});
    } else {
      await capture(stage);
      console.log((await page.locator('body').ariaSnapshot()).slice(-18000));
    }
  } else {
    await page.goto(
      base + `/projects/${account.projectId}/dashboard/${account.taskAbbreviation}/feedback`,
    );
    await page.locator('#textField').waitFor();
    if (stage === 'submit-spreadsheet') {
      await page.getByRole('button', {name: 'Upload Submission', exact: true}).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('heading', {name: /Submit 1.1P/}).waitFor();
      await capture('student-requirements-before-selection');
      const guidance = await dialog.locator('f-task-upload-requirements').innerText();
      assert(/CSV/.test(guidance) && /XLSX/.test(guidance), 'Spreadsheet guidance missing');
      let submissionRequests = 0;
      page.on('request', (r) => {
        if (r.method() === 'POST' && new URL(r.url()).pathname.endsWith('/submission'))
          submissionRequests++;
      });
      const file = dialog.locator('input[type=file]').first();
      await file.setInputFiles(fileURLToPath(new URL('excluded.exe', samples)));
      await dialog.getByText('Invalid file provided', {exact: true}).waitFor();
      assert.equal(submissionRequests, 0);
      result.checks.push({
        id: 'incompatible-task-file-rejected-before-upload',
        status: 'passed',
        requests: 0,
      });
      await capture('student-rejected-executable');
      await file.setInputFiles(fileURLToPath(new URL('scores.xlsx', samples)));
      await dialog.getByText('scores.xlsx', {exact: true}).waitFor();
      if (await dialog.getByRole('button', {name: 'Next', exact: true}).count())
        await dialog.getByRole('button', {name: 'Next', exact: true}).click();
      const submit = dialog.getByRole('button', {name: 'Upload Submission', exact: true});
      await submit.waitFor();
      assert.equal(await submit.isEnabled(), true);
      await capture('student-spreadsheet-ready');
      const responsePromise = page.waitForResponse(
        (r) => r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith('/submission'),
        {timeout: 90000},
      );
      await submit.click();
      const response = await responsePromise;
      assert(response.ok(), 'Submission HTTP ' + response.status());
      result.checks.push({
        id: 'real-ui-spreadsheet-submission-queued',
        status: 'passed',
        httpStatus: response.status(),
        fixture: 'scores.xlsx',
        taskAlias: 'uploadStudent/1.1P',
      });
      await capture('student-submission-queued');
      console.log('UI_SUBMISSION_QUEUED HTTP', response.status());
    } else if (stage === 'verify-submission-history') {
      const history = page.locator('f-previous-submissions');
      await history.getByText('Current submission', {exact: true}).waitFor();
      await history.getByText(/Archive file: submission-/).waitFor();
      const row = history.locator('li').first();
      assert.match(await row.innerText(), /Current submission/);
      const button = row.getByRole('button', {name: /Download archived submission/});
      await button.waitFor();
      const responsePromise = page
        .waitForResponse(
          (r) =>
            r.request().method() === 'GET' &&
            /submission_histories.*files|submission_history.*files/.test(new URL(r.url()).pathname),
          {timeout: 10000},
        )
        .catch(() => null);
      const dl = page.waitForEvent('download');
      await button.click();
      const download = await dl;
      const target = fileURLToPath(new URL('student-retained-submission.zip', out));
      await download.saveAs(target);
      const original = await readFile(new URL('scores.xlsx', samples));
      const expected = createHash('sha256').update(original).digest('hex');
      const zipInfo = JSON.parse(
        execFileSync(
          'python3',
          [
            '-c',
            `import hashlib,json,zipfile,sys
z=zipfile.ZipFile(sys.argv[1]);files=[n for n in z.namelist() if n.lower().endswith('.xlsx')];assert len(files)==1, 'Expected one retained spreadsheet';b=z.read(files[0]);print(json.dumps({'entry':files[0].rsplit('/',1)[-1],'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}))`,
            target,
          ],
          {encoding: 'utf8'},
        ),
      );
      assert.equal(zipInfo.sha256, expected);
      assert.equal(zipInfo.bytes, original.length);
      assert.match(download.suggestedFilename(), /^submission-\d+\.zip$/);
      const status = page.locator('f-task-status-card');
      assert.match(await status.innerText(), /Awaiting Feedback/i);
      await capture('student-completed-history');
      result.checks.push({
        id: 'live-ui-completed-status-and-history-download',
        status: 'passed',
        taskState: 'Awaiting Feedback',
        historyCurrent: true,
        downloadFilename: download.suggestedFilename(),
        retained: zipInfo,
        originalSha256: expected,
        byteIdentical: true,
      });
      await responsePromise;
    } else {
      await capture(stage);
      console.log((await page.locator('body').ariaSnapshot()).slice(-18000));
    }
  }
  result.status = 'passed';
} catch (e) {
  result.status = 'failed';
  result.error = safe(e.message);
  await capture(stage + '-failed').catch(() => {});
  console.log(result.error);
} finally {
  await writeFile(new URL(stage + '-result.json', out), JSON.stringify(result, null, 2));
  await browser.close();
  if (result.status === 'failed') process.exitCode = 1;
}
