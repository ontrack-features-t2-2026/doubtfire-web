# Calendar download: design notes and codebase findings

## Summary

Add the ability to download task due dates as an `.ics` file, alongside the existing WebCal
subscription (a live feed). Two entry points:

1. The per-unit **Progress Dashboard**, to download the current unit's tasks.
2. The global **calendar modal**, to download across the units a student is enrolled in, using the
   modal's existing unit selection to choose which units/subjects are included.

The download is a one-time file. The WebCal subscription remains the option for a live-updating feed.

## Placement

### Progress Dashboard (per unit)

- Component: `progress-dashboard.component` (`src/app/projects/states/dashboard/directives/progress-dashboard/`), rendered by `project-dashboard` at route `projects/:projectId/dashboard`.
- The button fits in the "Plan Your Tasks" card (`task-planner-card.component`), beside "View Task Planner". That card already receives the project (`[project]` input) and is about task due dates. `task-planner-card` currently holds no service injections; the download logic can live there (with a service injected) or in the parent `progress-dashboard.component`, which already holds `project` and injects services.
- Data readiness: the dashboard route resolves **progressively**. `project.resolver.ts:11` sets `resolveProgressively = url.includes('/dashboard')`; the progressive branch (`project.resolver.ts:22-27`) emits a project stub immediately and loads tasks asynchronously. The download action must not assume `project.tasks` is populated at first render. Gate the button on task availability (disable until `project.tasks` is loaded) or resolve tasks at click time. This differs from the Task Planner route `projects/:projectId/plan`, which blocks until mapping completes.

### Calendar modal (across units)

- Component: `calendar-modal.component` (`src/app/common/modals/calendar-modal/`), opened from the header calendar entry point and the Task Planner.
- The modal already loads the user's projects: `projectService.query(undefined, {params: {include_in_active: false}})`, filtered to active teaching periods (`calendar-modal.component.ts:56-60`), held as `projects: Project[]` (`ts:30`).
- The modal already has a unit include/exclude mechanism backed by `webcal.unitExclusions`: `includedProjects` / `excludedProjects` getters (`ts:205-222`) and `includeExclusion` / `removeExclusion` (`ts:227-246`), rendered as removable unit chips (`calendar-modal.component.html:52-77`).
- The modal already exposes the live feed URL (`webcalUrl` + `.ics`, `calendar-modal.component.html:190`).
- Projects returned by `query()` are list summaries and do not carry loaded task caches. A client-side multi-unit build would need to load each unit's tasks first.

## Date resolution

- Resolve a task's date by calling `Task.localDueDate()`. Do not read `Task.dueDate`, `TaskDefinition.dueDate`, or `TaskDefinition.targetDate` directly as a shortcut around it.
- On `TaskDefinition` the field names are inverted relative to their meaning: `localDueDate()` returns `targetDate` (`task-definition.ts:180`), while `localDeadlineDate()` and `finalDeadlineDate()` return `dueDate` (`task-definition.ts:221, 245`). `dueDate` is the deadline; `targetDate` is the due/target date.
- `Task.localDueDate()` (`task.ts:294-312`) is the correct resolver. It handles flexible dates, the student's custom target date, and grade target dates, and falls back through `dueDate` to `definition.localDueDate()`. The shared event builder (`calendar-event-builder.ts`) already calls it and returns a `YYYY-MM-DD` civil-date string, which avoids a daylight-saving off-by-one that a `Date`-instant path would introduce.

## ICS generation

- No ICS/iCalendar generation library is present. `package.json` carries `angular-calendar` (a UI widget), `date-fns`, and `moment` only, and there is no `VCALENDAR`/`VEVENT` code in `src`. A client-side download builds the `.ics` text directly.
- Text escaping (RFC 5545 3.3.11), backslash first: `\`->`\\`, `;`->`\;`, `,`->`\,`, newline->`\n`. Lines end with CRLF. Each `VEVENT` requires a `DTSTAMP`.
- All-day dates use the `YYYYMMDD` form with `DTSTART` equal to `DTEND`, matching the WebCal backend. The end date is not advanced by a day; that convention belongs to the Google Calendar template URL, not to ICS.
- To match the existing feed, events also carry `STATUS:CONFIRMED`, `X-DOUBTFIRE-UNIT` (unit id), `X-DOUBTFIRE-TASK` (task definition id), and `UID` of the form `E-<taskDefinitionId>`.

## Download mechanisms

Two approaches exist in the codebase:

- URL-based: `FileDownloaderService.downloadFile(url, filename)` (`file-downloader.service.ts:152`) fetches a URL and saves the response as a file. This suits saving the existing WebCal feed URL directly, in which case the server produces the `.ics` and the unit selection is already applied by `unitExclusions`.
- In-memory: build the string, `new Blob([ics], {type: 'text/calendar;charset=utf-8'})`, `URL.createObjectURL`, then `FileDownloaderService.downloadBlobToFile(url, filename)` (`file-downloader.service.ts:141`) and `releaseBlob(url)` (`file-downloader.service.ts:130`). An equivalent self-contained pattern is used for CSV export at `students-list.component.ts:140-156`.

## Grade and task-status fields

- Grade values: Fail -1, Pass 0, Credit 1, Distinction 2, High Distinction 3 (`unit.ts:91-95`, `grade.service.ts`).
- Per-task grade: `task.definition.targetGrade`. Limit to a target grade with `task.definition.targetGrade <= grade`. `Project.activeTasks()` (`project.ts:182`) applies this against the saved `project.targetGrade`; `unit.taskDefinitionsForGrade(grade)` (`unit.ts:239`) is the definition-level equivalent.
- `project.tasks` (`project.ts:125`) is unfiltered; a grade-limited download must apply the filter explicitly.
- Task completion: `task.inFinalState()` (`task.ts:670`) returns `TaskStatus.FINAL_STATUSES.includes(status)`. `task.submissionDate` is available where a "submitted" predicate is preferred.

## Feature scope

- Download a unit's calendar: a button on the Progress Dashboard that downloads the current unit's tasks as an `.ics`.
- Download from the calendar modal: a download action in the modal that saves the calendar across the user's units.
- Customise the download: choose which units/subjects to include, from the calendar modal, reusing the existing unit include/exclude selection; optionally a target grade level.
- Grade and status variants: limit the download to a target grade (high distinction only, or a chosen grade), or exclude completed tasks.

## Related existing behaviour

The WebCal subscription generates events server-side (`doubtfire-api` `webcal.rb`) and already filters by target grade and by unit exclusions. The download reuses the shared event builder's title/date/uid format so downloaded events match the feed.