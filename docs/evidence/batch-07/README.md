# Batch 07: Task Details actions, responsive dialogs, and task-sheet naming

## Result and scope

Batch 07 is complete across the active web and API lanes. Task Details now presents state-appropriate
upload actions, wraps narrow cards safely, uses responsive extension and feedback-review dialogs with
dirty-state protection, and receives one authoritative task-sheet filename from the API. Task-sheet
downloads reuse the Batch 04 user-visible download-start helper.

This batch does not alter submission processing or invent success. The upload journey, artefact
readiness, retry, and polling states remain Batch 08 responsibilities.

## Diagnosis before change

- The status card could show a disabled `Upload submission` beside `Upload new files`, obscuring the
  single valid next action after a submission.
- Compact cards and action rows used desktop spacing, causing narrow copy and controls to crowd or
  clip.
- Extension and feedback-review dialogs were positioned near the top with fixed desktop geometry.
  They could discard typed work through backdrop, Escape, or navigation without an explicit choice.
- Task-sheet inline viewing and attachment download computed names independently, so the same bytes
  could be described by inconsistent filenames.

The immutable observations are indexed in [source-image-manifest.md](source-image-manifest.md).

## Implemented behavior

- `Task.hasSubmissionHistory()` derives whether the student has prior submission evidence from the
  real server fields/statuses. The status card now offers exactly one primary action: `Upload
  submission` before history exists, or `Upload new files` afterwards. Pending work disables the
  relevant action rather than exposing a contradictory duplicate.
- The due-soon card uses sentence case, useful padding, natural wrapping, and the compact copy `Aim to
  complete soon – due in …`. Task action rows wrap with 44-pixel minimum touch geometry.
- Extension and feedback-review dialogs use finite `dvh` bounds, scroll their content, restore focus,
  and use the Material focus trap. Backdrop, Escape, route navigation, and Android Back all pass
  through a close predicate; an edited form requires discard confirmation. A request stays open while
  pending, closes only on success, and reports a controlled error on failure.
- The API exposes `task_sheet_filename`, derived from a sanitized
  `<unit>-<abbreviation>-TaskSheet.pdf`. Inline and attachment endpoints serve byte-identical content;
  attachment `Content-Disposition` uses that quoted filename. The web maps that field, retains a
  rolling-safe equivalent fallback for mixed deployments, supplies it to both PDF viewers, and uses
  it with the shared Batch 04 download helper.

## Verification

Focused checks run on 31 August 2026 (Australia/Melbourne):

| Contract | Evidence/result |
| --- | --- |
| Submission-history state matrix and mutually exclusive upload actions | `task.spec.ts`, `task-status-card.component.spec.ts` |
| Due-card copy and narrow wrapping | `task-due-card.component.spec.ts` |
| Dirty close, untouched close, pending/success/failure, focus/geometry config | extension and feedback-appeal component/service specs |
| API-authoritative filename mapping and shared download helper invocation | `task-definition.service.spec.ts`, `task-description-card.component.spec.ts` |
| Task Sheet viewer filename propagation | `task-dashboard.component.spec.ts` |
| Combined Batch 06/07 Angular gate | 13 suites, 94 tests, 94 passed, 0 failed |
| Targeted Batch 06/07 ESLint | Passed |
| Merged-tree TypeScript check | Passed |

The focused API request test covers entity serialization, byte identity between inline and attachment
responses, and the exact quoted `Content-Disposition`. Its isolated-Rails result is recorded in the
final integrated verification rather than inferred from web tests.

Final browser verification should cover 320–412 CSS-pixel widths, keyboard focus containment and
restoration, soft keyboard layout, backdrop/Escape/Back dirty confirmation, request failure, and a
real inline/download task-sheet comparison. No production task or student data was modified.

## Handover / code map

Web:

- submission-history model helper: `src/app/api/models/task.ts`
- action and card hierarchy: `src/app/projects/states/dashboard/directives/task-dashboard/directives/task-status-card/`
- due-soon card: `src/app/projects/states/dashboard/directives/task-dashboard/directives/task-due-card/`
- responsive dialogs: `src/app/common/modals/extension-modal/` and
  `src/app/tasks/modals/feedback-appeal-modal/`
- task-sheet mapping/download/viewer propagation: `src/app/api/models/task-definition.ts`,
  `src/app/api/services/task-definition.service.ts`, and the Task Details/Task Sheet components

API:

- canonical filename: `app/models/task_definition.rb`
- serialized field: `app/api/entities/task_definition_entity.rb`
- attachment response: `app/api/task_definitions_api.rb`
- focused request coverage: `test/api/units/task_definitions_api_test.rb`

Batch 08 should consume `Task.hasSubmissionHistory()` and the shared file downloader; it must not
reintroduce duplicate upload actions or replace finite API failures with a spinner.
