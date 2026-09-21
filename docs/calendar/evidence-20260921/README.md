# Calendar verification — 21 September 2026

This directory contains actual UI captures and unchanged downloads from a real local OnTrack web/API instance with synthetic students and tasks. The [environment instructions](environment.md) identify the source revisions, isolation and required development setting. Screenshots of the current implementation are not historical before-images or generated mockups.

## Ticket results

| Ticket | Result | Evidence |
| --- | --- | --- |
| CAL-F05 | Complete: HD-only selected one HD event | `filter-hd-only.png`; [HD-only export](exports/CAL101-tasks-HD-and-above.ics) |
| CAL-F06 | Complete: Pass/Credit/Distinction/HD produced 1/2/3/4 events | `filter-grade-pass.png`, `filter-grade-credit.png`, `filter-grade-distinction.png`, `filter-grade-hd.png`; [export results](exports/README.md) |
| CAL-F07 | Complete: exclusion reduced four tasks to Redo and Fix and resubmit | `filter-grade-hd.png`, `filter-exclude-submitted.png`; [outstanding export](exports/CAL101-tasks-HD-outstanding.ics) |
| CAL-DOC01 | Complete: guide includes actual application screenshots | [Calendar guide](../../CAL-DOC01-calendar-how-to.md) |
| CAL-UX01 | Complete: current task action row and dashboard captured; labelled mockup retained | [Placement notes](../../CAL-UX01-placement-notes.md) |
| CAL-D02 | Complete: investigation supplemented with actual unit inclusion/exclusion screenshots | [Investigation](../../CAL-D02-webcal-filtering-investigation.md) |
| CAL-D00 | Pending: local HTTP warning needs confirmation; no live client subscription or refresh observation | [Feed report](../../CAL-D00-webcal-feed-test.md) |
| CAL-A01 | Partial: keyboard interactions and phone-width layout observed; screen reader and recording pending | [Accessibility report](../../CAL-A01-accessibility-verification.md) |
| CAL-C01 | Partial: Apple four-date import verified; Google accepted 4/4 but detailed checks pending; Outlook pending | [Compatibility report](../../CAL-C01-calendar-compatibility.md) |

The counts and exact event contents were checked in all six files. [The validation manifest](exports/validation.json) records file checksums and checks. The saved student target grade remained High Distinction throughout the local download-filter tests.

## Capture notes

- `ontrack-dashboard.png` and `ontrack-task-action-row.png` show the real controls on CAL101.
- The filter captures show the selected options and expected result count. The corresponding downloaded files establish the actual event selection.
- `keyboard-empty-state.png` shows Pass with exclusion enabled: no matching task and a disabled Download button. `keyboard-mobile-download.png` uses a 390 × 844 viewport; the temporary override was then reset.
- `webcal-included-unit.png` and `webcal-excluded-unit.png` show the settings area; the subscription URL is below the visible viewport and is not captured. Development demo masking was disabled before these captures.
- `apple-unicode.png`, `apple-dst.png`, `apple-year-boundary.png` and `apple-leap-day.png` are native Apple Calendar screenshots of the committed compatibility fixture. Only synthetic events and the app's built-in public holidays are visible.
- Google displayed **Imported 4 out of 4 events** in the explicitly selected **OnTrack CAL-C01 Test 2026-09-21** calendar. That confirmation alone does not establish correct dates or text. A screenshot containing unrelated calendar names was not added to GitHub.
- The Apple import created a new local calendar named **calendar-compatibility**. Both test calendars were retained for the unfinished checks. No personal events were edited.

The Mac locked during the native-app checks. No native actions continued after the tool reported the lock. The live-feed warning was not accepted without the requested confirmation. No live-client refresh, screen-reader speech or recording has been inferred from source code or automated tests.
