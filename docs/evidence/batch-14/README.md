# Batch 14 — Portfolio, Tutorials, and Group Work

Date: 2026-08-31 (Australia/Melbourne)

## Outcome

Batch 14 is implemented in the web client without changing live group data or adding an API/deploy
production path.

- Portfolio now has a compact labelled phone stepper, guarded previous/next navigation, a visible
  Learning Summary Report validation alert above the action row, a centred submitted state, wrapping
  selected-file rows, and safe-area-aware action spacing.
- Tutorials keep the complete sortable Material table on desktop and switch to phone cards below
  `640px`. Every card exposes stream, campus, code, day, time, room, tutor, and the applicable
  enrol/withdraw/full/managed state.
- Group Work now distinguishes three authorised states: real published groups, configured group work
  with no published groups, and no group-work configuration. Student group/member data becomes cards
  on phones while the existing staff/desktop tables remain.
- The isolated Batch 09 group hook is used only to label matching runtime data as synthetic. The UI
  does not construct a group, alter an entity cache, or infer a group from a unit code.

## Factual Group Work report

The Batch 00 baseline establishes the reported empty-state cause:

1. `Unit.hasGroupwork()` is exactly `groupSetsCache.size > 0` in
   `src/app/api/models/unit.ts`.
2. The ordinary unit response exposes `group_sets` and `groups` from the API.
3. The database inspected by Batch 00 contained **zero group sets and zero groups**. Therefore the
   original “No Group Work” screenshot reflected the API/configuration state; it was not a hidden
   membership or rendering failure.

Batch 14 preserves that truth. It replaces the generic message with an exact configuration state and
contact guidance. If the authorised payload has multiple group sets, the state first preserves the
current selection, otherwise selects the student's real group set, otherwise the first non-empty set,
and only then falls back to the first configured set. This prevents an empty first set from hiding real
groups in a later set.

Batch 09's isolated fixture contract is consumed through `DemoScenarioRegistryService`:

- authenticated `GET /api/demo/scenario` is guarded by Rails development, database
  `doubtfire-all-features-demo`, `DF_DEMO_DATA_PROFILE=all-features`, and user `demo_student`;
- the group hook contains runtime `unit_id`, `project_id`, `group_set_id`, and `group_id` values;
- Batch 14 shows the demo note only when demo mode is enabled and all three presentation IDs match;
- ordinary runtimes receive a 404, the registry clears, and no demo note or synthetic group appears.

The guarded seed owns `Demo project teams` / `Team Indigo` and creates memberships with
`notify: false`. Batch 14 did not edit the registry, seed, migrations, API entities, or production
group creation code.

## Implementation map

| Surface                      | Main files                                                                                                                 | Contract                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Portfolio navigation         | `src/app/projects/states/portfolio/portfolio-state.component.*`                                                            | 44px labelled phone controls; locked steps cannot be skipped; desktop tabs remain                                      |
| Portfolio validation/success | `src/app/projects/states/portfolio/directives/portfolio-learning-summary-report-step/*`                                    | semantic alert before actions; centred status/tick/upload-again state                                                  |
| Portfolio files/review       | `portfolio-add-extra-files-step/*`, `portfolio-review-step/*`, `portfolio-grade-select-step/*`, `portfolio-welcome-step/*` | wrapping file names, stacked phone actions, consistent five-step copy, shared Batch 04 download feedback               |
| Shared upload presentation   | `src/app/common/file-uploader/file-uploader.component.{html,scss}`                                                         | wrapping selected filename, named 48px remove target, finite phone drop/progress/success geometry; transport unchanged |
| Tutorials                    | `src/app/projects/states/tutorials/tutorials.component.*`                                                                  | desktop table retained; complete phone cards and exact empty state                                                     |
| Group state                  | `src/app/projects/states/groups/project-groups-state.component.ts`, `project-groups/*`                                     | real/configured-empty/not-configured states; guarded Batch 09 label only                                               |
| Group data UI                | `src/app/groups/group-set-manager/*`, `group-selector/*`, `group-member-list/*`                                            | real entity data; student phone cards; staff/desktop tables retained                                                   |

Batch 14's shared uploader change is presentation-only and deliberately narrow. Concurrent Batch 08
work may extend its processing/preview/polling state machine while preserving the wrapping filename,
named remove control, and phone geometry contract.

## Responsive and accessibility contract

The original screenshots are all 1008×2244 Android captures. Their observable failures and the
contained repair are recorded in [responsive-contract.md](./responsive-contract.md). At the phone
breakpoint:

- the Portfolio stepper reserves `44px + minmax(0, 1fr) + 44px`, so the title can wrap rather than
  clip from 320px through 412px;
- validation is a separate `role="alert"` above the Back/Next row, and the footer adds
  `env(safe-area-inset-bottom)`;
- the submitted state is one centred column with a fixed 4rem icon box;
- tutorial and group details use `repeat(2, minmax(0, 1fr))`, wrap long values, and retain 44px action
  targets;
- the desktop tutorial and group tables are hidden only for the student phone presentation, not
  removed from the desktop/staff path.

## Verification

All commands ran against the shared merged working tree at web HEAD
`024e12ee15e7c0309d36a621aff29b98bb4d8f6e`.

Batch 14 made no API or deploy edits. Their inspected revisions were API
`51d662850db15dabc710cf10972415553d03b761` and deploy
`e791b57ba3e949e01285270f4bc0ea29fb23bb39`; the API worktree also contained
concurrent Batch 09 work.

| Check                                      | Result                    |
| ------------------------------------------ | ------------------------- |
| `npm run typecheck`                        | PASS, exit 0              |
| Combined focused Angular/Vitest suite      | PASS, 8 files / 22 tests  |
| Targeted ESLint over Batch 14 TS/templates | PASS, exit 0              |
| Prettier check over Batch 14 paths         | PASS, all files formatted |
| `git diff --check` for Batch 14 paths      | PASS, exit 0              |

Commands:

```sh
npm run typecheck

docker exec notifications-demo-web sh -lc 'cd /doubtfire-web && npx ng test --no-watch --no-progress --include src/app/projects/states/portfolio/portfolio-state.component.spec.ts --include src/app/projects/states/portfolio/directives/portfolio-learning-summary-report-step/portfolio-learning-summary-report-step.component.spec.ts --include src/app/projects/states/portfolio/directives/portfolio-review-step/portfolio-review-step.component.spec.ts --include src/app/projects/states/tutorials/tutorials.component.spec.ts --include src/app/projects/states/groups/project-groups-state.component.spec.ts --include src/app/projects/states/groups/project-groups/project-groups.component.spec.ts --include src/app/groups/group-selector/group-selector.mobile.spec.ts --include src/app/common/file-uploader/file-uploader.component.spec.ts'

npx eslint src/app/projects/states/portfolio src/app/projects/states/tutorials/tutorials.component.ts src/app/projects/states/tutorials/tutorials.component.html src/app/projects/states/tutorials/tutorials.component.spec.ts src/app/projects/states/groups/project-groups-state.component.ts src/app/projects/states/groups/project-groups src/app/groups/group-selector src/app/groups/group-member-list src/app/groups/group-set-manager src/app/common/file-uploader/file-uploader.component.html src/app/common/file-uploader/file-uploader.component.spec.ts
```

Focused coverage includes:

- locked Portfolio step navigation and compact labelled stepper;
- validation ordering and centred submitted state;
- draft/file Learning Summary Report recognition and shared download feedback;
- complete Tutorial card values, desktop table retention, enrol action, and empty state;
- three Group Work states plus the exact guarded demo-hook match;
- group capacity/join policy and selected group-set preservation;
- long selected upload filename wrapping and named remove control.

## Runtime visual verification boundary

The in-app Browser was pointed at `http://127.0.0.1:4400`. The only active local stack was the older
`notifications-demo` stack; it rejected the isolated `demo_student` credentials and there was no
`doubtfire-all-features-demo` stack available. We did not substitute a personal/live account and did
not claim authenticated device screenshots from the wrong dataset.

Batch 15 should start the guarded all-features stack after Batch 09 is complete and capture 320px,
360px, 390px, and 412px authenticated evidence for:

1. Portfolio missing-report validation, selected file, upload success, upload-again, and compiled
   review;
2. one Tutorial phone card plus the desktop table;
3. `Team Indigo` and the ordinary not-configured Group Work state.

Source evidence provenance is in [source-image-manifest.md](./source-image-manifest.md).
