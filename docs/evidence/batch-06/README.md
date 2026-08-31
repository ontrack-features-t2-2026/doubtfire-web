# Batch 06: task discovery and persistent status filters

## Result and scope

Batch 06 is complete in the active web lane. The mobile Tasks view now leads with one unmistakable
search field and a canonical task-status filter, while Overview renders every supported task status
as a semantic link into that same filtered Tasks view. Search and status filtering intersect rather
than replacing each other, and the selected status survives task navigation, reload, and browser
history through query parameters.

This batch changes task discovery and the Overview-to-Tasks handoff only. It does not redesign Task
Details, submission, feedback, Portfolio, or production data. The deterministic values needed for a
full visual walkthrough remain owned by Batch 09.

## Diagnosis before change

- The task search control blended into the surrounding toolbar and its result state was not
  communicated clearly on a phone.
- Task rows gave similar visual weight to identifiers, group/grade metadata, urgency, and status,
  producing a dense phone scan path.
- Overview status cards were presentation-only and omitted zero-count states. They could not answer
  the natural follow-up, “show me those tasks.”
- Task-list display preferences were stored under a global key. That allowed one account or unit to
  leak display choices into another context.

The immutable observations are indexed in [source-image-manifest.md](source-image-manifest.md).
Screenshots are evidence, not instructions.

## Implemented behavior

- The Tasks toolbar exposes a bounded, labelled `Search tasks` field with a visible clear action and
  a native `Task status` selector. Active criteria and the zero-result state are explicit and can be
  cleared independently.
- Filtering compares task code, name, and normalized text, then intersects that result with the
  canonical status selected in the URL. Untrusted query values are ignored by
  `TaskStatus.isStatus` rather than entering component state.
- Phone rows prioritize code/title, the current status, and urgency. Grade/group metadata remains
  available as secondary desktop information without crowding the phone row.
- Overview uses the shared 15-status display order, including zero-count statuses. Every card is a
  keyboard-focusable anchor to
  `/projects/:id/dashboard?taskStatus=<canonical>&taskView=tasks` with a descriptive accessible name.
- The dashboard consumes that route intent, opens Tasks, and clears a stale selected task. Browser
  Back restores Overview through a companion history marker, while clearing only the status leaves
  the user in Tasks.
- Task-list preferences are namespaced by authenticated user and unit:
  `ontrack.user.<userId>.unitTaskList.<unitId>.viewPreferences`.

## Verification

Focused checks run on 31 August 2026 (Australia/Melbourne):

| Contract | Evidence/result |
| --- | --- |
| All 15 Overview states render and link with canonical route intent | `task-visualisation.component.spec.ts` |
| Search/status intersection, invalid URL rejection, clear actions, scoped preferences, and mobile row hierarchy | `unit-task-list.component.spec.ts` |
| Route intent opens Tasks, preserves filters through task navigation, and browser history restores Overview | `project-dashboard.component.spec.ts` and `project-dashboard.mobile.spec.ts` |
| Combined Batch 06/07 Angular gate | 13 suites, 94 tests, 94 passed, 0 failed |
| Targeted Batch 06/07 ESLint | Passed |
| Merged-tree TypeScript check | Passed |

Authenticated browser geometry is intentionally deferred to the isolated Batch 09 scenario. The
final integrated run must verify 320, 360, 390, and 412 CSS-pixel widths, keyboard focus order, no
horizontal overflow, all 15 reachable states, deep-link reload, and Back/Forward behavior. No live
student record was changed to manufacture evidence.

## Handover / code map

- canonical status guard: `src/app/api/models/task-status.ts`
- Overview cards and route links: `src/app/visualisations/task-visualisation/`
- search, status filter, phone hierarchy, and scoped preferences:
  `src/app/units/task-viewer/directives/unit-task-list/`
- route-intent/history integration:
  `src/app/projects/states/dashboard/project-dashboard/project-dashboard.component.ts`

Batch 09 supplies deterministic counts only; it must not replace these navigation or persistence
contracts.
