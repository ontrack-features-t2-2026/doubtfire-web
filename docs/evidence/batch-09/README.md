# Batch 09 — isolated demo scenario evidence

Date: 2026-08-31 (Australia/Melbourne)

## Outcome

Batch 09 now has one canonical server-owned scenario registry and one guarded web adapter. The
walkthrough is unavailable unless all of the following are true:

- the web is a non-production build with demo tools compiled in;
- Rails is running in development;
- the connected database is exactly `doubtfire-all-features-demo`;
- `DF_DEMO_DATA_PROFILE=all-features`;
- the authenticated account is exactly the synthetic `demo_student` account.

`GET /api/demo/scenario` returns a generic 404 outside that boundary and uses
`Cache-Control: private, no-store` inside it. The response is kept in
`DemoScenarioRegistryService`'s dedicated in-memory subject. It is never passed to the normal
unit, project, task, notification, or group entity services/caches.

## Deterministic fixture contract

The canonical semantic source is
`doubtfire-api/lib/demo_data/mobile_feedback_scenario.rb`. Dynamic database identifiers are
resolved only when the guarded endpoint is called; they are intentionally omitted from this
report and from checked-in evidence.

| Hook | Deterministic result |
| --- | --- |
| Task lifecycle | 10 tasks: Not Started 20%, Working on It 20%, Ready/Awaiting Feedback 20%, Resubmit 10%, Redo 10%, Complete 10%, Fail 10% |
| Aggregate task state | 60% submitted; 10% complete; one Fail task only |
| PPI: `DEMO10001` | 60% submitted; 10% complete |
| PPI: `DEMO20007` | 70% submitted; 20% complete |
| PPI: `DEMO30046` | 50% submitted; 20% complete; deliberately privacy-rounded statuses may total 110% |
| PPI: `DEMO30243` | unavailable with `insufficient_cohort`; the only unavailable unit |
| Notifications | 7 unique event hooks, 4 unread and 3 read; feedback copy contains no comment body |
| Group | `Team Indigo`, 3 synthetic members, capacity 4, under `Demo project teams` in `DEMO20007` |

Raw PPI counts, cohort sizes, peer names, usernames, emails, and notification message bodies are
not present in the scenario response. The normal peer-progress endpoint remains the source of
task-level values and applies the existing viewer-exclusion and whole-vector privacy policy.

## Demo OFF / ON invariants

- The former demo HTTP masking interceptor was removed. OFF does not trim `/projects`, replace
  `/notifications`, replace unread counts, or substitute a fake PPI response.
- ON changes no server record. It lets feature components select the contract's stable hooks.
- The ON bit is session-scoped by both scenario ID and authenticated user ID.
- Sign-out/account change clears the scenario and its enabled bit.
- Toggling is immediate and does not reload, so unit switching can select another contract value
  without rebuilding or mixing entity caches.

## Walkthrough UI and stable selectors

The banner now says “Demo walkthrough on. You are viewing synthetic local data.” and exposes
visibly interactive **Open walkthrough** and **Exit demo** actions. The control page uses plain
language and direct links to Tasks/CPD, PPI, Progress Burndown, and Notifications.

Stable selectors for later batches and integrated verification:

- `[data-testid="demo-mode-banner"]`
- `[data-testid="demo-controls-link"]`
- `[data-testid="demo-walkthrough-toggle"]`
- `[data-testid="demo-link-tasks"]`
- `[data-testid="demo-link-ppi"]`
- `[data-testid="demo-link-burndown"]`
- `[data-testid="demo-link-notifications"]`
- lifecycle rows use `[data-status="<canonical_status>"]`
- PPI unit hooks use `[data-state="available|unavailable"]`

The controls use 44px minimum action targets, a two-column mobile destination grid that collapses
to one column at 350px, wrapping status cards, and an in-flow compact banner. There is no fixed
preview panel to clip the page bottom.

## Verification

Passed locally:

```text
npx ng test --watch=false --include='src/app/demo/**/*.spec.ts' \
  --include='src/app/api/services/spec/peer-progress-indicator.service.spec.ts' \
  --include='src/app/api/services/spec/authentication.service.spec.ts'
Result: 6 files, 45 tests passed

npm run typecheck
Result: passed

npx eslint <Batch 09 demo/auth/PPI/notification files> --max-warnings 0
Result: passed

bundle exec rubocop lib/demo_data/mobile_feedback_scenario.rb \
  lib/demo_data/all_features_scenario.rb app/api/demo_scenario_api.rb \
  app/api/entities/notification_entity.rb \
  test/lib/demo_data/all_features_scenario_test.rb
Result: 5 files inspected, no offenses

./demo.sh config --format json | python3 compose_contract_test.py /dev/stdin
Result: All-features demo Compose contract checks passed.

git diff --check
Result: passed in web, API, and deploy repositories
```

The focused Rails scenario test covers two seed runs, exact task/PPI/notification/group hooks,
privacy-safe endpoint output, account/environment denial, scheduled-reminder stability, and full
cleanup. During the multi-batch session its shared test database was reset by another process, so
the final database-backed command must be run in the serialized API gate rather than claiming a
result from a contaminated run:

```text
RAILS_ENV=test bundle exec rails test test/lib/demo_data/all_features_scenario_test.rb
```

This limitation is explicit evidence hygiene: no transient dynamic IDs or partial shared-database
result has been recorded as a pass.
