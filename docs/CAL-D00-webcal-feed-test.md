# CAL-D00: What the existing WebCal feed produces

Before treating the WebCal feed as limited, this records what the implementation generates based on the source (`doubtfire-api/app/models/webcal.rb`). Live calendar-client verification is still required and is tracked below.

## Feed shape

The feed is a single per-student iCalendar (`Webcal#to_ical`). The calendar declares a product id from the institution config. Merged API PR #147 corrected the refresh value to `PT4H` on both `X-PUBLISHED-TTL` and `REFRESH-INTERVAL`. This is a four-hour refresh hint; each calendar client decides when it actually refreshes.

## Which tasks appear

`Webcal#task_definitions` selects the task definitions for the student's enrolled, active projects, in active and currently-running units, and applies two filters:

- units the student has excluded are left out (via `WebcalUnitExclusion`),
- only task definitions at or below the student's target grade for that unit are included (`task_definitions.target_grade <= projects.target_grade`).

## Events per task

Each task definition produces one **end (due) event**, and also a **start event** if the student has enabled start dates.

- **Title:** `"{unit code}: {task abbreviation}: {task name}"`, for example `COS10001: 2.3P: Pass Task 2.3 - My Drawing Procedure`. With start dates enabled, titles are prefixed `Start:` and `End:`.
- **Date:** all-day, with `DTSTART` equal to `DTEND` in `YYYYMMDD` form and no time zone. The due-date chain is the task's `local_due_date` when a task record exists, then the target-grade-specific date for a flexible-date unit, then the task definition's `target_date`. Start events use the analogous `local_start_date`, target-grade-specific start date, and task definition `start_date` chain.
- **UID:** `E-{taskDefinitionId}` for the end event and `S-{taskDefinitionId}` for the start event. These are keyed on the task definition, so the same task shares a UID across students, which is what lets a client update the event in place on refresh.
- **Status:** `CONFIRMED`.
- **Reminder:** if the student has set a reminder, each event carries a display alarm that triggers the configured time before the event.
- **Custom properties:** `X-DOUBTFIRE-UNIT` (unit id) and `X-DOUBTFIRE-TASK` (task definition id).

Task events do not set a description, URL, or location, and the feed does not exclude submitted or completed tasks; every applicable task definition appears regardless of submission state.

## Optional learning sessions

The current API also includes published HelpHubs, lectures and classes when `include_learning_sessions` is enabled. These are timed UTC events with their real end times, stable occurrence UIDs, a sequence and last-modified timestamp, optional location and joining URL. Cancelled sessions carry `STATUS:CANCELLED` and omit joining links. Sessions are restricted to current active units in which the student remains enrolled, and use the same unit exclusions; grade filtering only applies to tasks.

Source checked on 20 September 2026 against API `bb360dfa626f30e22c1382e20ef43c06ce6b38fa` and web `a35f2826ddff8a816175490c108f1794779c3254`. The server's equal task DTSTART/DTEND is a compatibility risk requiring a separate client check; the unit file exporter uses a next-day exclusive end.

## Calendar-client verification status

On 21 September 2026, the [isolated fixture](calendar/evidence-20260921/environment.md) was served by API `d7f7a5b9` and web `283b49336`. The real Web calendar switch enabled the synthetic account's feed. A direct HTTP diagnostic returned five events: four CAL101 tasks, including the submitted and complete tasks, and one CAL102 task. Start dates, reminders and learning sessions were off. This confirms the server response, not calendar-client rendering.

Apple Calendar 27.0 reached its subscription confirmation, but warned that the local `127.0.0.1` feed used an insecure HTTP connection. Confirmation was requested before continuing; the Mac subsequently locked. No live subscription, calendar refresh or removal observation is claimed. **CAL-D00 remains open.** No subscription URL or token is included in this evidence.

To complete the calendar-client evidence once the Mac is unlocked and the local connection warning has been approved:

1. Subscribe as a seeded student and record the client, client version, and test date.
2. Confirm the event titles and all-day dates against the generated feed.
3. Exclude a unit through the modal, refresh the subscription, and record whether its events disappear.

Record actual observations before claiming client verification is complete. [CAL-C01](CAL-C01-calendar-compatibility.md) supplies the import fixture and explicitly records which client checks have not been performed.

## Takeaway

Source inspection shows that the feed covers a student's current units, filtered by target grade and by any units they exclude, as all-day events with stable UIDs and optional reminders and start dates. Its limits are narrow and specific: it always uses the saved target grade rather than a chosen one, and it includes completed tasks. Those two points are the subject of CAL-D02.
