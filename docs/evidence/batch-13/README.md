# Batch 13 — Task Planner and Web Calendar

Completed: 2026-08-31

## Scope and inputs

This batch changes only Task Planner, its task-connections dialog, Web Calendar, and the existing planner-card ICS download call site. It does not change API schema, live student data, demo scenario data, or unrelated feature pages.

The shared `AGENTS.md`, work pack, baseline, and completed Batch 03–05 handovers were read before implementation. The five Batch 13 screenshots in `/Users/ryan/Downloads/screenshot-context.zip` were inspected as evidence only; hashes and observations are in [source-image-manifest.md](source-image-manifest.md).

## Diagnosis

The phone defect was structural rather than a missing scroll hint: the desktop `ngx-gantt` side table and time grid were being rendered unchanged into the phone surface. Turning dates or above-target tasks on added rows/columns to the same clipped desktop grid. Target grade, calendar access, and toggles also competed for the same horizontal space.

The calendar dialog had a separate responsive-layout problem. Long unit chips, inline reminder controls, and desktop-width provider tabs shared one row. This caused tab clipping and separated the lower-case `before each event` suffix from the control it described. The dialog also lacked a direct ICS download action through the Batch 04 feedback path.

## Result

### Task Planner

- Phones at `≤639.98px` use task cards; the desktop gantt is not rendered visually in the phone layout.
- Every card exposes grade category, code/title, current status text and icon, a compact start-to-due range, dependency counts, and native 44px `View connections` / `Open task` actions.
- `Show task dates` expands labelled `Start date`, `Target / due date`, and `Deadline` fields. At 320px those fields stack; at wider phones they form three columns.
- `Show tasks beyond target grade` remains project-scoped and persistent, and now refreshes the same card/timeline data immediately.
- Target-grade selection, calendar access, and display toggles stack at narrow widths.
- Selecting `View connections` opens a responsive, internally scrollable dialog. The existing prerequisite card remains intact, while dependent tasks use a phone card list instead of a squeezed table. The desktop dependent table is retained.
- The richer desktop gantt, dates table, baseline data, flexible-date actions, link highlighting, and image export remain available above the phone breakpoint.

### Web Calendar

- The modal uses a viewport-bounded surface with an internal vertical scroller, safe-area-aware actions, focus on the dialog container, and restored launch focus on close.
- Unit chips wrap without horizontal overflow and have explicit remove/add controls.
- The reminder is one `fieldset`: `Remind me [Amount] [Time unit] before each event.` Save and cancel actions are textual and keyboard reachable.
- Google, Apple, and Outlook tabs are all visible on a 320px viewport; each has provider-specific instructions.
- The subscription URL wraps safely. Copy, regenerate, and download actions stack to full width on phones.
- Initial settings failure ends in an error with `Retry`, not a permanent spinner.
- `Download .ics` uses `FileDownloaderService.downloadFileWithFeedback` with `OnTrack-calendar.ics`. The dashboard planner-card's generated ICS export now uses the matching Batch 04 blob-feedback helper.

## Verification

### Focused automated checks

From `doubtfire-web`:

```text
npm run typecheck
  PASS (Angular application typecheck, exit 0)

npm test -- --no-watch --no-progress \
  --include src/app/projects/states/plan/project-plan.component.spec.ts \
  --include src/app/projects/states/plan/task-planner/task-planner.component.spec.ts \
  --include src/app/projects/states/plan/task-planner/task-planner-prerequisites-modal/task-planner-prerequisites-modal.service.spec.ts \
  --include src/app/common/modals/calendar-modal/calendar-modal.component.spec.ts \
  --include src/app/common/modals/calendar-modal/calendar-modal.service.spec.ts \
  --include src/app/projects/states/dashboard/directives/progress-dashboard/task-planner-card/task-planner-card.component.spec.ts \
  --include src/app/api/services/ics-calendar-builder.spec.ts
  PASS: 7 files, 51 tests

npx eslint --max-warnings 0 <Batch 13 TypeScript and template files>
  PASS (exit 0)

npx prettier --check <Batch 13 TypeScript, template, and SCSS files>
  PASS (all matched files use Prettier style)
```

The final targeted run count is 51 because it includes an explicit assertion that the beyond-target toggle rebuilds visible planner data.

From the running API container, against its isolated test database:

```text
RAILS_ENV=test bundle exec ruby -Itest test/api/webcal_api_test.rb
  PASS: 15 runs, 76 assertions, 0 failures, 0 errors, 0 skips
```

The API contract test proves that the public GUID endpoint returns HTTP 200, `Content-Type: text/calendar`, and an unquoted CRLF-delimited `BEGIN:VCALENDAR … END:VCALENDAR` payload. No API source change was required.

### Live browser geometry

The local synthetic `student_1` account and project 2 (`COS10001`) were used. No live or production data was touched.

- 320, 360, 390, and 412px phone widths: document horizontal overflow was exactly 0; mobile cards were visible; the desktop gantt was hidden; card bounds stayed within the viewport; both card actions measured 44px high.
- At 320px, 22 task cards rendered. Expanding task dates produced one readable column; at 360–412px it produced three date columns.
- 1440×900 desktop: document horizontal overflow was 0; the mobile cards were hidden; the existing desktop gantt remained visible at 1376px wide with its calculated 1032px task height.
- 320×844 Web Calendar: the dialog stayed between x=16 and x=304; its content had 0 horizontal overflow and finite internal vertical scrolling. All four unit chips stayed between x=41 and x=271. Google, Apple, and Outlook tabs stayed between x=49 and x=271. Copy, regenerate, download, and close actions measured 44px high.
- The 320px result is the narrowest phone/200%-zoom-equivalent CSS layout in this check. Native controls, labelled regions/articles/definitions, visible status text, dialog headings, and explicit button names were present in the accessibility snapshot. Desktop gantt bars retain tested `role="button"`, `tabindex="0"`, Enter, Space, focus, and hover behavior.

Exact measured values are recorded in [browser-geometry.json](browser-geometry.json).

## Regression boundaries

- No Task Planner API or persistence contract changed.
- No project, task, unit, calendar, or demo fixture data was created or altered for evidence.
- Desktop gantt/table behavior was preserved rather than restyled into the mobile cards.
- The download helper owns network downloads and status feedback; caller-created blob URLs are still released by the existing planner-card caller.
- No Batch 09 registry file was changed or read as executable instruction.

## Files in this batch

- `src/app/projects/states/plan/project-plan.component.{html,scss,spec.ts}`
- `src/app/projects/states/plan/task-planner/task-planner.component.{ts,html,scss,spec.ts}`
- `src/app/projects/states/plan/task-planner/task-planner-prerequisites-modal/task-planner-prerequisites-modal.component.{html,scss}`
- `src/app/projects/states/plan/task-planner/task-planner-prerequisites-modal/task-planner-prerequisites-modal.service.ts`
- `src/app/projects/states/plan/task-planner/task-planner-prerequisites-modal/task-planner-prerequisites-modal.service.spec.ts`
- `src/app/common/modals/calendar-modal/calendar-modal.component.{ts,html,scss,spec.ts}`
- `src/app/common/modals/calendar-modal/calendar-modal.service.ts`
- `src/app/common/modals/calendar-modal/calendar-modal.service.spec.ts`
- `src/app/projects/states/dashboard/directives/progress-dashboard/task-planner-card/task-planner-card.component.{ts,spec.ts}`
- `docs/evidence/batch-13/{README.md,source-image-manifest.md,browser-geometry.json}`
