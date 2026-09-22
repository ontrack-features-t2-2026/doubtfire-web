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
| CAL-D00 | Complete: Apple Calendar subscribed to five expected events; manual refresh removed and restored the excluded unit | [Feed report and live screenshots](../../CAL-D00-webcal-feed-test.md) |
| CAL-A01 | Partial: keyboard interactions and phone-width layout observed; native UI failures prevented a verified screen-reader session and recording | [Accessibility report](../../CAL-A01-accessibility-verification.md) |
| CAL-C01 | Complete: Apple, Google and Outlook each showed all four intended single all-day dates; Unicode and client newline display behavior recorded | [Compatibility report](../../CAL-C01-calendar-compatibility.md) |

The counts and exact event contents were checked in all six files. [The validation manifest](exports/validation.json) records file checksums and checks. The saved student target grade remained High Distinction throughout the local download-filter tests.

## Capture notes

- `ontrack-dashboard.png` and `ontrack-task-action-row.png` show the real controls on CAL101.
- The filter captures show the selected options and expected result count. The corresponding downloaded files establish the actual event selection.
- `keyboard-empty-state.png` shows Pass with exclusion enabled: no matching task and a disabled Download button. `keyboard-mobile-download.png` uses a 390 × 844 viewport; the temporary override was then reset.
- `webcal-included-unit.png` and `webcal-excluded-unit.png` show the settings area; the subscription URL is below the visible viewport and is not captured. Development demo masking was disabled before these captures.
- `apple-unicode.png`, `apple-dst.png`, `apple-year-boundary.png` and `apple-leap-day.png` are native Apple Calendar screenshots of the committed compatibility fixture. Only synthetic events and the app's built-in public holidays are visible.
- `apple-live-five-events.png`, `apple-live-excluded-unit.png` and `apple-live-restored-unit.png` record the actual **OnTrack CAL-D00 Local Test** subscription. Apple Calendar showed all five intended due events, then only CAL102 after excluding CAL101 and manually refreshing, then all five after restoring CAL101 and refreshing again. The observations at 11 and 27 seconds are sampling upper bounds, not exact refresh latencies. Automatic refresh remained set to **Every week** and was not tested.
- Google originally reported **Imported 4 out of 4 events** in **OnTrack CAL-C01 Test 2026-09-21**. After restoring one accidentally deleted synthetic event from that calendar's Trash, `CAL-TEST` search returned exactly the four original events, with no re-import or duplicates. `google-four-events.png` records their intended single all-day dates; `google-dst.png` and `google-unicode.png` show individual details. The complete accessible name retained the Unicode and punctuation, including 40 trailing **é** characters; Google displayed the newline as a space and visually ellipsized the long detail title. The day grid showed GMT+10, but the account's configured timezone was not confirmed. Only the dedicated test calendar was enabled for verification, and the seven original visibility settings were restored afterwards.
- Outlook imported the same fixture through **Upload from file** into a new private **OnTrack CAL-C01 Test 2026-09-21** calendar. The import confirmation was observed; `outlook-four-events.png` shows exactly four selected-calendar search results, each labelled All day on its intended date. Full accessible titles retained Unicode and punctuation, including 40 trailing **é** characters. The list normalized the newline to whitespace, while the inspected title field removed it and joined `andline breaks`; no edit was made. The account timezone was not confirmed. The personal calendar was deselected during verification and its visibility restored afterward.
- The Apple import created a local calendar named **calendar-compatibility**. The synthetic test calendars were retained with their verified fixture events. No personal events were edited.

The first native-app attempt paused when the Mac locked and the local HTTP subscription warning awaited confirmation. After the Mac was unlocked, **Continue** was selected on the warning; the Apple subscription and manual-refresh observations then completed. The resumed A01 attempt could not establish VoiceOver speech or captions, and no OBS recording was started. The test machine then stopped responding to native input, preventing further testing and confirmation that VoiceOver was turned off. The [A01 report](../../CAL-A01-accessibility-verification.md) records the exact failures and unverified cleanup state. Screen-reader output has not been inferred from accessibility-tree text or automated tests.
