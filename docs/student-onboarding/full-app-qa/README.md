# Tutorial full application acceptance

Use this procedure with the merged web and API and synthetic accounts in an
isolated non-production database. The earlier [four-engine browser fixture](../browser-qa/README.md)
uses synthetic surrounding controls; this procedure exercises the actual header,
profile form, enrolments, authenticated settings and own-history endpoint.

The [performed run and limits](evidence/README.md) include the full-app recording,
real profile boundary, browser accessibility trees and a native Chrome 200% image.
The recording still requires a second human review.

## Runtime prerequisites

- Record the exact web and API commit hashes and tutorial version. The environment
  must include the default-false `tutorialEnabled` setting and authenticated
  `GET /api/projects/history` endpoint that counts inactive and withdrawn projects.
- Use an isolated database, upload directory, Redis namespace or instance, and
  loopback-only API listener. Do not reset a shared development database. Disable
  outgoing mail and background workers for this acceptance environment.
- Set `TUTORIAL_ENABLED=1` on that API process before starting it. This is the
  documented environment flag; it requires an API process restart when changed.
- Seed one fresh Student with `has_run_first_time_setup=false` and **zero** project
  rows, one enrolled Student with completed profile setup and a current unit,
  and one staff user. Use generated local-only credentials and example.invalid
  email addresses; do not put credentials or authentication responses in evidence.
- A student with any project history, including withdrawn projects, is deliberately
  replay-only. An empty list of active projects is insufficient for automatic
  tutorial eligibility.
- Install the web lockfile with its supported Node runtime:
  `npm ci --legacy-peer-deps`. Start the actual application with a temporary proxy
  configuration outside the checkout, for example:

```json
{"/api":{"target":"http://127.0.0.1:3011","secure":false}}
```

```sh
NG_BUILD_MAX_WORKERS=2 npx ng serve --configuration development \
  --host 127.0.0.1 --port 4320 --proxy-config /absolute/path/to/local-proxy.json
```

Use a new browser profile/session for the loopback site. Confirm the browser's
network panel receives authenticated `tutorialEnabled: true` and a current-user
history boolean. Do not copy tokens, response headers or personal data into the
result. Public settings must not expose the tutorial setting.

## Exact acceptance sequence

1. Sign in as the fresh Student. Confirm the existing welcome/profile form opens
   and no tutorial interrupts it. Complete required synthetic profile fields and
   submit once. Confirm the actual profile request succeeds and the tutorial offer
   appears only after the home page has loaded.
2. Use only the keyboard through welcome, Start tutorial, all four steps, Back,
   Skip for now, the confirmation's Go back and permanent dismissal option,
   Close and completion. Verify visible focus, meaningful focus return and Escape.
   Modal welcome/confirmation/completion contain focus; guided steps must allow
   keyboard access to the normal page.
3. For each step, inspect the accessible dialog name, step count/title and control
   names. The dashed target highlight is decorative. Record an accessibility-tree
   excerpt or inspector screenshot; do not call this a human screen-reader session.
4. On the enrolled Student, open the account menu's **Tutorial and Help** entry.
   Select the current unit yourself and navigate to its dashboard while the tutorial
   is active. Check unit selection, task navigation, target grade and Calendar
   locations. The tutorial must not click them or change their values automatically.
5. Change route and use browser Back during a guided step. Check the current target
   is highlighted only while present and otherwise the written fallback is shown.
6. Reload after step two, then check resume. Skip for now and reload: the next
   session may offer the welcome again. Complete or permanently dismiss, then reload:
   no automatic offer. Manual replay must remain available and preserve that choice.
7. Use the browser menu to set actual **200% zoom** (do not use CSS zoom), record
   the visible menu value and inspect the panel/controls. Restore the starting zoom
   afterward. Check a narrow window at 390 and 320 CSS pixels, scrolling the panel
   to reach its final link. In macOS WebKit/Safari, Option+Tab may be required for
   links under the default keyboard-navigation preference.
8. Enable a reduced-motion browser/OS test preference where already supported and
   record it. Confirm no essential information depends on animation. The explicit
   Find control scrolls instantly.
9. Re-test no-current-unit and missing-target states. Simulate slow/failed history
   responses and blocked browser storage only in the isolated test browser. Normal
   profile/page use must continue; unknown history is replay-only, and unavailable
   storage shows a warning. Restore all test overrides afterward.
10. Sign in as staff: no automatic tutorial or replay entry. Start a separate API
    process with the flag off, or restart only the isolated acceptance API with the
    flag off, and verify students also see neither entry nor prompt.
11. Record engine/version, commit pair, state, input method, viewport/zoom and
    pass/fail evidence per scenario. Log any defect with severity, reproducible
    steps and owner. Re-test accepted fixes before closing their findings.

Run current Chrome, Edge and Firefox. Run native Safari only when supported and
already available; a WebKit engine run is useful evidence but is not Safari.
Never enable OS automation permissions merely to claim Safari coverage.

## Walkthrough and independent review

A fallback walkthrough must identify tutorial version, date, tested commit pair,
and synthetic data. Label whether it shows the full application or the component
fixture. Keep the maintainable written guide linked beside it. Inspect every frame
for credentials, real names, assessment content or other personal information.

An independent person must follow the contributor guide and review the recording;
record their actual result and missing steps. Do not substitute an automated agent
for that review or for the three representative pilot participants. Pilot findings
and reviewer approvals remain separate evidence from these functional checks.

## Reproduce the pinned artifact

This run used a known full-application **default/development** build while fresh
compilation was constrained by concurrent builds. Its local combined commit
`a9e7af46f3eb17c4fefbac168a46688c73496286` was never pushed. Do not expect that
commit to be fetchable from GitHub. Reconstruct its exact tree from the two
published parents in a separate disposable worktree:

```sh
git fetch origin 11.0.x
git worktree add --detach ../tutorial-validation 0ff843477300c7848003c6612f534f75c5727e7f
cd ../tutorial-validation
git merge --no-commit --no-ff 66e3e20565ab1c61e0158f9fcf3a8d896dcdb11c
test "$(git write-tree)" = bfa13f35d5e3da731cd7b3b4492c30b542ec2f9d
npm ci --legacy-peer-deps
NG_BUILD_MAX_WORKERS=2 npm run build
```

This prepares a local validation tree only; it does not merge a GitHub PR or need
pushing. The parent commits are tutorial `0ff843477…` and migration `66e3e2056…`.
Node 22.23.2 and npm 11.19.0 were used for the recorded build. The tutorial, header
anchors, target-grade template, auth/settings/global state and profile form match
merged web `283b49336`; its welcome template only removes two comments. Other
later application changes are outside this pinned evidence.

Use the [isolated API recipe](runtime/README.md) at API
`d7f7a5b9c2d34ef279ac3a70bc58823def64005c`. The fixture seed and provider-blocking
initializer are confined to that disposable test environment. Credentials are
local and are never committed.

To serve a known build without another compiler, run this repository's helper:

```sh
TUTORIAL_BUILD_DIR=/absolute/path/to/tutorial-validation/dist/browser \
TUTORIAL_API_URL=http://127.0.0.1:3011 \
node /absolute/path/to/reviewed-checkout/docs/student-onboarding/full-app-qa/serve-built.mjs
```

It binds only to loopback and streams `/api` requests to the isolated API. Stop
with Ctrl+C. A default build lacks the production service-worker artifact; a
registration warning in this preview is not a tutorial defect. Do not use this
server as a deployment recipe.

## Reproduce the recording and targeted browser checks

Playwright is optional external QA tooling, not a production dependency. Set
`PLAYWRIGHT_MODULE` to its module path if installed outside this checkout. Set
`TUTORIAL_CREDENTIALS` to the private JSON produced by the isolated seed. With
that API and the built web running:

```sh
TUTORIAL_CREDENTIALS=/private/path/credentials.local.json \
TUTORIAL_WEB_SOURCE=a9e7af46f TUTORIAL_API_SOURCE=d7f7a5b9 \
node docs/student-onboarding/full-app-qa/record-walkthrough.mjs
```

The short silent video shows the actual application and real synthetic API data;
only the explanatory caption overlay is added for recording. Authentication runs
before the recorded page exists so passwords and tokens are not filmed. Review
all generated evidence before replacing the checked-in artifacts.

For the same targeted flow without another video, set `TUTORIAL_RECORD=0` and
`TUTORIAL_BROWSER=edge` or `firefox`. Each writes separate result and accessibility
snapshot files. These checks cover the real unit selector, four tutorial steps,
completion, replay and focus return. They do not replace the broader manual matrix,
real screen-reader sessions or the representative-user pilot.
