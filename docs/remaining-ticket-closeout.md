# Remaining ticket closeout

Updated 21 September 2026. This guide separates completed GitHub work from
checks requiring deployment access or an institutional decision. An open PR is
ready for another person's review; it is not a deployed release or acceptance
sign-off. No merge, production notification, credential rotation or Planner
status change was performed for this closeout.

## Start here

Ask the project maintainer to identify the **release operator**, **email/DNS
owner**, and **product/privacy reviewer**. You do not need to know server or
secret details yourself. The operator should run the checks below inside their
existing access; credentials must not be sent to you or attached to GitHub.

Copyable request (not sent automatically):

> Please help finish acceptance for CPD-UI05/06, NPR-Q01, NPR-T01, MN-Q01,
> NPR-S03 and MISC-PN01. Please nominate the release operator, email/DNS owner
> and product/privacy reviewer. The release operator needs an approved test
> deployment with the relevant PRs applied, synthetic student/staff accounts,
> a disposable test unit, controlled Outlook/Gmail/university inboxes, the
> largest active-unit enrolment count, and agreed load-test limits. They should
> run the private-key audit themselves using the production secret version,
> deployed API/worker image digests and retained logs. Please share only
> non-secret environment details and sanitised results. No credentials or
> private student data are needed in GitHub.

Before testing a deployment, record the web/API/deploy commit IDs and image
digests. Use the reviewed integration build containing the applicable PRs;
old spreadsheet branch names are historical context, not current checkout
instructions. The implementation PRs are [web #264](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/264),
[web #266](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/266)
and [API #174](https://github.com/ontrack-features-t2-2026/doubtfire-api/pull/174).

## CPD-UI05 and CPD-UI06: finish screen-reader acceptance

**Completed:** focused regressions, clean-install CI, Chrome/WebKit responsive
and state checks, contrast checks, and an actual native Chrome 200% zoom spot
check. See [dashboard evidence](evidence/cross-project-ui/README.md) and the
[native browser record](evidence/cross-project-ui/native-browser-check.json).
The native check verified wrapped cards, working search, and filter-menu focus
return. Accessible labels in a tree are not evidence of spoken announcements.

A contributor can finish this without production access:

1. Check out PR #266, use the repository's Node version, run `npm ci`, then
   `npm run build -- --configuration production`. Run `node docs/evidence/cross-project-ui/preview.mjs`.
   Use a fresh browser profile, or first clear site data and unregister any
   existing worker for this test origin. Then open
   `http://127.0.0.1:4328/dashboard`. This helper binds loopback only,
   returns three synthetic active units with 15 tasks, and sends no email or
   push. It substitutes local Monaco assets and blocks new service-worker
   registration; it cannot remove a worker already controlling the origin, so
   the fresh-profile/site-data step is required. This fixture it is not a backend or push test.
2. Start VoiceOver on macOS or NVDA on Windows. Record OS, browser and
   screen-reader versions. Use the reader's standard keyboard commands;
   [Apple's VoiceOver command reference](https://support.apple.com/en-ie/guide/voiceover/cpvokys01/mac)
   documents the macOS controls.
3. Tab through unit scope, Global search, Card density, statuses, grades,
   Staff feedback, date fields, refresh buttons, and each unit's search,
   sort/filter buttons, task links, feedback links and expand buttons.
   Confirm each control has a meaningful name, role and current state;
   links and buttons must be operable without the mouse.
4. Type `Design` into Global search. Expect `3 tasks in 3 units` to be
   announced once, with focus remaining in the search field. Clear it and
   expect `15 tasks in 3 units`. Choose the feedback filters: available
   gives 6 tasks, no feedback 6, unavailable 3. Clear to restore all 15.
5. Open a card's filter menu with Enter, toggle Hide Completed, then Escape.
   Confirm the checked state is spoken and focus returns to its trigger.
   Open the sort menu and check the selected radio state. Expand/collapse
   task details and confirm the state changes without losing focus.
6. Navigate through the first task: verify the staff-feedback link is named,
   the unread count communicates `3 unread comments` with its task context,
   and task/status/due information makes sense without colour. Confirm the
   actual spoken output, not just the browser accessibility inspector.
7. Repeat the spot check in the institution's required browser/reader
   combination. The reviewer must confirm which combinations are required;
   the existing Chrome/WebKit results do not establish that policy.
8. Attach a short transcript or privacy-safe recording, versions, commit,
   pass/fail per step, and any defect's reproduction. Have the UI reviewer
   confirm the documented browser/viewport/state matrix and handover. Close
   CPD-UI05/06 only after the spoken-output check passes or any accepted
   limitation has an identified owner and explicit review decision.

The fixture contains synthetic data only. Stop it with Ctrl-C after testing.
It deliberately cannot validate authentication, authorization, real feedback
navigation, email, push or production load.

## NPR-Q01: verify real email delivery

**Still requires the email/DNS owner.** Mailpit and test delivery capture prove
rendering only. The owner's report must begin by stating that limitation.
Follow API #174's exact [email acceptance commands and evidence template](https://github.com/ontrack-features-t2-2026/doubtfire-api/blob/codex/remaining-api-20260920/docs/notifications/email-acceptance.md), alongside the current [notification runbook](https://github.com/ontrack-features-t2-2026/doubtfire-api/blob/codex/remaining-api-20260920/docs/notifications/RUNBOOK.md)
and [delivery operations](https://github.com/ontrack-features-t2-2026/doubtfire-api/blob/codex/remaining-api-20260920/docs/notifications/delivery-operations.md).

1. The operator confirms the approved SMTP endpoint, port/TLS mode, sender,
   Reply-To and monitored reply/bounce destination without exporting secrets.
   The web and Sidekiq workers must use the same intended release/config.
2. The DNS owner supplies the actual sending domain and DKIM selector and
   verifies SPF/DKIM/DMARC. Inspect a delivered message's Authentication-Results
   too: a DNS record's existence alone does not prove signature/alignment.
3. Enrol three controlled test recipients (Outlook, Gmail and university mail)
   in a synthetic unit, enable the relevant email preference, and trigger one
   real supported event from a separate authorised staff test account. Use
   the normal UI event so eligibility and queueing are exercised.
4. For each inbox, record UTC send/receive time, event/notification ID,
   inbox/promotions/spam placement, From and Reply-To, SPF/DKIM/DMARC result,
   and a working deep link. Sanitise addresses, headers and account data.
5. In the API release environment run
   `bundle exec rake notifications:delivery_counts`. Correlate the specific
   notification's delivery state/attempt count with SMTP/provider records.
   `delivered` means SMTP accepted the message; it does not prove inbox arrival.
6. Use the provider's documented bounce simulator or an operator-controlled
   rejecting mailbox to test a permanent rejection. Record the delivery
   state/dead-job evidence and where an operator is alerted. Also establish
   the handling of an asynchronous bounce after SMTP acceptance; do not infer
   that SMTP error retries cover it. If no bounce workflow exists, record the
   gap and create a separate implementation issue with an owner.
7. Attach the sanitised three-provider table, DNS/header evidence, sender
   decision, bounce result and linked gap issue if applicable. The email owner
   signs off only after the ticket's inbox/deliverability criteria are met.

Do not send this test to real students or arbitrary invalid addresses. The
approved test recipients and provider test mechanism are prerequisites.

## NPR-T01: confirm the real maximum and deployment capacity

The repeatable harness and synthetic measurements are in API #174's
[cohort load-testing guide](https://github.com/ontrack-features-t2-2026/doubtfire-api/blob/codex/remaining-api-20260920/docs/notifications/cohort-load-testing.md).
They are local service/queue measurements, not a production capacity claim.

1. The operator obtains the largest active-unit enrolment **count**, records
   when it was measured, and supplies production worker concurrency, CPU/RAM
   limits and notification quota configuration. No student export is needed.
2. Agree the required request latency, drain-time, error-rate and resource
   limits before the run. An unspecified institutional limit cannot be marked
   passed from an arbitrary synthetic size.
3. On an isolated test database/Redis with synthetic users, run the guide's
   harness at the measured cohort size and with concurrent events. Preserve
   the documented opt-out proportion and raw count/timing results. For
   example, after supplying the actual count:

   ```sh
   : "${LARGEST_UNIT_ENROLMENT:?Operator supplies the measured count}"
   RAILS_ENV=test COHORT_SIZE="$LARGEST_UNIT_ENROLMENT" OPT_OUT_PERCENT=20 \
     bundle exec rails runner script/benchmark_notifications.rb
   ```

4. Separately exercise real event admission and the configured Sidekiq worker
   deployment in an approved production-shaped test stack, with controlled
   or stubbed delivery. Measure end-to-end request latency, queue depth and
   drain, DB/worker CPU/RSS, retries and errors while increasing simultaneous
   cohort events. Stop at the pre-agreed safety/resource limit. The default
   cohort ceiling is 500; the direct-service harness does not prove that
   cohort admission/override works, and worker saturation is a separate test.
5. Attach the real maximum, environment/config, concurrency, measurements,
   observed limit and comparison against the agreed thresholds. The release
   owner accepts capacity or creates the remaining performance issue.

## MN-Q01: verify a real push in three browsers

This requires controllable **Chrome, Edge and Firefox**, an approved local or
HTTPS test stack, synthetic accounts and a real VAPID configuration owned by
the operator. The dashboard-only fixture above cannot test push.

1. Record each browser version and the web/API/deploy commits. Check the real
   service-worker asset is served as JavaScript (not an HTML fallback), the
   page is a secure context, and `PushNotificationService.configured?` is true
   in the API release environment.
2. Use a fresh test browser profile. Allow operating-system notifications and
   ensure Focus/Do Not Disturb will not suppress the test. Sign in as the
   synthetic recipient, open Profile and opt into push. Grant notification
   permission for the test origin and verify that user's subscription is
   persisted; do not copy subscription endpoints or keys into a public report.
3. From a second authorised test account, add a task comment to that student's
   synthetic project (or another agreed supported event). Leave the recipient
   tab in the background. A DevTools synthetic push is not sufficient.
4. Capture the actual operating-system notification and click it. Verify it
   opens/focuses the intended OnTrack task/feedback destination. Record the
   title/body privacy check, event ID, arrival time and expected/actual route.
5. Repeat independently in all three browsers. Clean up only the test
   subscription/profile using the normal opt-out flow. Record a row per
   browser: version, permission, subscription, real-event delivery,
   click-through and evidence. Create a separate bug for each failure.
6. The browser tester signs off only when all three rows pass. Existing
   blocked/old-branch records are historical evidence, not current approval.

## NPR-S03: run the production private-key audit

Deploy [PR #39](https://github.com/ontrack-features-t2-2026/doubtfire-deploy/pull/39) adds the [private-key audit guide](https://github.com/ontrack-features-t2-2026/doubtfire-deploy/blob/codex/vapid-secret-audit-20260921/docs/vapid-secret-audit.md),
which contains the exact command and protected-input procedure.

1. The release owner selects the production secret version(s), complete local
   Git history, immutable API/Sidekiq image IDs and retained API/worker/proxy/
   build logs covering each version's lifetime.
2. On the owner's trusted machine, export the key through its secret manager
   to an owner-only file outside Git (or pipe it directly to `--key-stdin`).
   Run `tools/audit-vapid-secret.py` with every required repository, image and
   log input. The scanner includes historical/deleted Git objects and image
   layers; inspecting only a running container's filesystem is insufficient.
3. Save the redacted JSON privately. Exit 0 means no matches **in the supplied
   inputs**; exit 1 means exposure findings; exit 2 means incomplete/invalid
   input. Missing retained periods are unknown, not a pass.
4. Record the owner/date, secret version ID, refs/digests/log periods, scanner
   commit, result and protected report location. If exposed, the release
   owner follows the existing rotation/resubscription runbook and reruns the
   audit. Do not attach the key, full logs or private report to GitHub.

## MISC-PN01: approve the documented name contract

The canonical rule, audit and proposed exception process are already in
[API #174's display-name contract](https://github.com/ontrack-features-t2-2026/doubtfire-api/blob/codex/remaining-api-20260920/docs/display-name-migration.md).
Product, privacy and administration owners must decide institutional
exceptions; code review cannot invent their approval.

Ask those reviewers to record the following in the PR review or an approved
institutional decision and link it from the ticket:

- **Normal display:** preferred first name + surname, falling back to legal
  first name when preferred name is blank; whitespace/Unicode/duplicate-name
  handling as documented.
- **Search:** which already-authorised fields may match, with result labels
  using display names and no extra legal-name disclosure.
- **Each legal-name exception:** purpose, approving owner, allowed roles,
  receiving system and retention rule. `None approved` is a valid explicit
  decision; existing legacy code is not an approved exception.
- **Both names together:** allowed contexts, if any; never a general default.
- **Migration priority:** confirm priority and deferred surfaces from the audit.
- **Decision evidence:** approved/rejected/changes requested, reviewer roles,
  date and link. Do not mark the proposal approved until that review exists.

## STAFF-26 and GitHub completion

The reported empty dropdown does not reproduce: global teaching-period loading
finishes before rollover initialises, including a delayed response and hard
reload. Record the current-source/browser evidence on the ticket and close the
misdiagnosed failure. [Web PR #276](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/276)
makes the default independent of API/cache ordering and documents the exact
selection rule and five regression tests.
Do not claim that this ordering change fixed an empty dropdown.

After the additions have been reviewed, another authorised reviewer decides
whether to merge. Record review/acceptance links on the relevant tickets and
update their board status only when their stated acceptance conditions are met.
