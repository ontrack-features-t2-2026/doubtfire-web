# CAL-D00: What the existing WebCal feed produces

Before treating the WebCal feed as limited, this records what it actually generates, taken from the source (`doubtfire-api/app/models/webcal.rb`) and confirmed by subscribing in a calendar client.

## Feed shape

The feed is a single per-student iCalendar (`Webcal#to_ical`). The calendar declares a product id from the institution config and a one-day refresh interval, set on both `X-PUBLISHED-TTL` and `REFRESH-INTERVAL`, so subscribed clients re-poll roughly daily.

## Which tasks appear

`Webcal#task_definitions` selects the task definitions for the student's enrolled, active projects, in active and currently-running units, and applies two filters:

- units the student has excluded are left out (via `WebcalUnitExclusion`),
- only task definitions at or below the student's target grade for that unit are included (`task_definitions.target_grade <= projects.target_grade`).

## Events per task

Each task definition produces one **end (due) event**, and also a **start event** if the student has enabled start dates.

- **Title:** `"{unit code}: {task abbreviation}: {task name}"`, for example `COS10001: 2.3P: Pass Task 2.3 - My Drawing Procedure`. With start dates enabled, titles are prefixed `Start:` and `End:`.
- **Date:** all-day, with `DTSTART` equal to `DTEND` in `YYYYMMDD` form and no time zone. The due date is the student's task due date if a task record exists, otherwise the definition's target date.
- **UID:** `E-{taskDefinitionId}` for the end event and `S-{taskDefinitionId}` for the start event. These are keyed on the task definition, so the same task shares a UID across students, which is what lets a client update the event in place on refresh.
- **Status:** `CONFIRMED`.
- **Reminder:** if the student has set a reminder, each event carries a display alarm that triggers the configured time before the event.
- **Custom properties:** `X-DOUBTFIRE-UNIT` (unit id) and `X-DOUBTFIRE-TASK` (task definition id).

The feed does not set a description, URL, or location on events, and it does not exclude completed tasks; every applicable task definition appears regardless of submission state.

## Confirmed in a calendar client

Subscribed as `student_1` (COS10001) and opened the feed in [calendar app used]. Observed: [events appeared with the titles and all-day due dates described above; excluded a unit via the modal and confirmed it dropped from the feed after refresh]. Fill this line with what you actually saw so the note reflects a real subscription, not only the source.

## Takeaway

The feed already covers a student's current units, filtered by target grade and by any units they exclude, as all-day events with stable UIDs and optional reminders and start dates. Its limits are narrow and specific: it always uses the saved target grade rather than a chosen one, and it includes completed tasks. Those two points are the subject of CAL-D02.
