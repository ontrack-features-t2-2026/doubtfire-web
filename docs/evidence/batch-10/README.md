# Batch 10 — PPI and Progress Burndown handover

**Date:** 2026-08-31 (Australia/Melbourne)
**Lane:** `/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-web`
**Prerequisites consumed:** Batch 00 baseline and Batch 09's guarded scenario registry

## Outcome

Batch 10 now consumes the one Batch 09 scenario registry rather than creating another source of
demo data. Demo OFF remains the existing live HTTP path. Demo ON selects a PPI hook only when both
the project id and task-definition id match the guarded registry. Three units expose different,
privacy-rounded values and the fourth remains deliberately unavailable for an insufficient cohort.

The PPI preview is internally consistent in every state, Advanced is a user-scoped durable display
preference, and privacy states never render hidden percentages or status rows. Progress Burndown
keeps the existing student series, adds a unit-specific synthetic peer median only in demo mode, and
derives its three visible summary figures from the exact same chart series it plots.

No production API schema, database row, PPI aggregation policy, Engagement Passport component, or
feature page outside PPI/Progress Burndown was redesigned in this batch.

## Diagnosis

| Reported symptom | Source-level cause | Batch 10 correction |
| --- | --- | --- |
| Preview choice changed some rows while the headline stayed at 10% | The controls owned a second hand-built preview whose headline and compact values were not all derived from the selected fixture | One standalone preview now derives headline, Completed, Submitted, bars, rounded total, and explanation from the selected state |
| 90% and 110% examples contradicted their compact values | The rounded vectors changed independently from the inherited 60% submitted / 10% complete values | The 90% state is 50% submitted / 20% complete; the 110% state is 80% submitted / 30% complete; their submitted-status sums match their compact submitted values |
| Advanced closed on task/preview change | The task widget explicitly set `advanced = false` in `ngOnChanges` | A boolean-only preference is stored at `ontrack.user.<user-id>.peerProgress.advanced` and restored on component creation and input changes |
| Demo banner was visible while every task still used unavailable live PPI data | Demo mode did not map the guarded per-unit PPI hooks into the task adapter | Exact project/task matches consume `scenario.units[].ppi`; non-matches and Demo OFF use the normal API unchanged |
| Unit summary mixed unlike scopes | “Your progress” and “Anonymous cohort” did not say that one was unit completion and the other was a selected task checkpoint | Labels now explicitly say `Your unit completion` and `Anonymous cohort — <task> submitted` |
| Burndown had no readable current values and the peer line was generic | Summary values were absent and the proof-of-concept median did not vary by registry unit | Projected, To Submit, and To Complete summaries read the latest point from their plotted series; the median curve is deterministic per available demo unit and suppressed for the privacy unit |
| Touch controls could look stuck | Hover styling applied to touch-capable pointers | Hover styling is restricted to fine hover pointers; native buttons retain `:focus-visible`, `touch-action: manipulation`, and 44px targets |

## Deterministic PPI states

All percentages below are synthetic, privacy-rounded demo values. A rounded status vector is not
renormalised because doing so would imply precision the source deliberately withheld.

| Preview | Submitted | Completed / headline | Detailed status total | Detail behavior |
| --- | ---: | ---: | ---: | --- |
| Full status data | 60% | 10% | 100% | All seven non-zero canonical lifecycle statuses |
| Rounded total 90% | 50% | 20% | 90% | Each status keeps its own 0–100 scale and the 90% total is explained |
| Rounded total 110% | 80% | 30% | 110% | Each status keeps its own 0–100 scale and the 110% total is explained |
| Insufficient cohort | hidden | hidden | hidden | No switch, compact metric, progress bar, count, or status row is rendered |
| Advanced details protected | 70% | 30% | hidden | Safe compact metrics remain; the vector stays withheld even with Advanced on |

The live Batch 09 hooks remain the registry authority:

| Unit | Submitted | Completed | State |
| --- | ---: | ---: | --- |
| `DEMO10001` | 60% | 10% | available |
| `DEMO20007` | 70% | 20% | available |
| `DEMO30046` | 50% | 20% | available; independently rounded vector may total 110% |
| `DEMO30243` | hidden | hidden | unavailable — insufficient cohort |

## Persistence and privacy invariants

- The durable value is one boolean. No percentage, cohort size, status vector, task id, name,
  username, email address, or comment is written to browser storage.
- The storage key includes the authenticated numeric user id. Before authentication the service
  fails closed and writes nothing. Another account receives its own default.
- If browser storage is unavailable, a per-user in-memory fallback preserves navigation in the
  current session without weakening the privacy state.
- Advanced only changes presentation. It cannot turn a suppressed response into an available one;
  insufficient-cohort markup contains no values and the detailed-protected state contains no rows.
- Demo hook lookup requires Demo ON plus exact runtime project/task identifiers from the guarded
  in-memory registry. It does not copy those ids into normal project/task caches.
- Demo OFF and non-matching tasks take the authorised live endpoint with no fabricated values.
- The peer median response contains no cohort size and the deliberate insufficient-cohort unit has
  an empty series.

## Visual and accessibility checks in source

- PPI and summary cards use the existing OnTrack white surface, neutral border, restrained shadow,
  and primary `#3939ff` family instead of the reported gradient/glow treatment.
- Compact metrics wrap rather than forming a narrow tall column; the Advanced panel collapses to a
  single column under 520px, and the Burndown summaries collapse to one column under 640px.
- Preview choices and switches are native buttons with 44px targets, `aria-pressed` / switch state,
  keyboard `focus-visible` cues, and no permanent `active` class.
- Burndown retains explicit accessible legend buttons and exposes the current summary as a labelled
  definition list.
- WCAG contrast calculations for the changed text pairs are all above 4.5:1: primary text on white
  8.44:1, muted text on white 7.31:1, muted text on the neutral panel 6.84:1, privacy text on the
  warning panel 8.54:1, selected-button text on its surface 7.42:1, and body text on white 15.17:1.

## Verification completed

```text
npx ng test --watch=false \
  --include='src/app/common/services/peer-progress-display-preference.service.spec.ts' \
  --include='src/app/api/services/spec/peer-progress-indicator.service.spec.ts' \
  --include='src/app/api/services/spec/peer-progress.service.spec.ts' \
  --include='src/app/projects/states/dashboard/directives/task-dashboard/directives/task-description-card/ppi-widget/ppi-widget.component.spec.ts' \
  --include='src/app/projects/states/dashboard/directives/progress-dashboard/progress-dashboard.component.spec.ts' \
  --include='src/app/projects/states/dashboard/directives/progress-dashboard/peer-progress-unit-summary/peer-progress-unit-summary.component.spec.ts' \
  --include='src/app/visualisations/progress-burndown-chart/progress-burndown-chart.component.spec.ts' \
  --include='src/app/demo/ppi-preview/ppi-preview.component.spec.ts' \
  --include='src/app/demo/demo-controls/demo-controls.component.spec.ts'
Result: 9 files, 93 tests passed

npx ng test --watch=false --include='src/app/demo/**/*.spec.ts'
Result: 5 files, 18 tests passed

npm run typecheck
Result: passed

npx eslint <the 20 changed Batch 10 TypeScript/spec files>
Result: passed with zero warnings

git diff --check
Result: passed
```

The focused suite covers all five preview states, both Advanced states, user separation and a new
service instance, exact/non-matching demo identifiers, all four Batch 09 unit hooks, live
pass-through, malformed privacy data, route reuse, non-flat chart series, summary/source identity,
narrow-screen axis behavior, native keyboard-button semantics, legend toggling, and
suppression/error states.

## Serialized runtime gate still required

No Batch 10 “after” screenshot is claimed here. At verification time ports 4400, 3200, 4200,
3000, and 8000 had no application listener. Creating the required isolated scenario would run the
shared demo seed/reset path, which was deliberately deferred while other batches were editing and
testing the same API/database. The supplied screenshots remain immutable before evidence; their
exact provenance and hashes are in `source-image-manifest.md`.

After all API-writing batches have finished, run this once in a serialized gate from
`doubtfire-deploy/development/all-features-demo` with the current web/API paths:

```text
DF_DEMO_API_PATH=/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-api \
DF_DEMO_WEB_PATH=/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-web \
./demo.sh prepare
```

Then sign in as the documented synthetic `demo_student` account, turn Demo on, and capture at
320px, 412px, desktop, and 200% browser zoom. Walk every preview with Advanced off/on, switch all
four units, background/resume and reopen once, tab through every choice/switch/legend control, and
confirm the insufficient cohort never exposes a number. Capture Progress Burndown in one available
unit and `DEMO30243` to prove both the varied median and suppressed state.

The API privacy/scenario tests also remain for that serialized database gate; do not run them
against a shared in-use test database:

```text
RAILS_ENV=test bundle exec rails test \
  test/services/peer_progress_distribution_policy_test.rb \
  test/services/peer_progress_viewer_policy_test.rb \
  test/api/peer_progress_api_test.rb \
  test/lib/demo_data/all_features_scenario_test.rb
```

## Evidence paths for later batches

- Source screenshots: `source-image-manifest.md`
- Batch 09 scenario authority: `docs/evidence/batch-09/README.md`
- Preview component: `src/app/demo/ppi-preview/`
- Registry adapter: `src/app/api/services/peer-progress-indicator.service.ts`
- User-scoped preference: `src/app/common/services/peer-progress-display-preference.service.ts`
- Task PPI: `src/app/projects/states/dashboard/directives/task-dashboard/directives/task-description-card/ppi-widget/`
- Unit summary: `src/app/projects/states/dashboard/directives/progress-dashboard/peer-progress-unit-summary/`
- Burndown: `src/app/visualisations/progress-burndown-chart/`
