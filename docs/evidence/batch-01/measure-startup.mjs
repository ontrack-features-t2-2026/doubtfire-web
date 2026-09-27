import {performance} from 'node:perf_hooks';

const baseUrl = process.env.STARTUP_BASE_URL ?? 'http://localhost:4200';
const username = process.env.STARTUP_TEST_USERNAME;
const password = process.env.STARTUP_TEST_PASSWORD;
const runs = Number(process.env.STARTUP_RUNS ?? 5);

if (!username || !password) {
  throw new Error(
    'Set STARTUP_TEST_USERNAME and STARTUP_TEST_PASSWORD for a local synthetic user.',
  );
}

const authStartedAt = performance.now();
const authResponse = await fetch(`${baseUrl}/api/auth`, {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({username, password, remember: false}),
});
const authBody = await authResponse.json();
if (!authResponse.ok || !authBody.auth_token) {
  throw new Error(`Synthetic sign-in failed with HTTP ${authResponse.status}.`);
}

const authMs = performance.now() - authStartedAt;
const requestHeaders = {
  'Auth-Token': authBody.auth_token,
  Username: authBody.user.username,
};

async function request(name, path) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {headers: requestHeaders});
  await response.arrayBuffer();
  const durationMs = performance.now() - startedAt;
  if (!response.ok) {
    throw new Error(`${name} failed with HTTP ${response.status}.`);
  }
  return {name, durationMs: round(durationMs), status: response.status};
}

async function replayBefore() {
  const startedAt = performance.now();
  const requests = [];
  requests.push(await request('settings', '/api/settings'));
  requests.push(
    ...(await Promise.all([
      request('campuses', '/api/campuses/'),
      request('teaching-periods', '/api/teaching_periods/'),
    ])),
  );
  requests.push(await request('unit-roles', '/api/unit_roles/'));
  requests.push(
    await request(
      'projects',
      '/api/projects/?include_inactive=false&include_task_definitions=true',
    ),
  );
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {mode: 'before', totalMs: round(performance.now() - startedAt), requests};
}

async function replayAfter() {
  const startedAt = performance.now();
  const requests = [];
  requests.push(await request('settings', '/api/settings'));
  requests.push(
    ...(await Promise.all([
      request('campuses', '/api/campuses/'),
      request('teaching-periods', '/api/teaching_periods/'),
    ])),
  );
  requests.push(
    ...(await Promise.all([
      request('unit-roles', '/api/unit_roles/'),
      request('projects', '/api/projects/?include_inactive=false&include_task_definitions=true'),
    ])),
  );
  return {mode: 'after', totalMs: round(performance.now() - startedAt), requests};
}

const samples = [];
for (let run = 1; run <= runs; run += 1) {
  const pair = run % 2 === 1 ? [replayBefore, replayAfter] : [replayAfter, replayBefore];
  for (const replay of pair) {
    samples.push({run, ...(await replay())});
  }
}

const beforeTotals = samples.filter(({mode}) => mode === 'before').map(({totalMs}) => totalMs);
const afterTotals = samples.filter(({mode}) => mode === 'after').map(({totalMs}) => totalMs);

console.log(
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      baseUrl,
      runs,
      authenticationMs: round(authMs),
      method: {
        before: 'settings; campuses + teaching periods; unit roles; projects; fixed 800 ms wait',
        after: 'settings; campuses + teaching periods; unit roles + projects; no fixed wait',
        note: 'Paired live-API orchestration replay. It measures the startup request contract, not paint time.',
      },
      summary: {
        beforeMedianMs: median(beforeTotals),
        afterMedianMs: median(afterTotals),
        medianReductionMs: round(median(beforeTotals) - median(afterTotals)),
        medianReductionPercent: round(
          ((median(beforeTotals) - median(afterTotals)) / median(beforeTotals)) * 100,
        ),
      },
      samples,
    },
    null,
    2,
  ),
);

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? round((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle];
}

function round(value) {
  return Math.round(value * 10) / 10;
}
