import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve, sep} from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium, firefox, webkit} = await import(
  process.env.CLOSURE_PLAYWRIGHT_MODULE || 'playwright'
);

const root = new URL('../', import.meta.url);
const base = process.env.CLOSURE_QA_URL || 'http://127.0.0.1:4311';
if (!process.env.CLOSURE_QA_FIXTURES)
  throw new Error('Set CLOSURE_QA_FIXTURES to a private synthetic fixture JSON file.');
const fixture = JSON.parse(await readFile(process.env.CLOSURE_QA_FIXTURES, 'utf8'));
const account = fixture.uploadStudent;
const out = pathToFileURL(resolve(process.env.CLOSURE_QA_OUTPUT || 'qa-output') + sep);
await mkdir(out, {recursive: true});
const selected = (process.env.CLOSURE_UPLOAD_BROWSERS || 'chrome').split(',');
const selectedChecks = process.env.CLOSURE_UPLOAD_CHECKS?.split(',');
const results = [];
for (const name of selected) {
  const result = {
    browser: name,
    checks: [],
    selectedChecks: selectedChecks || 'all',
    errors: [],
    testedWeb: process.env.CLOSURE_WEB_SHA || 'UNRECORDED',
    testedApi: process.env.CLOSURE_API_SHA || fixture.source_sha || 'UNRECORDED',
  };
  results.push(result);
  const save = () =>
    writeFile(new URL(`results-${name}.json`, out), JSON.stringify(result, null, 2));
  const firefoxData =
    name === 'firefox' ? await mkdtemp(join(tmpdir(), 'ontrack-upload-firefox-')) : null;
  if (firefoxData) await mkdir(join(firefoxData, 'local'));
  const engine = name === 'firefox' ? firefox : name === 'webkit' ? webkit : chromium;
  const browser = await engine.launch({
    headless: true,
    ...(name === 'chrome' ? {channel: 'chrome'} : {}),
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
  const context = await browser.newContext({
    viewport: {width: 1440, height: 900},
    acceptDownloads: true,
    reducedMotion: 'reduce',
    ...(process.env.CLOSURE_UPLOAD_VIDEO === '1'
      ? {recordVideo: {dir: new URL('video/', out).pathname, size: {width: 1280, height: 800}}}
      : {}),
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  page.on('pageerror', (e) => result.errors.push(e.message));
  let postCount = 0;
  const downloads = new Map();
  page.on('response', (response) => {
    if (
      response.request().method() === 'GET' &&
      /\/comments\/\d+$/.test(new URL(response.url()).pathname)
    )
      downloads.set(new URL(response.url()).pathname, response);
  });
  page.on('request', (r) => {
    if (r.method() === 'POST' && /\/comments\/?$/.test(new URL(r.url()).pathname)) postCount++;
  });
  const check = async (id, action) => {
    if (selectedChecks && !selectedChecks.includes(id)) return;
    console.log(name, id);
    try {
      const details = await action();
      result.checks.push({id, status: 'passed', ...details});
    } catch (e) {
      result.checks.push({id, status: 'failed', error: e.message.slice(0, 1800)});
      await page
        .screenshot({path: new URL(`${name}-${id}-failed.png`, out).pathname, timeout: 10000})
        .catch(() => {});
      for (let n = 0; n < 8 && (await page.getByRole('dialog').count()); n++) {
        await page
          .getByRole('dialog')
          .last()
          .getByRole('button', {name: 'Cancel', exact: true})
          .click({timeout: 3000, force: true})
          .catch(() => {});
      }
    }
    await save();
  };
  const capture = async (id) => {
    await writeFile(
      new URL(`${name}-${id}-aria.txt`, out),
      await page.locator('body').ariaSnapshot(),
    );
    await page.screenshot({path: new URL(`${name}-${id}.png`, out).pathname, timeout: 20000});
  };
  try {
    console.log(name, 'login');
    await page.goto(`${base}/sign_in`);
    await page.getByLabel('Username', {exact: true}).fill(account.username);
    await page.getByLabel('Password', {exact: true}).fill(account.password);
    await page.getByRole('button', {name: 'Sign In', exact: true}).click();
    await page.waitForURL((url) => !url.pathname.includes('sign_in'), {timeout: 60000});
    await page.goto(
      `${base}/projects/${account.projectId}/dashboard/${account.taskAbbreviation}/feedback`,
    );
    const composer = page.locator('task-comment-composer');
    const editor = page.locator('#textField');
    await editor.waitFor({state: 'visible', timeout: 60000});
    await page.waitForFunction(
      () => {
        const b = document.querySelector('button[aria-label="Attach a file"]');
        return b && !b.disabled;
      },
      undefined,
      {timeout: 60000},
    );
    const input = composer.locator('input[type=file]');
    await input.waitFor({state: 'attached'});
    const chooseFile = async (files) => {
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.getByRole('button', {name: 'Attach a file', exact: true}).click(),
      ]);
      await chooser.setFiles(files);
    };
    const dialog = page.getByRole('dialog');
    const draft = 'Synthetic review draft — preserved through attachment checks.';
    await editor.fill(draft);
    await editor.blur();
    await check('composer-accessible-name-and-emoji-keyboard', async () => {
      assert.equal(await editor.getAttribute('role'), 'textbox');
      assert.equal(await editor.getAttribute('aria-label'), 'Task comment');
      const emoji = page.getByRole('button', {name: 'Emoji picker button', exact: true});
      await emoji.focus();
      await page.keyboard.press('Enter');
      assert.equal(await emoji.getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Enter');
      assert.equal(await emoji.getAttribute('aria-expanded'), 'false');
    });
    await check('cancel-preserves-draft-and-dialog-keyboard', async () => {
      await chooseFile(new URL('samples/scores.csv', root).pathname);
      await dialog.getByRole('heading', {name: 'Post Attachment?', exact: true}).waitFor();
      assert.equal(await dialog.count(), 1);
      await dialog.getByRole('button', {name: 'Cancel', exact: true}).focus();
      await page.keyboard.press('Tab');
      const tabTarget = await page.evaluate(() => document.activeElement.textContent.trim());
      if (name !== 'webkit') assert.equal(tabTarget, 'Post Attachment');
      await dialog.getByRole('button', {name: 'Cancel', exact: true}).focus();
      await page.keyboard.press('Enter');
      await dialog.waitFor({state: 'hidden'});
      assert.equal(await editor.innerText(), draft);
      return {
        nativeEnter: 'passed',
        tabOrder:
          name === 'webkit'
            ? 'WebKit platform Tab preference not certified; native Safari/manual check remains'
            : 'passed',
      };
    });
    for (const filename of [
      'scores.csv',
      'notes.docx',
      'scores.xlsx',
      'handout.pdf',
      'tone.wav',
      'screenshot.png',
    ]) {
      await check(
        `post-and-${/csv|docx|xlsx$/.test(filename) ? 'download' : 'view'}-${filename.replace('.', '-')}`,
        async () => {
          await chooseFile(new URL(`samples/${filename}`, root).pathname);
          await dialog.getByRole('heading', {name: 'Post Attachment?', exact: true}).waitFor();
          const responsePromise = page.waitForResponse(
            (r) =>
              r.request().method() === 'POST' && /\/comments\/?$/.test(new URL(r.url()).pathname),
          );
          await dialog.getByRole('button', {name: 'Post Attachment', exact: true}).click();
          const response = await responsePromise;
          assert.equal(response.status(), 201, await response.text());
          if (['handout.pdf', 'tone.wav', 'screenshot.png'].includes(filename)) {
            const comment = await response.json();
            const anchor = page.locator(`#comment-${comment.id}`);
            await anchor.waitFor();
            let keyboardFocus;
            if (filename.endsWith('.pdf') || filename.endsWith('.png')) {
              const label = filename.endsWith('.pdf')
                ? 'View PDF attachment'
                : 'View image attachment';
              const preview = anchor.getByRole('button', {name: label, exact: true});
              await preview.focus();
              if (name === 'webkit') {
                await page.keyboard.press('ArrowRight');
              } else {
                await page.keyboard.press('Shift+Tab');
                await page.keyboard.press('Tab');
                assert(await preview.evaluate((el) => el === document.activeElement));
              }
              keyboardFocus = await preview.evaluate((el) => {
                const style = getComputedStyle(el);
                return {
                  width: style.outlineWidth,
                  style: style.outlineStyle,
                  color: style.outlineColor,
                  textColor: style.color,
                };
              });
              assert.equal(keyboardFocus.width, '2px');
              assert.equal(keyboardFocus.style, 'solid');
              assert.equal(keyboardFocus.color, keyboardFocus.textColor);
            }
            if (filename.endsWith('.pdf'))
              await anchor
                .getByRole('button', {name: 'View PDF attachment', exact: true})
                .press('Enter');
            if (filename.endsWith('.wav')) await anchor.locator('audio-player button').click();
            const path = `/api/projects/${account.projectId}/task_def_id/${account.taskDefinitionId}/comments/${comment.id}`;
            for (let i = 0; i < 100 && !downloads.has(path); i++) await page.waitForTimeout(100);
            const downloaded = downloads.get(path);
            assert(downloaded, 'The existing viewer fetched the attachment');
            assert.equal(downloaded.status(), 200);
            const bytes = await downloaded.body();
            if (filename.endsWith('.pdf')) assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
            if (filename.endsWith('.wav')) {
              assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
              assert.equal(bytes.subarray(8, 12).toString(), 'WAVE');
            }
            if (filename.endsWith('.png')) {
              const img = anchor.getByRole('img', {name: 'Image attachment preview'});
              await img.waitFor();
              assert.equal(await img.evaluate((el) => el.naturalWidth), 160);
              assert.equal(await img.evaluate((el) => el.naturalHeight), 90);
              await anchor
                .getByRole('button', {name: 'View image attachment', exact: true})
                .press('Enter');
              await dialog.getByRole('img', {name: 'Image attachment', exact: true}).waitFor();
              await page.keyboard.press('Escape');
              await dialog.waitFor({state: 'hidden'});
            }
            if (filename.endsWith('.pdf')) {
              await page.keyboard.press('Escape');
              await dialog.waitFor({state: 'hidden'});
            }
            if (filename.endsWith('.wav')) await anchor.locator('audio-player button').click();
            assert.equal(await editor.innerText(), draft);
            return {
              httpStatus: 201,
              viewerFetchStatus: 200,
              keyboardFocus,
              viewerBytes: bytes.length,
              note: 'Legacy media is converted/compressed by the existing API; byte identity is intentionally asserted only for generic document/spreadsheet downloads.',
            };
          }
          const button = page
            .getByRole('button', {name: `Download ${filename}`, exact: true})
            .last();
          await button.waitFor();
          const downloadPromise = page.waitForEvent('download');
          await button.click();
          const download = await downloadPromise;
          const target = new URL(`${name}-${filename}`, out).pathname;
          await download.saveAs(target);
          assert.deepEqual(
            await readFile(target),
            await readFile(new URL(`samples/${filename}`, root)),
          );
          assert.equal(await editor.innerText(), draft);
          return {httpStatus: response.status(), downloadBytes: (await readFile(target)).length};
        },
      );
    }
    for (const filename of ['empty.csv', 'excluded.exe']) {
      await check(`reject-${filename.replace('.', '-')}-before-request`, async () => {
        const count = postCount;
        await chooseFile(new URL(`samples/${filename}`, root).pathname);
        await page.waitForTimeout(500);
        assert.equal(postCount, count);
        assert.equal(await dialog.count(), 0);
        assert.equal(await editor.innerText(), draft);
      });
    }
    await check('reject-exact-30mb-before-request', async () => {
      const count = postCount;
      await chooseFile({
        name: 'too-large.csv',
        mimeType: 'text/csv',
        buffer: Buffer.alloc(30_000_000, 65),
      });
      await page.waitForTimeout(500);
      assert.equal(postCount, count);
      assert.equal(await dialog.count(), 0);
      assert.equal(await editor.innerText(), draft);
    });
    await check('api-rejection-preserves-draft-and-valid-retry', async () => {
      await chooseFile(new URL('samples/spoofed.xlsx', root).pathname);
      await dialog.getByRole('heading', {name: 'Post Attachment?', exact: true}).waitFor();
      const bad = page.waitForResponse(
        (r) => r.request().method() === 'POST' && /\/comments\/?$/.test(new URL(r.url()).pathname),
      );
      await dialog.getByRole('button', {name: 'Post Attachment', exact: true}).click();
      assert.equal((await bad).status(), 403);
      assert.equal(await editor.innerText(), draft);
      await chooseFile({
        name: 'retry.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('value\n7\n'),
      });
      await dialog.getByRole('heading', {name: 'Post Attachment?', exact: true}).waitFor();
      const good = page.waitForResponse(
        (r) => r.request().method() === 'POST' && /\/comments\/?$/.test(new URL(r.url()).pathname),
      );
      await dialog.getByRole('button', {name: 'Post Attachment', exact: true}).click();
      assert.equal((await good).status(), 201);
      assert.equal(await editor.innerText(), draft);
      return {rejectionStatus: 403, retryStatus: 201};
    });
    await check('drop-shares-one-confirmation-and-cancel', async () => {
      const data = await page.evaluateHandle(() => {
        const d = new DataTransfer();
        d.items.add(new File(['value\n8\n'], 'dropped.csv', {type: 'text/csv'}));
        return d;
      });
      await page.locator('.comments-panel').dispatchEvent('drop', {dataTransfer: data});
      await dialog.getByRole('heading', {name: 'Post Attachment?', exact: true}).waitFor();
      assert.equal(await dialog.count(), 1);
      await dialog.getByRole('button', {name: 'Cancel', exact: true}).click();
      assert.equal(await editor.innerText(), draft);
    });
    await check('paste-shares-one-confirmation-and-cancel', async () => {
      const bytes = [...(await readFile(new URL('samples/screenshot.png', root)))];
      const supported = await editor.evaluate((el, values) => {
        const d = new DataTransfer();
        d.items.add(new File([new Uint8Array(values)], 'clipboard.png', {type: 'image/png'}));
        const event = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: d,
        });
        if (event.clipboardData?.files.length !== 1) return false;
        el.dispatchEvent(event);
        return true;
      }, bytes);
      if (!supported)
        return {
          status: 'not-run',
          reason:
            'This engine did not preserve files in the synthetic ClipboardEvent. Actual OS clipboard validation remains manual.',
        };
      await dialog.getByRole('heading', {name: 'Post Attachment?', exact: true}).waitFor();
      assert.equal(await dialog.count(), 1);
      await dialog.getByRole('button', {name: 'Cancel', exact: true}).click();
      assert.equal(await editor.innerText(), draft);
    });
    await capture('desktop');
    await check('narrow-dialog-controls-visible', async () => {
      await page.setViewportSize({width: 390, height: 844});
      await page.waitForTimeout(500);
      const chooserPromise = page.waitForEvent('filechooser');
      await page.getByRole('button', {name: 'Attach a file', exact: true}).click();
      await (await chooserPromise).setFiles(new URL('samples/scores.csv', root).pathname);
      await dialog.getByRole('heading', {name: 'Post Attachment?', exact: true}).waitFor();
      const b = await dialog.boundingBox();
      assert(b.x >= 0 && b.x + b.width <= 391);
      for (const name of ['Cancel', 'Post Attachment']) {
        const control = dialog.getByRole('button', {name, exact: true});
        assert(await control.isVisible());
        await control.focus();
        assert(await control.evaluate((el) => el === document.activeElement));
      }
      await capture('narrow-confirmation');
      await dialog.getByRole('button', {name: 'Cancel', exact: true}).click();
    });
  } catch (e) {
    result.setupError = e.message.slice(0, 1800);
    await capture('setup-failure').catch(() => {});
  }
  result.status =
    result.setupError || result.checks.some((c) => c.status === 'failed')
      ? 'failed'
      : result.checks.some((c) => c.status === 'not-run')
        ? 'passed-with-unrun'
        : 'passed';
  result.recordedAt = new Date().toISOString();
  await save();
  await context.close();
  await browser.close();
  if (firefoxData) await rm(firefoxData, {recursive: true, force: true});
  console.log(
    JSON.stringify({
      browser: name,
      status: result.status,
      checks: result.checks.map(({id, status}) => ({id, status})),
      setupError: result.setupError,
    }),
  );
}

if (results.some((result) => result.status === 'failed' || !result.checks.length))
  process.exitCode = 1;
