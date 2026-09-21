# Objective closure evidence — 21 September 2026

The original GitHub implementation for the three objectives is merged. Connected review found additional defects; [web #273](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/273) fixes keyboard access, narrow layouts and theme colours, and [API #173](https://github.com/ontrack-features-t2-2026/doubtfire-api/pull/173) preserves spreadsheet originals in retained submission history. These follow-ups are submitted for review, not merged by their author.

Maple Fox is the designated objective lead and both the student-facing and staff-facing reviewer. This assignment does not claim that Maple has performed the review. The [exact per-ticket completion steps](REVIEW.md#exact-completion-path) and recording templates are in [REVIEW.md](REVIEW.md); the short executed demonstration is in [DEMO.md](DEMO.md).

## Tested candidate and scope

| Part                       | Revision and environment                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Web baseline               | Merged `11.0.x`, `283b493367681d1abab23e5fe7c633ba3a57e5c2`                                                                                 |
| Web application fixes      | `898a1db6f7145c9f0b5ecd899957b4c758f91add`, local Angular development server, real API requests                                             |
| Web chair/editor follow-up | `63069182fd176c54865f5c2f21ad46013e3dd3a7`; five style/template files only; chair/Monaco checks and portable Chrome chat suite retested     |
| Final application source   | `c3c1aa02ecbb9522d7ec8d3dab00cfade15f2690`; readable named PDF/image buttons with final keyboard/focus checks in Chrome, Firefox and WebKit |
| API baseline               | Merged `11.0.x`, `d7f7a5b9c2d34ef279ac3a70bc58823def64005c`                                                                                 |
| API tested candidate       | `7722612ef019b03bd6b4fb9319b83c52b0dac902`                                                                                                  |
| Fixture                    | Disposable database and synthetic student, tutor, chair and admin accounts; no real student work                                            |
| Processing                 | Actual queued submission and history jobs, actual TeX conversion, isolated worker; resulting task artifacts made available to the live API  |
| Integrations               | TII/D2L disabled locally; Overseer UI enabled for a disabled synthetic automation fixture. These fixture settings are not product changes   |

Browser checks use the real application and API. Playwright controls the browsers; DOM/ARIA snapshots are supporting accessibility evidence, not an actual screen-reader result. Simulated drag/drop and clipboard events do not establish physical OS clipboard behavior. CSS zoom and emulated colour preference are labelled separately from native browser zoom and physical OS changes. Playwright WebKit is not Safari.

## Findings fixed during connected review

| Finding                                                                                              | Result and evidence                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enter was prevented in the attachment dialog, suppressing native button activation                   | Removed only default-action prevention; Enter remains contained in the dialog. Browser cancellation/posting works, with a regression test                                                                                                           |
| Comment editor lacked a usable name; emoji, feedback template and save icons were mouse-only         | Named textbox and native buttons with focus indication and toggle state                                                                                                                                                                             |
| Chair upload fields lacked contextual accessible names                                               | Named requirement table, filename/category/history controls, add/delete actions; actual keyboard selection and history toggle verified                                                                                                              |
| Profile appearance overflowed a 320px viewport; peer-progress hint used a fixed dark colour          | Appearance bounds changed from x=-52/right=372 to x=16/right=304. Document width is 320px; measured dark hint contrast is 6.71:1                                                                                                                    |
| Analytics controls overlapped/overflowed narrow layouts; calendar sticky header stayed white in Dark | Controls and date fields wrap; calendar/loading colours use semantic tokens                                                                                                                                                                         |
| Selected task editor had white panels with inherited light text; upload toolbar also stayed white    | Task list/editor wrappers use semantic surfaces, selected/hover states and contained horizontal scrolling. Desktop document width changed from 1,533 to 1,280px; narrow document width is 320px. Footer text contrast is 14.09:1, Add button 5.42:1 |
| Outgoing PDF link had 1.00:1 contrast and could not receive keyboard focus                           | Named native PDF/image buttons inherit readable message text; PDF contrast is 6.56:1. Final Enter and visible 2px focus checks pass in all three tested engines                                                                                     |
| Retained submission-history filter omitted the existing `csv` category                               | API #173 includes CSV/XLS/XLSX originals. Actual XLSX browser submission → processing → history ZIP preserves the original checksum                                                                                                                 |

## Executed upload and lifecycle evidence

The chair requirement controls are keyboard-operable and have contextual names. The browser selected another category and restored Spreadsheet, toggled history and restored it, and reloaded to verify the fixture was unchanged; no requirement write was sent.

An executable was rejected in the task uploader before a submission request. A real XLSX submission returned HTTP 201, ran the actual submission/history jobs, and reached **Awaiting Feedback** in the UI. The browser then downloaded the current `submission-4.zip`; its `000-csv.xlsx` entry is 1,452 bytes and matches the original SHA-256 `eace58411a30588aabf716056e0327270511bbb21bfaf63cfebdd84ea57cb47c`. This run establishes XLSX end to end; CSV/XLS retention also has API regression coverage, but this run does not claim separate browser submissions for them.

Chat CSV, DOCX and XLSX post with HTTP 201 and authorised downloads match original bytes. Existing PDF, image and audio attachments still post and are retrieved through their viewers. Legacy media is compressed/converted by the existing API; byte identity is asserted for generic document/spreadsheet downloads, not converted media. Empty, executable and exactly 30,000,000-byte chat files are rejected before a request. A spoofed XLSX receives HTTP 403 from the API; a valid retry receives HTTP 201, with the draft retained. Picker cancellation, simulated drop and simulated image paste preserve the draft.

| Chat browser           | Executed result                                    | Recorded exception                                                                                   |
| ---------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Chrome 153.0.8010.48   | [15 passed](evidence/chat-chrome.json)             | Physical clipboard/screen-reader checks remain manual                                                |
| Firefox 155.0          | [14 passed, 1 not run](evidence/chat-firefox.json) | Engine did not retain files in the synthetic ClipboardEvent; actual clipboard behavior is unverified |
| Playwright WebKit 26.6 | [15 passed](evidence/chat-webkit.json)             | Native Enter tested; platform Tab preference/native Safari keyboard behavior is not certified        |

After the final viewer fix, [Chrome](evidence/viewer-final-chrome.json), [Firefox](evidence/viewer-final-firefox.json) and [WebKit](evidence/viewer-final-webkit.json) each pass two additional focused PDF/image checks at `c3c1aa02e`: native Enter opens the viewer, media fetches return 200, and the named controls have visible solid 2px keyboard focus. Firefox uses actual Shift-Tab/Tab to establish keyboard focus modality.

These groups include the application file-input flow at 390px, dialog bounds and focusable Cancel/Post controls. The first narrow harness attempt raced responsive component replacement by directly setting its old input; the final run opens the actual file picker after the layout settles. Legacy viewer expectations were corrected to account for existing media conversion. These harness corrections are not additional application fixes. [Fixtures and checksums](samples/manifest.json) and [optional reproduction scripts](scripts/README.md) are included.

The prior production-proxy run remains historical evidence: [deploy boundary results](https://github.com/ontrack-features-t2-2026/doubtfire-deploy/blob/df4519b16acf66cca68ce0eabfcd08f45ea3907b/production/tests/results/upload-boundaries-20260921.jsonl). It tested deploy `8038777` with API `6ca598ce`, including 29,999,999-byte acceptance, 30,000,000-byte application rejection and a real proxy-limit rejection. No new Nginx run is claimed for the local development-server browser run. The history-only API change does not change these limits.

## Automated checks and source audit

The [theme browser report](BROWSER-RESULTS.md) records 28 passed signed-out scenarios across Chrome, Edge, Firefox and Playwright WebKit, 16 passed authenticated groups, five Chrome staff routes and an actual PDF rendering check. Four additional WebKit authenticated groups failed with a calendar timeout followed by protocol-frame navigation errors. Those failures are disclosed and are not a native Safari pass. Real Monaco theme switching preserved the model id, version and content length. Native browser zoom, actual OS theme changes and installed/offline PWA behavior remain unrun. A later [source-frozen WebKit probe](evidence/theme-webkit-final-probe.json) also failed before completing profile persistence; WebKit theme acceptance remains unresolved, including repeatability of the earlier profile pass.

- 77 focused Angular tests pass, including the attachment Enter regression, composer behavior, theme state and upload requirements.
- 14 first-paint, compiled-theme and contrast checks pass.
- Angular application typecheck passes. The web PR's remote build, full test and lint jobs pass on the application-fix commit.
- API #173: 25 focused tests / 116 assertions pass; remote five-worker unit suite, aggregate, lint, production image builds and CodeQL pass.
- The reproducible source audit at final application commit `c3c1aa02e` finds [1,185 regex candidates](evidence/theme-source-audit.json) in 142 files / 105 component directories: 546 semantic-review, 196 special-surface, 56 decorative-review, 352 palette, 34 comment/example and 1 print/browser. These are candidates, not 1,185 defects. See the [existing ranked audit and migration map](../theme/THEME-REVIEW-AND-REGRESSION.md#ranked-findings-and-migration-map) and the observed findings above. Unreviewed route/state combinations remain unreviewed.

## Remaining ticket decisions

| Ticket     | Technical evidence supplied                                                                                        | Exact remaining closure action                                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FILE-T02   | API/proxy regression evidence, connected chat checks, real XLSX processing/history download, chair keyboard checks | Complete or explicitly disposition the unrun device/assistive/role scenarios in [the upload matrix](REVIEW.md#file-t02-connected-regression-and-file-mvp01-demo); review the two follow-up PRs |
| FILE-MVP01 | Integrated demonstration, source/PR index, preserved originals and risk list                                       | Maple reviews the demonstration and records MVP scope, deferred risks/owners and the leadership decision                                                                                       |
| THM-D01    | Updated source inventory, route evidence and measured findings                                                     | Complete the named unrun high-impact route observations in [the reconciliation](AUDIT-AND-FOLLOWUPS.md); MG-04/MG-05 are now linked and attributed                                                             |
| THM-T01    | Current automated results and executed browser evidence                                                            | Retain the exact tested matrix and record remaining reproduction/coverage gaps; do not imply the full cross-product ran                                                                        |
| THM-M04    | Actual special-surface evidence where exercised                                                                    | Complete or explicitly disposition remaining editor/viewer/export/print/installed-PWA/device scenarios and documented fallbacks                                                                |
| THM-Q01    | Keyboard, geometry, DOM/ARIA and measured contrast evidence                                                        | Maple performs and records the two role sessions plus actual screen-reader/native-browser/device observations or approved limitations                                                          |
| THM-JL01   | Current source/target, dependency history and existing review links                                                | Maple and the repository maintainer record the branch/upstream/fallback/ownership decision; prior code approvals do not imply that complete decision                                           |

No additional Submission Lifecycle and Reliability implementation ticket was identified after its merged PRs. The spreadsheet-history defect found in this review is covered by API #173 and the connected evidence above.

## Limits that must remain visible

This report does not certify the whole application, every route/state/theme/size combination, native Safari, physical mobile devices, actual VoiceOver/NVDA, installed/offline PWA behavior, OS clipboard handling, human discoverability or leadership approval. Required unrun checks remain NOT RUN/BLOCKED until executed or explicitly accepted as a release limitation. Existing FILE-S01 follow-ups for aggregate quotas, simultaneous submissions and abandoned-worker cleanup are not marked solved by format support. Safe-format support is not a malware scanner.

Use the [dated decision template](REVIEW.md#dated-leadership-and-branch-decision-template) to record observations and GO / CONDITIONAL GO / NO-GO. All human-review checkboxes remain unchecked until Maple actually reviews and confirms them.
