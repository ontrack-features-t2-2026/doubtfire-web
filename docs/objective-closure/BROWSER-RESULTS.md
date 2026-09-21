# Theme browser evidence — 21 September 2026

Real Angular application served at `http://127.0.0.1:4311`, backed by disposable Rails fixtures. No static substitute pages or production credentials were used. Theme matrix source: web `63069182fd176c54865f5c2f21ad46013e3dd3a7`; earlier profile/student runs used `898a1db6f7145c9f0b5ecd899957b4c758f91add` (the later commit changes only task editor/upload-footer styles). API includes history recovery fix `7722612`.

| Area                                                                                            | Result                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signed-out boot/storage/reload/live emulated system changes                                     | 28/28 passed: Chrome 153, Edge 153, Firefox 155, Playwright WebKit 26.6; seven scenarios per browser                                                                                                                                                                   |
| Chrome/Edge/Firefox authenticated profile, persistence, calendar modal and three student routes | 15/15 groups passed                                                                                                                                                                                                                                                    |
| Playwright WebKit authenticated profile                                                         | Light/Dark/System, keyboard selection, backend writes, 320px fit, reload and fresh-context persistence passed in the run omitting synthetic CSS zoom; four later groups failed: calendar control timeout and three navigation protocol-frame errors (see compact JSON) |
| Chrome staff routes                                                                             | 5/5 routes passed: tutor analytics, chair task editor/analytics, admin institution settings/units; route success does not certify complete responsive reflow                                                                                                           |
| Chrome real Task Sheet PDF                                                                      | Passed: actual PDF canvas rendered; light/dark chrome and 320px capture; PDF document remains white                                                                                                                                                                    |
| Monaco                                                                                          | Actual disabled synthetic script opened; theme changed from `vs-dark` to `vs` with identical model id, version and content length; no code was saved or executed                                                                                                       |

A final source-frozen WebKit probe at `c3c1aa02e` still failed before completing profile/persistence, followed by a calendar timeout and lost protocol frames. See [its recorded failure](evidence/theme-webkit-final-probe.json). The earlier profile success is an observed run, not repeatable WebKit acceptance. The separate final PDF/image keyboard checks pass in all three tested engines.

## Measured fixes

- Profile Appearance at 320px: document width320, left16/right304; before fix left−52/right372 and document width372. Dark helper text contrast6.71:1.
- Tutor/chair analytics at 320px: document width320 after wrapping download/date controls (before410). Calendar heading contrast14.09:1 after replacing white background.
- Selected chair task editor at 320px: document width320 (before806); desktop width1280 (before1533). Wide child tables scroll within their section instead of extending the page. Dark heading contrast14.09:1. Surface, muted, hover and selected state tokens replace hardcoded white/gray wrappers.

## Limits and unresolved observations

- WebKit is Playwright WebKit, **not Safari**. Authenticated runs with CSS zoom twice lost their browser protocol frame. A bounded run without CSS zoom establishes profile persistence, but the subsequent calendar check timed out and navigation again lost its protocol frame; do not claim complete WebKit authenticated workflow coverage. Earlier setup/selector failures were corrected and are not counted as product defects.
- Emulated media is not a physical OS appearance change. 200% CSS zoom is not native browser zoom; a native zoom capability probe did not apply zoom. Native200% reflow remains a human check. Signed-out CSS zoom expands the form beyond the1280px layout; this is not evidence of native-browser zoom behavior.
- Admin campus/units data tables require horizontal page scrolling at320px (document widths1231 and694). They render readable themed cells, but full mobile table reflow is not certified. These are distinct from the fixed clipped profile controls/overlapping analytics controls.
- The unselected Overseer child pane and native file input widgets retain light chrome. Do not describe every third-party/native surface as recolored.
- Keyboard and accessible-name checks are automation, not a human screen-reader/usability assessment. No axe result is claimed. Early animation-frame root markers are not compositor-filmstrip proof of no flash.
- Actual Safari, OS theme changes, installed/offline PWA lifecycle and independent human assessment remain pending. Maple Fox is the assigned reviewer; this evidence does not sign on their behalf.

## Small representative screenshot set

1. [chrome-profile-system-light-320.png](evidence/chrome-profile-system-light-320.png) — profile controls fit at320px.
2. [chrome-tutor-analytics-calendar-charts-dark-320.png](evidence/chrome-tutor-analytics-calendar-charts-dark-320.png) — analytics controls/calendar in narrow Dark mode.
3. [chrome-chair-selected-task-dark-after.png](evidence/chrome-chair-selected-task-dark-after.png) — selected task editor with readable token surfaces.
4. [chrome-chair-monaco-dark.png](evidence/chrome-chair-monaco-dark.png) — actual Monaco script rendering in Dark mode.
5. [chrome-task-sheet-pdf-dark-desktop.png](evidence/chrome-task-sheet-pdf-dark-desktop.png) — real PDF canvas and dark surrounding controls.

See [the compact matrix](evidence/theme-browser-matrix.json) for executed checks and failures. Full local route captures and ARIA snapshots remain in the private QA output directory; the representative screenshots below are committed with this report.

## Completed follow-up checks

After combining #251 and the Gantt fixes, source `64d6acd65` passes [15 Chrome chat groups](evidence/chat-combined-chrome.json), [two Firefox](evidence/viewer-combined-firefox.json) and [two WebKit](evidence/viewer-combined-webkit.json) viewer checks. This does not resolve the separate authenticated WebKit theme failure. The latest `ebd97e4a2` changes only attribute order required by lint.

The [actual chart export](evidence/gantt-export-result.json) uses light tokens and black-on-yellow bar text (13.31:1), then restores the screen's Dark palette without changing the saved preference. [Download PNG](evidence/gantt-ink-safe.png) contains the complete synthetic timeline. [Chromium print-to-PDF](evidence/gantt-print.pdf) uses readable light colours but retains viewport clipping; it is not a full-range print pagination result. The synthetic flexible-date setting was restored after capture.

To repeat: use a disposable unit with flexible dates enabled, sign in as its synthetic student, choose Dark and open Plan Tasks. Select Download Chart, inspect the saved PNG labels and full timeline, then verify the app remains Dark. Print the same page to a landscape PDF and inspect its actual output. Restore the fixture setting. This tests Chromium's print path; it does not certify native Safari or physical printing.

The [native WebKit diagnostics](evidence/webkit-native-faults.json) record six Networking-process IPC/guard terminations coinciding with the earlier frame errors. The triggering request remains unknown. The final chart capture was run after restarting the frontend to clear a stale development error overlay from the temporary conflict-resolution state; the final application compiled and the fresh capture passed.
