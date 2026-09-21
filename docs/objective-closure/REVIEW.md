# Review and closure checklist

Start with [RESULTS.md](RESULTS.md) for the executed checks, exact source revisions, evidence and remaining gaps. This guide supplies the manual scripts and decision record; it does not turn an unrun check into a pass.

**Maple Fox is the designated objective lead, student-facing reviewer and staff-facing reviewer.** This is the chosen review arrangement; no additional person is requested for the two perspectives. Record each role's observations, but do not describe them as separately independent approvals. Reviewer assignment is not acceptance; leave the boxes unchecked until the actual review is completed and confirmed. Existing PR approvals cover their code-review scope; this checklist records observations and decisions without adding a permission gate to technical work.

## Exact completion path

The implementation and repository evidence are submitted in [web #273](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/273) and [API #173](https://github.com/ontrack-features-t2-2026/doubtfire-api/pull/173). Both require another contributor's code review. Their author is not asked to merge them. No Planner update, team-chat post, duplicate implementation branch or empty deploy PR is needed for this GitHub-only handover.

| Ticket | What to do now | Evidence to record / completion condition |
| --- | --- | --- |
| THM-D01 | Read the [MG-04/MG-05 crosswalk and route reconciliation](AUDIT-AND-FOLLOWUPS.md). For each NOT RUN high-impact route, execute the named theme check and replace its row with a specific blocker or scoped no-blocker result. | Keep the existing raw audit, counts, migration order and attribution. Do not repair all regex hits or recreate the MG documents. A missing rendered observation remains missing. |
| THM-T01 | Use the [existing commands and matrix](../theme/THEME-REVIEW-AND-REGRESSION.md#repeatable-test-commands), [browser scripts](scripts/README.md), CI links and assigned gaps. Record any later rerun against its actual revision. | The test-pack deliverable can be reviewed with disclosed failures/gaps; a second person's rerun is useful evidence, not an extra approval gate. Q01 owns the actual human usability assessment. |
| THM-M04 | Review each of the [eight special-surface rows](#m04-special-surface-pass). Add the remaining print/export, QR, viewer/error and installed/offline results where applicable; record a named follow-up or approved fallback for each unavailable surface. | The ticket permits a completed result, approved fallback or named follow-up per surface. Do not silently convert an unrun or failed check into PASS. |
| FILE-T02 | Review the combined acceptance-to-test matrix and actual upload evidence. Complete the short outstanding native clipboard/assistive checks, or record their result as BLOCKED/NOT RUN with the reason and next action. | Existing API tests may establish CSV/XLS/XLSX and security cases; separate browser submissions for every extension and a whole-theme browser cross-product are not added requirements. Attach an overall PASS/FAIL/BLOCKED result scoped to the evidence. |
| THM-Q01 | Perform the student-facing U-S1–U-S5 and staff-facing U-F1–U-F5 sessions below. Then record actual screen-reader, native 200% zoom, live OS System switching and supported-browser observations. | Sign only observations actually performed. State that Maple Fox supplied both perspectives. Classify findings and give GO / CONDITIONAL GO / NO-GO; any limitation must be explicit. |
| THM-JL01 | Complete the [branch and scope decision](#dated-leadership-and-branch-decision-template): actual PR path, upstream plan or none, fallback, owners, dependencies and MVP boundary. | Maple Fox signs as objective lead; an identified repository maintainer separately confirms branch/scope. Existing code approvals can cover only their stated scope. |
| FILE-MVP01 | Watch the [recorded demo](DEMO.md), review the final regression result and PR states, and fill the scope/risk/next-cohort fields in the same decision record. | Maple Fox records the objective-lead decision; an actual OnTrack leadership decision is linked. Open PRs remain “submitted for review,” not “integrated.” That integration step belongs to the reviewing team. |

Use the scripts below once per agreed core journey; reuse the observation in every ticket it supports. Record browser/version, OS, candidate SHA, actual result and evidence link. [AUDIT-AND-FOLLOWUPS.md](AUDIT-AND-FOLLOWUPS.md) names the unrun routes and their coordinator. The tests' prepared evidence is not Maple Fox's own usability review.

The reference baseline for preparing this guide is merged web `11.0.x` at `283b493367681d1abab23e5fe7c633ba3a57e5c2` and API `11.0.x` at `d7f7a5b9c2d34ef279ac3a70bc58823def64005c`. [RESULTS.md](RESULTS.md) records the actual build tested, including any subsequent fixes. The seven original implementation PRs are merged; their links and scope are in [the reference section](#scope-and-evidence-already-available).

## Session record to fill before manual checks

```text
Run ID:
Executed by:
Reviewer: Maple Fox
Role in this run: student-facing / staff-facing / objective lead / other (name)
Date/time and timezone:
Web branch + full SHA:
API branch + full SHA:
Deploy branch + full SHA / image digests / effective proxy limit:
Local/test origin: [sanitised, no private host or query token]
OS/version:
Browser/version:
Assistive technology/version: [actual reader, or NOT RUN]
Viewport and zoom:
Resolved theme and selected preference:
Fixture version/checksum:
Synthetic role aliases: student-A / student-B-outsider / tutor-A / chair-A / admin-A
Evidence location:
Result: PASS / FAIL / BLOCKED / NOT RUN / NOT APPLICABLE
Observed result:
Issue/follow-up, owner and retest link:
```

Use synthetic users, units, tasks and files. Screenshots/recordings must not include real names, marks, student work, cookies, tokens, developer-tool request headers or private links. A local harness counts only for the part it actually exercises: mocked API, browser emulation and stubbed child components must be labelled. Browser emulation is not a physical-device or real screen-reader result.

## Short reviewer usability script

Give Maple Fox the tasks first, without coaching where the control is. Record discovery time, assistance, errors and what the reviewer says each choice means. Repeat as separate student-facing and staff-facing sessions; keep the single-person arrangement explicit.

### Student-facing session

| ID   | Action                                                                                                                                                       | Expected observation                                                                                                                 | Evidence to retain                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| U-S1 | Starting at the synthetic student home, find the appearance preference and explain Light, Dark and System before choosing one                                | Preference is discoverable; labels are understandable; System is understood as following the device rather than a third fixed colour | Time to find, route taken, assistance required, reviewer explanation                   |
| U-S2 | Choose Dark; navigate to dashboard, task details, feedback and plan; refresh a deep route                                                                    | Selection is retained; task dates/status words, links, warnings and navigation stay readable; no confusing theme reset               | Sanitised paired screenshots and observations                                          |
| U-S3 | Choose System; leave the page open and change OS appearance both ways; then choose Light and change OS again                                                 | System follows live changes and remains selected; explicit Light stays Light                                                         | Short recording or sequential timed observations; record actual OS change vs emulation |
| U-S4 | Read a task’s Spreadsheet requirement before opening the picker; explain which formats and limits apply; open then cancel the upload/attachment confirmation | CSV/XLS/XLSX guidance is discoverable for task Spreadsheet; cancel is obvious; no unwanted submission or lost draft                  | Reviewer answer, guidance and cancellation evidence                                    |
| U-S5 | Open Previous submissions and an available synthetic archive; distinguish current, previous and unavailable entries                                          | Date/status and generated archive filename are understandable; available download works; unavailable entry is clearly explained      | Reviewer answer and byte/filename comparison where downloaded                          |

### Staff-facing session

| ID   | Action                                                                                                        | Expected observation                                                                                              | Evidence to retain                                             |
| ---- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| U-F1 | As synthetic tutor, find appearance control without coaching; explain System; return to marking inbox in Dark | Preference location and meaning understood; selected task, status text, feedback and controls remain readable     | Discovery time, assistance, reviewer explanation, paired views |
| U-F2 | Open synthetic PDF/code feedback; select code text; change appearance and return                              | Viewer chrome and focus readable; content not inverted; selection/model/undo preserved where editor supports them | Observed content/selection result and screenshots              |
| U-F3 | As synthetic unit chair, create/update a test Spreadsheet requirement and inspect it as student-A             | Stable category saves; student sees CSV/XLS/XLSX before selecting; exact configured file count/limit agrees       | Chair/student screenshots tied to same synthetic task          |
| U-F4 | Inspect a marking/status confirmation and an admin destructive confirmation, then cancel                      | Consequence remains explicit in words, focus is visible and Cancel is available; no action occurs on cancellation | Keyboard path and observed unchanged fixture                   |
| U-F5 | Explain any remaining difficulty or uncertainty in both themes                                                | Usability defects are recorded as findings instead of assumed absent                                              | Quote or faithful notes, severity, linked action               |

After each session record: completed without help / completed with help / unable; perceived result; readability or meaning lost; preferred improvement; reviewer name/date. A screenshot alone does not establish discoverability or understanding.

## Theme manual matrix and exact acceptance checks

Record the agreed coverage across the required routes, Light, Dark, System-light and System-dark, desktop/narrow widths, 100% and native 200% zoom, and Chromium, Firefox and Safari where available. Execute applicable representative combinations; add 320px checks where the existing accessibility baseline calls for them. Keep unrun combinations and reasons visible. This does not require every possible cross-product combination or a new physical-device purchase.

For each route test its applicable normal, loading, empty, error, disabled, selected, warning and destructive states. Record NOT APPLICABLE with a reason when a state cannot occur. Record BLOCKED with device/fixture/permission reason when it should occur but cannot be tested.

| Check              | Exact action and expected result                                                                                                                                                                                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keyboard           | Use Tab/Shift-Tab to reach appearance control and all critical actions; use native arrow keys/Space for radio selection, Enter/Space for buttons, Escape where supported. Focus must be visible, not obscured; no trap; selection and focus remain distinguishable                                                                       |
| Screen reader      | With actual VoiceOver/NVDA or the approved reader, reach the appearance group, each option, upload confirmation, validation message, download and status. Record names, roles, checked/disabled/busy/error state and change announcements. Reading DOM/ARIA alone is supporting evidence, not a screen-reader pass                       |
| Contrast           | Measure rendered text/link/control/focus pairs in the selected, warning/error and overlay states. Record foreground/background, ratio and tool. Check normal text 4.5:1, large text 3:1, necessary UI/focus boundaries 3:1 under the existing accessibility baseline; document valid exemptions rather than blanket-pass disabled states |
| Non-colour meaning | Describe task status, urgency, chart series, selected/hidden series and upload error without relying on colour. Require visible words/icons/patterns as appropriate                                                                                                                                                                      |
| Zoom/narrow        | Set actual browser zoom to 200%; inspect both designated widths; open dialogs and menus with long fixture labels. Critical text/actions must remain reachable and not clipped or overlap                                                                                                                                                 |
| Persistence        | Change preference, navigate, refresh, open a direct route, sign out/in using the same synthetic account; verify the documented account/local reconciliation. Record different-account result separately so inherited preference is not mistaken for an authorization rule                                                                |
| First paint        | Cold-load/direct-load with saved Dark under OS Light and saved Light under OS Dark; record a frame sequence or slow-load recording. A single final screenshot cannot prove absence of a flash                                                                                                                                            |
| Failure states     | Use controlled offline/failed requests; errors remain readable, attachment draft survives, and navigation/refresh recovery remains usable. Do not treat a stubbed request as an API/proxy check                                                                                                                                          |

### M04 special-surface pass

1. Dashboard charts: labels, axes, grid, legend, tooltip, hide/show series and empty/error state. Verify series meaning remains available without colour.
2. Plan/Gantt: weekends, today, bars, hover/selection/focus and narrow scrolling. Export the synthetic plan to PNG and read every label. PNG intentionally follows the screen appearance; record this fallback, not an ink-safe-print claim.
3. Calendar: month/week/day headers where exposed, events, today marker, selected ranges, tooltips and empty state. Verify calendar dates/rules remain unchanged.
4. Monaco/code/diff: load a synthetic code document, select/edit where allowed, switch theme, undo, and reopen. Text, line numbers, selection, errors and focus must remain usable without loss of content/model state.
5. PDF/file viewers: normal/load/error/search/download controls where supported; document pixels stay unchanged while surrounding controls follow theme.
6. Date picker, emoji picker, QR/camera surfaces: labels, search, focus and failure; QR pixels/quiet zone must stay scannable in both appearances. A camera/hardware scan is recorded separately from a screenshot.
7. Browser print preview: compare Light and Dark with synthetic task/status data. Output uses readable light/ink-safe styling and preserves status words; no hidden interface/private data appears. Inspect an actual exported artifact separately from preview.
8. PWA/browser: in a supported installed browser, verify browser theme colour, install/update prompts, standalone launch, cached offline direct route and refresh in both appearances. The static manifest splash is branded `#3939ff`; record whether leadership accepts this documented limitation. Lack of a device/install capability is BLOCKED, never PASS.

## FILE-T02 connected regression and FILE-MVP01 demo

Use the synthetic fixture inventory from the API validation pack. Record filename, type, size and checksum for each safe fixture; do not create live exploit or real student fixtures.

| ID  | Action                                                                                                                                 | Expected result                                                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Chair configures task Spreadsheet; student reads requirements then submits CSV, XLS and XLSX in separate supported runs                | Stable `csv` category; original workbook bytes/worksheets retained; PDF carries download notice; configured task count and limit respected                                                                                                        |
| F2  | Run one approved file in each configured task category; repeat an old task definition and existing attachment                          | PDF, curated Code, Image and Archive retain their documented behaviour; no category/key migration or inaccessible legacy content                                                                                                                  |
| F3  | Attach chat DOCX, CSV and XLSX; also existing PDF/image/audio; retrieve as authorised student/staff/group member                       | Accepted according to server policy; correct safe metadata; generic Office downloads are attachment-only and byte-preserving                                                                                                                      |
| F4  | Try chat XLS, executable, unsupported archive, empty, renamed/spoofed, malformed/encrypted/active-content fixture, and oversize file   | API rejects according to contract even if browser checks are bypassed; no attachment stored; readable safe error; draft remains                                                                                                                   |
| F5  | Choose via picker, drag/drop, then paste a screenshot into an existing written draft                                                   | Each reaches one confirmation; clipboard tested separately; duplicate browser paste events do not create duplicate posts                                                                                                                          |
| F6  | Confirm, cancel, remove a selection, simulate upload failure, retry, and send text-only                                                | Cancellation/removal/failure preserve written text; uploading status visible; retry works without duplicate side effects; plain text paste/send unchanged                                                                                         |
| F7  | Download as authorised user; repeat request as outsider or with another synthetic task/attachment ID; check missing/deleted attachment | Authorised bytes only; outsider denied with existing safe 403/404 behaviour; no name/path/content leakage                                                                                                                                         |
| F8  | Run direct API and actual Nginx proxy boundaries using recorded app/proxy config                                                       | Chat 29,999,999-byte valid payload accepted, 30,000,000 rejected; task configured maximum inclusive and maximum+1 rejected; proxy-over-limit returns JSON 413. Include multipart overhead and distinguish an app rejection from a proxy rejection |
| F9  | Repeat composer/confirmation/download at narrow width, 200% zoom, keyboard-only and actual screen reader                               | Guidance, names, focus, error announcements and controls usable; no clipped essential action                                                                                                                                                      |

Task default is 10,000,000 bytes when no explicit configuration overrides it; chat requires strictly less than 30,000,000 bytes. The current proxy default is 1g, with a validated minimum 32m. Record the real configuration; do not claim all layers have the same numeric cap.

For the short demonstration show F1 → F3 → F5 → F6 → F4 → F7 → F8 using only synthetic content. A test log plus concise recording/screenshots is acceptable evidence; a script without execution is not. Include author attribution for existing FILE-A01/F01/DOCX/FILE-S01 work.

Review remaining FILE-S01 risks explicitly: aggregate quotas, simultaneous submission race coverage, abandoned-worker cleanup, and the fact that this feature is not a malware scanner. Each is Fixed with proof, Accepted for this release with a reason/owner, or assigned a dated follow-up. Do not silently mark them solved by safe-format support.

## D01 and T01 evidence finishing steps

1. Run `node scripts/theme/audit-colours.mjs <full-tested-web-SHA>` and retain JSON/command/date; record raw candidates, unique files and unique component directories separately.
2. Classify every high-impact finding: semantic, decorative, brand, third-party, print/browser or false positive; theme blocker, related migration or irrelevant. Record file/line or selector, route, token/action, impact, risk, effort and owner. The automatic classifier is preliminary.
3. For each high-impact role/route attach a named blocker or an actually observed no-blocker result. Keep source-only review separate from a rendered-route pass.
4. Reuse the existing [MG-04 catalogue](../migration/ui-catalogue.md) and [MG-05 style guide](../css-style-guide.md), with the dated attribution and theme-impact crosswalk in [AUDIT-AND-FOLLOWUPS.md](AUDIT-AND-FOLLOWUPS.md). Those artifacts have been located; no missing-artifact lookup is required.
5. Link existing baseline screenshots with their original SHA/date. Any new final-build screenshot must be labelled final rather than retrospectively “before.”
6. Record migration order: existing D01 → D02 → F01 history; M01 precedes page/special-surface migration; M02/M03/M04 may run in parallel after shared contracts; T01 evolves alongside them; Q01 and MVP review follow. Give current owner or UNASSIGNED for each child.
7. Attach current automated commands/logs and standard checks; use the existing Angular workflow. Record unrelated/flaky failures with observed impact and owner rather than removing tests. The final matrix must list the exact scope a second contributor can reproduce.

## Dated leadership and branch decision template

Complete this with actual decisions, not inferred consent from a merge or from assignment of reviewer names.

```text
Decision ID / date:
Objective: Light, Dark, and System Theme Support / Safe Upload Formats and Chat File Support
Objective lead: Maple Fox
Repository maintainer: [name + role]
OnTrack leadership reviewer for MVP: [name + role]

Validated release candidate:
  web full SHA:
  API full SHA:
  deploy full SHA and configuration:
Organisation branch:
Upstream repository and branch (or explicitly not part of this release):
PR target:
Integration/t2-2026 context: [reconcile #192 comment with the selected 11.0.x validation target]
Fallback/rollback branch or last known-good release:
Current competing branch/PR disposition:
Existing contributor work preserved:
MG-04: docs/migration/ui-catalogue.md (20 September snapshot, d16f6201c)
MG-05: docs/css-style-guide.md (same snapshot; attribution in AUDIT-AND-FOLLOWUPS.md)

MVP includes:
Deferred with owner and issue:
Future work:
Core student/tutor/chair/admin journey results:
Open blockers:
Open major findings, fix/owner/release decision:
Approved browser/device/PWA/export limitations:
Security risk dispositions:
Single-person student/staff review arrangement: Maple Fox; no separate independent reviewer claimed.

Recommendation: GO / CONDITIONAL GO / NO-GO
Reason:
Conditions and due dates:
Evidence index:
Next-cohort starting point and first action:

```

- [ ] Maple Fox confirms the branch/scope/dependency/owner record above.
- [ ] Repository maintainer confirms the named organisation/upstream/target/fallback path.
- [ ] Maple Fox has actually completed and recorded the student-facing review.
- [ ] Maple Fox has actually completed and recorded the staff-facing review.
- [ ] The report discloses which accessibility/browser/device checks were not run.
- [ ] Objective lead accepts the stated MVP scope and risk/limitation dispositions.
- [ ] OnTrack leadership records the final MVP decision.

```text
Signed by / role / date / permanent review or decision link:
```

Existing approvals may fill only the scope they explicitly cover. Maple Fox may sign the three designated roles, with that fact visible; do not invent a second reviewer or retroactive independence. For THM-Q01, record Maple Fox's actual observations for both the student-facing and staff-facing sessions under the chosen arrangement. The report should state that these are one person's two perspectives. It must not relabel automated checks or implementation-agent observations as Maple Fox's own review.

## Status rules and final closure record

- **PASS:** executed at the stated source/environment, observed expected result, linked evidence.
- **FAIL:** executed and mismatch found; include severity, issue/owner, fix and retest.
- **BLOCKED:** intended check cannot run because a named prerequisite/device/environment is unavailable; record exact unblock action.
- **NOT RUN:** not attempted; no evidence-based result.
- **NOT APPLICABLE:** precise approved scope reason; not a substitute for a missing fixture.
- **Completed:** the ticket's applicable implementation, evidence and required human decisions are all recorded. A green suite, merge or prepared template alone does not close manual criteria.
- **In progress:** implementation exists but required execution/evidence/decision remains. State the exact remaining rows.
- **Deferred:** leadership explicitly removes a named item from this release, with reason, owner and follow-up. Keep it distinct from completion.
- **Future work:** outside the accepted MVP boundary; do not re-label a failed mandatory check as future work.
- **GO:** no open core-journey blocker; required evidence and decisions are complete.
- **CONDITIONAL GO:** no open core-journey blocker; named limitations/major issues have explicit ownership and leadership disposition.
- **NO-GO:** any unreadable permission, destructive, submission or marking state, security/access-control failure, or unresolved core-journey blocker. A blocked required check with no approved limitation does not support GO.

Final per-ticket row:

| Ticket     | Implementation/PR state            | Executed evidence links | Remaining rows                         | Human decision link | Status and reason                                               | Owner / next action                   |
| ---------- | ---------------------------------- | ----------------------- | -------------------------------------- | ------------------- | --------------------------------------------------------------- | ------------------------------------- |
| THM-D01    | Fill from current evidence         |                         |                                        |                     | In progress until required evidence is reconciled               |                                       |
| THM-JL01   | Code-specific approvals exist      | Review links above      | Complete current dual-role decision    |                     | In progress; full decision not found in inspected records       | Maple Fox + named maintainer          |
| THM-T01    | Automated implementation merged    |                         |                                        |                     | Fill from current run                                           |                                       |
| THM-M04    | Implementation merged              |                         |                                        |                     | Fill from actual surface checks                                 |                                       |
| THM-Q01    | Matrix/automated support merged    |                         | Human/device/assistive observations    |                     | In progress until recorded; single-person arrangement disclosed | Maple Fox                             |
| FILE-T02   | Regression implementation merged   |                         |                                        |                     | Fill from cross-repository run                                  |                                       |
| FILE-MVP01 | Required implementation PRs merged |                         | Connected demo, risks, human decisions |                     | In progress until final evidence and decision                   | Maple Fox + named leadership reviewer |

## Ticket closure map

| Ticket     | Remaining concrete action                                                                                                                                                                                                                      | Person/role to record it                                                               | Closure evidence                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| THM-D01    | Reproduce raw and deduplicated audit at final SHA; classify high-impact findings; attach Light baseline or identify dated existing baseline; reconcile every required route; reuse the linked MG-04/MG-05 artifacts and crosswalk | Audit executor; Maple Fox reviews scope; existing MG owners retain attribution         | Exact command/output, counts, route rows, screenshot index, blocker/action table and MG links. Do not call candidate counts defect counts                                               |
| THM-JL01   | Record current branch/upstream/target/fallback decision, MVP boundary, child owners or explicit unassigned entries, dependency order, competing-branch disposition and existing-code attribution                                               | Maple Fox as objective lead plus an identified repository maintainer                   | Explicit dated approval of the completed decision record by both roles; existing code approvals above can be referenced but not expanded                                                |
| THM-T01    | Attach automated output from the current build and a repeatable visual matrix; fill executed rows and leave gaps visible; have a second contributor reproduce if available                                                                     | Test executor; reviewer records any reproduction                                       | SHAs, commands, raw logs, environment, route/theme/state/size/browser matrix and named follow-ups. A matrix may be published before every browser row runs, but this does not close Q01 |
| THM-M04    | Execute real chart/calendar/editor/viewer/print/export/offline/PWA/browser checks below; accept or assign each documented fallback                                                                                                             | Maple Fox covers student/staff review; maintainer/lead records fallback decisions      | Surface-by-surface result with evidence, issue links and explicit approved limitations                                                                                                  |
| THM-Q01    | Complete keyboard, screen-reader, contrast, zoom, responsive, browser and usability observations; retest blocker fixes; make a go/conditional-go/no-go recommendation                                                                          | Maple Fox, designated for both student-facing and staff-facing roles                   | Separate role scenario records, actual observations, browser/device matrix and signed recommendation; disclose single-person arrangement                                                |
| FILE-T02   | Join current frontend/API/proxy tests with actual picker/drop/paste, cancellation/failure/retry, legacy, access-control and boundary checks                                                                                                    | Test executor plus Maple Fox for browser role checks                                   | One acceptance-to-test matrix, logs, fixture inventory, browser results and final PASS/FAIL/BLOCKED summary                                                                             |
| FILE-MVP01 | Confirm integrated source/policy/docs; demonstrate final connected scenarios; disposition security risks; index evidence; record handover and leadership decision                                                                              | Maple Fox as objective lead; named OnTrack leadership reviewer for leadership decision | PR/merge SHAs, completed/ongoing/deferred/future register, demo evidence, next-cohort actions and signed release decision                                                               |

Administrative status records should reference [RESULTS.md](RESULTS.md) and the completed decision record. This guide does not itself update those systems.

## Scope and evidence already available

Reference snapshot, read 21 September 2026. Use the actual tested revisions in [RESULTS.md](RESULTS.md) for new evidence, not the old workbook status:

- Web: `11.0.x` at `283b493367681d1abab23e5fe7c633ba3a57e5c2`.
- API: `11.0.x` at `d7f7a5b9c2d34ef279ac3a70bc58823def64005c`.
- Deploy: record the exact checkout, image digests and effective upload limit used in the run.
- The earlier implementation/integration evidence remains useful historical evidence. Do not present its branch SHAs as results for the newer merged build without a rerun or an explicit unchanged-code explanation.
- The source workbook/export is a historical task register. It does not establish current completion, current ownership or human approval.

The delivered implementation PRs are now merged by other reviewers: [web theme #257](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/257), [web upload #262](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/262), [web lifecycle #254](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/254), [API safe logging #167](https://github.com/ontrack-features-t2-2026/doubtfire-api/pull/167), [API upload #171](https://github.com/ontrack-features-t2-2026/doubtfire-api/pull/171), [API lifecycle #168](https://github.com/ontrack-features-t2-2026/doubtfire-api/pull/168), and [deploy #37](https://github.com/ontrack-features-t2-2026/doubtfire-deploy/pull/37). Their integration state was read from GitHub on 21 September 2026. Merge status does not establish browser, assistive-technology, usability or release acceptance.

Use these existing repository documents rather than creating another policy:

- Web [theme review and regression guide](../theme/THEME-REVIEW-AND-REGRESSION.md): current audit method, ranked blockers, role/route/surface matrix and test commands.
- Web [theme contract](../theme/THEME-CONTRACT.md): preference and semantic-token contract; historical approval placeholders must not be mistaken for a current execution report.
- Web [historical theme MVP validation plan](../theme/THEME-MVP-VALIDATION-PLAN.md): deliberately unrun August plan. Preserve its snapshot and attribution; link a dated execution report instead of rewriting its history.
- Web [student workflow migration](../theme/THM-M02-student-workflow-migration.md): existing student work and screenshots.
- Web [upload and chat guide](../safe-upload-and-chat-guide.md), [FILE-A01 policy matrix](../FILE-A01-safe-upload-policy-matrix.md); API [API upload contract](https://github.com/ontrack-features-t2-2026/doubtfire-api/blob/d7f7a5b9c2d34ef279ac3a70bc58823def64005c/docs/uploads/safe-upload-contract.md): implemented limits, formats, tests, attribution and exclusions.
- Existing accessibility baseline: [web #243](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/243) and [PPI accessibility checklist](../ppi-accessibility-review-checklist.md). These checks extend that baseline for themes and uploads; they do not certify the whole site.

## What existing reviews actually approve

Read-only inspection covered merged theme PRs #109, #119, #132, #136, #139, #140, #141, #164, #188, #200, #240, #241, #244 and #257, plus the reviews/comments on closed #192. The permanent review links below identify the inspected evidence; the GitHub review records were read on 21 September 2026.

| Existing record                                                                                                                                                                                                                                                   | Supported conclusion                                                                                    | Not established                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [UmedaRanuluge review of #119](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/119#pullrequestreview-5047915627) and [blankb0t review](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/119#pullrequestreview-5049712153), 28 August | Explicit approval of the theme contract and its implementation boundaries                               | Named objective-lead plus repository-maintainer approval of the complete JL01 branch/upstream/fallback record |
| [Sujay-Deakin review of #132](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/132#pullrequestreview-5059825117), 30 August                                                                                                                         | Foundation code approval on a PR targeting `feature/theme`                                              | Approval of every later branch or final release                                                               |
| [Maple Fox review of #188](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/188#pullrequestreview-5192913760), 14 September                                                                                                                         | Approval to land the foundation once in `11.0.x`, with explicit reconciliation of overlapping #192 work | Live phone/browser result; full JL01 ownership/MVP/fallback decision                                          |
| [Maple Fox review of #200](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/200#pullrequestreview-5193307592), 14 September                                                                                                                         | Approval of a focused child change and its reconciled parent path                                       | Approval of parent #192; the review expressly held it pending live evidence                                   |
| [Clupai8o0 review of #241](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/241#pullrequestreview-5254009024), 19 September                                                                                                                         | Preference-control implementation approval                                                              | Human keyboard/screen-reader or Q01 usability sign-off                                                        |
| [Maple Fox review of #244](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/244#pullrequestreview-5259899094), 20 September                                                                                                                         | Student migration approval, tests and explicitly scoped production-CSS/browser-template evidence        | Physical-device screen reader and installed PWA; these were explicitly not performed                          |
| [Clupai8o0 review of #257](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/257#pullrequestreview-5262879710), 21 September                                                                                                                         | Special-surface implementation and automated test approval                                              | Independent Q01 or MVP release approval                                                                       |
| [Clupai8o0 closing comment on #192](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/192#issuecomment-5738959691)                                                                                                                                   | Describes `integration/t2-2026` at `8fcf4135a` as the demo/upstream-PR base for that combined work      | A reason to silently switch this validation from the recorded merged `11.0.x` build                           |

**Finding:** code-specific approvals and landing instructions exist. No explicit, complete THM-JL01 record approved by both the objective lead and an identified repository maintainer was found in the inspected records. This is a bounded review finding, not a claim that approval cannot exist elsewhere. Link an existing qualifying approval if found; otherwise use the dated decision below. Do not backdate approval or mark the historical “approval before implementation” step as having occurred.
