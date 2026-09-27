# Accessibility run record — blank template

**Status: Not run. No human test or approval is recorded by this file.** Copy this record for an actual run. Procedures and pass conditions are in the [regression pack](REGRESSION.md); closure criteria are in [CLOSURE.md](CLOSURE.md). The K/S/V suffixes below identify coverage variants of those existing procedures, not new claims of completed tests.

Use **Pass**, **Fail**, **Not run**, or **Not applicable (reason)** for a test. Use **Pending**, **Changes requested**, **Approved**, or **Accepted limitation with follow-up** for a review decision. Record a reason for any skipped or unavailable state. Do not mark a required inaccessible step Not applicable to avoid a failure. A summary row passes only when its linked required checks have been performed and passed.

## Run identity and environment

| Field                                                                                  | Actual value                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Run ID / date / time zone                                                              | Pending                                                 |
| Tester identifier / role                                                               | Pending                                                 |
| Implemented the main fixes?                                                            | Pending; required for V01 independence                  |
| Record purpose / tickets supported                                                     | Pending                                                 |
| Web repository / branch / full commit SHA                                              | Pending                                                 |
| API repository / branch / full commit SHA                                              | Pending                                                 |
| Deploy repository / branch / full commit SHA                                           | Pending                                                 |
| Dirty changes or additional runtime configuration affecting results                    | Pending                                                 |
| Served-code verification evidence                                                      | Pending                                                 |
| Stack owner and synthetic-data scope                                                   | Pending                                                 |
| Verified startup/reset recipe and application/API URLs                                 | Pending; setup owner completes the recipe in CLOSURE.md |
| Operating system / version / display scaling                                           | Pending                                                 |
| Browser / version                                                                      | Pending                                                 |
| Desktop screen reader / version / speech and navigation settings                       | Pending                                                 |
| Real mobile device / OS / browser / assistive technology, if used                      | Pending                                                 |
| Keyboard navigation settings, including Safari full keyboard navigation where relevant | Pending                                                 |
| Viewport in CSS pixels / browser zoom / portrait or landscape                          | Pending                                                 |
| Normal browser or standalone PWA / installed-build verification                        | Pending                                                 |
| Touch exploration / swipe navigation / on-screen keyboard setting                      | Pending                                                 |
| Theme / reduced-motion preference / forced-colour mode                                 | Pending                                                 |
| Safe evidence location and permitted sharing                                           | Pending                                                 |

Use separate profile IDs when the environment/settings change. A different web/API/deploy commit combination needs a new run record. Distinguish CSS media emulation from real OS preference changes; name the actual method in the profile. Record actual versions; do not write “latest”. Do not put credentials, real student details or private URLs in this published record.

| Profile ID | Browser / OS / AT | CSS viewport / zoom | Theme / motion / forced colours / text spacing | Used for test IDs |
| ---------- | ----------------- | ------------------- | ---------------------------------------------- | ----------------- |
| Pending    | Pending           | Pending             | Pending                                        | None yet          |

## Synthetic fixture record

| Required fixture                                           | Actual safe reference / reproducible setup | Readiness |
| ---------------------------------------------------------- | ------------------------------------------ | --------- |
| Student enrolled in an available unit/task                 | Pending                                    | Not run   |
| Tutor assigned to that unit and synthetic submission       | Pending                                    | Not run   |
| Task sheet/PDF and allowed sample upload                   | Pending                                    | Not run   |
| Existing feedback and a safe new reply                     | Pending                                    | Not run   |
| Required comment and invalid-input case                    | Pending                                    | Not run   |
| Controlled recoverable upload failure and successful retry | Pending                                    | Not run   |
| Empty queue/search and loading state                       | Pending                                    | Not run   |
| Claim action allowed by this fixture/role                  | Pending                                    | Not run   |
| Grade/quality action allowed by this fixture/role          | Pending                                    | Not run   |
| Moderation action allowed by this fixture/role             | Pending                                    | Not run   |
| Safe notification item/action and unread/read state        | Pending                                    | Not run   |
| Fixture reset or cleanup procedure                         | Pending                                    | Not run   |

## Automated checks for this exact source snapshot

These rows are empty records, not a request to repeat already evidenced checks without a reason. An existing immutable CI run can be referenced only for the commit and scope it actually tested. The authoring guide contains commands; preserve the repository's full-suite/coverage variant and theme checks.

| Check                                             | Exact command / immutable run | Source SHA / environment | Result  | Evidence / finding |
| ------------------------------------------------- | ----------------------------- | ------------------------ | ------- | ------------------ |
| Dependency setup and Node/npm versions            | Pending                       | Pending                  | Not run | —                  |
| Four-rule A01 lint audit and report               | Pending                       | Pending                  | Not run | —                  |
| Full lint                                         | Pending                       | Pending                  | Not run | —                  |
| Typecheck                                         | Pending                       | Pending                  | Not run | —                  |
| Production build                                  | Pending                       | Pending                  | Not run | —                  |
| Dedicated accessibility suite                     | Pending                       | Pending                  | Not run | —                  |
| Relevant shared/student/staff component tests     | Pending                       | Pending                  | Not run | —                  |
| Full frontend suite / configured coverage variant | Pending                       | Pending                  | Not run | —                  |
| Compiled theme/contrast checks                    | Pending                       | Pending                  | Not run | —                  |

## Student and staff journey matrix

Enter the linked K/S/V results and observed end-to-end outcome; a DOM test or screenshot alone is not a completed journey. ST6/SF6 are roll-ups of the visual and U1 rows, not shortcuts around them.

| ID  | Role / action                                                                                 | Profile IDs / linked K/S/V/U checks | Result  | Evidence / findings |
| --- | --------------------------------------------------------------------------------------------- | ----------------------------------- | ------- | ------------------- |
| ST1 | Student: Sign in → home → open enrolled unit                                                  | Pending                             | Not run | —                   |
| ST2 | Student: Select task; inspect status/deadline                                                 | Pending                             | Not run | —                   |
| ST3 | Student: Task Sheet/PDF search/zoom/download/resources                                        | Pending                             | Not run | —                   |
| ST4 | Student: Upload; invalid input; recoverable failure/retry; success/cancel                     | Pending                             | Not run | —                   |
| ST5 | Student: Read feedback; compose/cancel/send reply                                             | Pending                             | Not run | —                   |
| ST6 | Student: Visual variants and independent U1 coverage                                          | Pending                             | Not run | —                   |
| SF1 | Staff: Inbox search/filter; loading and no results                                            | Pending                             | Not run | —                   |
| SF2 | Staff: Open submission; claim if permitted                                                    | Pending                             | Not run | —                   |
| SF3 | Staff: Review files/discussion; give feedback                                                 | Pending                             | Not run | —                   |
| SF4 | Staff: designated graded/rated task; permitted status opens dialog; cancel/reopen/save/reload | Pending                             | Not run | —                   |
| SF5 | Staff: Moderation: inspect/operate permitted named controls                                   | Pending                             | Not run | —                   |
| SF6 | Staff: Visual variants and independent U1 coverage                                            | Pending                             | Not run | —                   |

## Keyboard and focus matrix

Follow K1–K3 in the pack. Record the actual key sequence, initial/final focus and any trap or unexpected activation in the observation log.

| ID    | Role / consumer                                                         | Coverage                                                           | Profile | Result  | Evidence / findings |
| ----- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ | ------- | ------- | ------------------- |
| K1    | Student                                                                 | Forward/reverse tab order; visible focus; hidden controls excluded | Pending | Not run | —                   |
| K2    | Student                                                                 | Enter links; Enter/Space buttons; select/menu arrows and Escape    | Pending | Not run | —                   |
| K1    | Staff                                                                   | Forward/reverse tab order; visible focus; hidden controls excluded | Pending | Not run | —                   |
| K2    | Staff                                                                   | Enter links; Enter/Space buttons; select/menu arrows and Escape    | Pending | Not run | —                   |
| K3    | ST4 upload dialog: initial focus, containment, cancel/Escape and return | Open → interact → cancel/Escape → reopen/complete                  | Pending | Not run | —                   |
| K3    | SF4 grade dialog: initial focus, containment, cancel/Escape and return  | Open → interact → cancel/Escape → reopen/complete                  | Pending | Not run | —                   |
| K3    | ST5 attachment/feedback dialog where available                          | Open → interact → cancel/Escape → reopen/complete                  | Pending | Not run | —                   |
| K3    | SF3 attachment/feedback dialog where available                          | Open → interact → cancel/Escape → reopen/complete                  | Pending | Not run | —                   |
| K2/K3 | Shared notification panel                                               | Open, operate an available item/action, close and restore focus    | Pending | Not run | —                   |

## A03 screen-reader coverage matrix

Use an actual screen reader and record its speech/navigation settings above. Repeat each row on the relevant student and staff routes. Use separate observation rows for controls/states with different behaviour. “Not heard” or repeated speech is an observation to investigate, not an automatic pass.

| ID variant          | Role          | Coverage                                                                                                                                  | Profile | Result  | Evidence / spoken-output observation ID |
| ------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- | --------------------------------------- |
| S1-title            | Student       | Page title and route-change orientation                                                                                                   | Pending | Not run | —                                       |
| S1-structure        | Student       | Heading order, landmarks and skip navigation                                                                                              | Pending | Not run | —                                       |
| S1-names            | Student       | Links/buttons/icon controls/inputs/uploads/tabs/menus/frame names                                                                         | Pending | Not run | —                                       |
| S1-hidden           | Student       | Collapsed, inactive, decorative and visually hidden content                                                                               | Pending | Not run | —                                       |
| S1-privacy          | Student       | Names/descriptions/hidden text/focus reveal no protected data or unauthorised actions; record expected UI/API restrictions without bypass | Pending | Not run | —                                       |
| S2-help             | Student       | Labels, instructions, required state, hints and field relationships                                                                       | Pending | Not run | —                                       |
| S2-errors           | Student       | Submit invalid data; announced invalid/error state; correction and recovery                                                               | Pending | Not run | —                                       |
| S3-context          | Student       | Status, deadline/warning, progress, table/chart spoken context                                                                            | Pending | Not run | —                                       |
| S3-loading          | Student       | Loading begins and completes; meaningful progress                                                                                         | Pending | Not run | —                                       |
| S3-success          | Student       | Upload/save/reply/assessment success, as relevant                                                                                         | Pending | Not run | —                                       |
| S3-failure          | Student       | Recoverable error; recovery instructions; retry and completion                                                                            | Pending | Not run | —                                       |
| S3-empty            | Student       | Search/queue no-results state                                                                                                             | Pending | Not run | —                                       |
| S3-filter           | Student       | Filter/selection change and resulting content                                                                                             | Pending | Not run | —                                       |
| S3-route            | Student       | Route change and new context                                                                                                              | Pending | Not run | —                                       |
| S3-background       | Student       | Background refresh: absent/duplicate/noisy announcements                                                                                  | Pending | Not run | —                                       |
| S1-title            | Staff         | Page title and route-change orientation                                                                                                   | Pending | Not run | —                                       |
| S1-structure        | Staff         | Heading order, landmarks and skip navigation                                                                                              | Pending | Not run | —                                       |
| S1-names            | Staff         | Links/buttons/icon controls/inputs/uploads/tabs/menus/frame names                                                                         | Pending | Not run | —                                       |
| S1-hidden           | Staff         | Collapsed, inactive, decorative and visually hidden content                                                                               | Pending | Not run | —                                       |
| S1-privacy          | Staff         | Names/descriptions/hidden text/focus reveal no protected data or unauthorised actions; record expected UI/API restrictions without bypass | Pending | Not run | —                                       |
| S2-help             | Staff         | Labels, instructions, required state, hints and field relationships                                                                       | Pending | Not run | —                                       |
| S2-errors           | Staff         | Submit invalid data; announced invalid/error state; correction and recovery                                                               | Pending | Not run | —                                       |
| S3-context          | Staff         | Status, deadline/warning, progress, table/chart spoken context                                                                            | Pending | Not run | —                                       |
| S3-loading          | Staff         | Loading begins and completes; meaningful progress                                                                                         | Pending | Not run | —                                       |
| S3-success          | Staff         | Upload/save/reply/assessment success, as relevant                                                                                         | Pending | Not run | —                                       |
| S3-failure          | Staff         | Recoverable error; recovery instructions; retry and completion                                                                            | Pending | Not run | —                                       |
| S3-empty            | Staff         | Search/queue no-results state                                                                                                             | Pending | Not run | —                                       |
| S3-filter           | Staff         | Filter/selection change and resulting content                                                                                             | Pending | Not run | —                                       |
| S3-route            | Staff         | Route change and new context                                                                                                              | Pending | Not run | —                                       |
| S3-background       | Staff         | Background refresh: absent/duplicate/noisy announcements                                                                                  | Pending | Not run | —                                       |
| S1/S3-notifications | Shared header | Panel structure, named actions, state changes and focus/orientation                                                                       | Pending | Not run | —                                       |

## A04 visual and preference matrix

Apply each setting to the relevant journey steps (ST1–ST5 or SF1–SF5), especially dialogs, long hints/errors, embedded content, status chips and fixed headers/footers. Record exact profiles and measured results. Do not replace 400% zoom with a narrow screenshot; these are separate tests. A mobile viewport is separate from real mobile assistive technology.

Text-spacing values: line height **1.5**, paragraph spacing **2em**, letter spacing **0.12em**, word spacing **0.16em**. Contrast: ordinary text **4.5:1**, large text and meaningful controls/graphics **3:1**; record the element/state and applicable criterion, including any justified exception. Record forced-colour support and settings; unsupported environments need a stated reason.

| ID variant        | Role    | Theme               | Setting / coverage                                                 | Profile | Result  | Evidence / findings |
| ----------------- | ------- | ------------------- | ------------------------------------------------------------------ | ------- | ------- | ------------------- |
| V1                | Student | Light               | 200% browser zoom                                                  | Pending | Not run | —                   |
| V1                | Student | Light               | 400% browser zoom                                                  | Pending | Not run | —                   |
| V1                | Student | Light               | 320 CSS-pixel viewport/reflow                                      | Pending | Not run | —                   |
| V2                | Student | Light               | All four text-spacing overrides; clipping/overlap                  | Pending | Not run | —                   |
| V3-contrast       | Student | Light               | Text/icons/controls/borders/focus/warning/success/error pairs      | Pending | Not run | —                   |
| V3-colour         | Student | Light               | Status/urgency/progress/selection meaning without colour           | Pending | Not run | —                   |
| V3-forced-colours | Student | Light               | OS/browser forced colours or high contrast where supported         | Pending | Not run | —                   |
| V4-reduced        | Student | Light               | Reduced motion on before reload; trigger success/expansion         | Pending | Not run | —                   |
| V4-change         | Student | Light               | Change motion preference while open where supported                | Pending | Not run | —                   |
| V4-updates        | Student | Light               | Animation/flashing/auto-updates; essential information retained    | Pending | Not run | —                   |
| V1                | Student | Dark                | 200% browser zoom                                                  | Pending | Not run | —                   |
| V1                | Student | Dark                | 400% browser zoom                                                  | Pending | Not run | —                   |
| V1                | Student | Dark                | 320 CSS-pixel viewport/reflow                                      | Pending | Not run | —                   |
| V2                | Student | Dark                | All four text-spacing overrides; clipping/overlap                  | Pending | Not run | —                   |
| V3-contrast       | Student | Dark                | Text/icons/controls/borders/focus/warning/success/error pairs      | Pending | Not run | —                   |
| V3-colour         | Student | Dark                | Status/urgency/progress/selection meaning without colour           | Pending | Not run | —                   |
| V3-forced-colours | Student | Dark                | OS/browser forced colours or high contrast where supported         | Pending | Not run | —                   |
| V4-reduced        | Student | Dark                | Reduced motion on before reload; trigger success/expansion         | Pending | Not run | —                   |
| V4-change         | Student | Dark                | Change motion preference while open where supported                | Pending | Not run | —                   |
| V4-updates        | Student | Dark                | Animation/flashing/auto-updates; essential information retained    | Pending | Not run | —                   |
| V1                | Staff   | Light               | 200% browser zoom                                                  | Pending | Not run | —                   |
| V1                | Staff   | Light               | 400% browser zoom                                                  | Pending | Not run | —                   |
| V1                | Staff   | Light               | 320 CSS-pixel viewport/reflow                                      | Pending | Not run | —                   |
| V2                | Staff   | Light               | All four text-spacing overrides; clipping/overlap                  | Pending | Not run | —                   |
| V3-contrast       | Staff   | Light               | Text/icons/controls/borders/focus/warning/success/error pairs      | Pending | Not run | —                   |
| V3-colour         | Staff   | Light               | Status/urgency/progress/selection meaning without colour           | Pending | Not run | —                   |
| V3-forced-colours | Staff   | Light               | OS/browser forced colours or high contrast where supported         | Pending | Not run | —                   |
| V4-reduced        | Staff   | Light               | Reduced motion on before reload; trigger success/expansion         | Pending | Not run | —                   |
| V4-change         | Staff   | Light               | Change motion preference while open where supported                | Pending | Not run | —                   |
| V4-updates        | Staff   | Light               | Animation/flashing/auto-updates; essential information retained    | Pending | Not run | —                   |
| V1                | Staff   | Dark                | 200% browser zoom                                                  | Pending | Not run | —                   |
| V1                | Staff   | Dark                | 400% browser zoom                                                  | Pending | Not run | —                   |
| V1                | Staff   | Dark                | 320 CSS-pixel viewport/reflow                                      | Pending | Not run | —                   |
| V2                | Staff   | Dark                | All four text-spacing overrides; clipping/overlap                  | Pending | Not run | —                   |
| V3-contrast       | Staff   | Dark                | Text/icons/controls/borders/focus/warning/success/error pairs      | Pending | Not run | —                   |
| V3-colour         | Staff   | Dark                | Status/urgency/progress/selection meaning without colour           | Pending | Not run | —                   |
| V3-forced-colours | Staff   | Dark                | OS/browser forced colours or high contrast where supported         | Pending | Not run | —                   |
| V4-reduced        | Staff   | Dark                | Reduced motion on before reload; trigger success/expansion         | Pending | Not run | —                   |
| V4-change         | Staff   | Dark                | Change motion preference while open where supported                | Pending | Not run | —                   |
| V4-updates        | Staff   | Dark                | Animation/flashing/auto-updates; essential information retained    | Pending | Not run | —                   |
| S/V-mobile-AT     | Student | Record actual theme | Real mobile assistive-technology journey; record device separately | Pending | Not run | —                   |
| S/V-mobile-AT     | Staff   | Record actual theme | Real mobile assistive-technology journey; record device separately | Pending | Not run | —                   |

## Baseline platform coverage and scope decision

The following rows make the coverage in [baseline Section 5](https://github.com/ontrack-features-t2-2026/doubtfire-web/blob/94068e0758954791e074f723602cd44792a3684b/docs/A11Y-D01-Accessibility-Baseline_Phase1.md#5-test-environment-matrix) visible. The lead confirms the approved acceptance scope; the table does not create a new certification requirement. Leave unavailable platforms **Not run** and record the gap, owner and follow-up decision. A browser fixture, emulator or another platform cannot fill a real-device result.

| Platform / pairing                                        | Device and versions / availability | Approved scope decision / reviewer | Coverage result | Gap / follow-up owner |
| --------------------------------------------------------- | ---------------------------------- | ---------------------------------- | --------------- | --------------------- |
| Windows, NVDA + Chrome                                    | Pending                            | Pending                            | Not run         | Pending               |
| Windows, NVDA + Firefox                                   | Pending                            | Pending                            | Not run         | Pending               |
| Windows, Edge                                             | Pending                            | Pending                            | Not run         | Pending               |
| macOS, VoiceOver + Safari                                 | Pending                            | Pending                            | Not run         | Pending               |
| Chrome / Firefox alternatives on available desktop OS     | Pending                            | Pending                            | Not run         | Pending               |
| Real iOS, VoiceOver + Safari and standalone PWA           | Pending                            | Pending                            | Not run         | Pending               |
| Real Android, TalkBack + Chrome and standalone PWA        | Pending                            | Pending                            | Not run         | Pending               |
| JAWS, additional where available                          | Pending                            | Pending                            | Not run         | Pending               |
| 390×844 CSS-pixel browser fixture, complementary coverage | Pending                            | Pending                            | Not run         | Pending               |

## Mobile browser and installed-PWA matrix

For each available platform use the actual device dimensions and record the profile and theme. Repeat touch exploration/swipe navigation and the relevant ST/SF steps. Each keyboard-state result needs its own observation/evidence. A mobile-browser pass is not an installed-app pass. A missing platform remains a coverage gap for the lead to address.

| Role / journey  | Real platform / AT | Display mode             | Orientation | Profile / actual CSS viewport | Keyboard closed result | Keyboard open result | Evidence / finding |
| --------------- | ------------------ | ------------------------ | ----------- | ----------------------------- | ---------------------- | -------------------- | ------------------ |
| Student ST1–ST6 | iOS VoiceOver      | Normal Safari browser    | Portrait    | Pending                       | Not run                | Not run              | —                  |
| Student ST1–ST6 | iOS VoiceOver      | Normal Safari browser    | Landscape   | Pending                       | Not run                | Not run              | —                  |
| Student ST1–ST6 | iOS VoiceOver      | Installed standalone PWA | Portrait    | Pending                       | Not run                | Not run              | —                  |
| Student ST1–ST6 | iOS VoiceOver      | Installed standalone PWA | Landscape   | Pending                       | Not run                | Not run              | —                  |
| Student ST1–ST6 | Android TalkBack   | Normal Chrome browser    | Portrait    | Pending                       | Not run                | Not run              | —                  |
| Student ST1–ST6 | Android TalkBack   | Normal Chrome browser    | Landscape   | Pending                       | Not run                | Not run              | —                  |
| Student ST1–ST6 | Android TalkBack   | Installed standalone PWA | Portrait    | Pending                       | Not run                | Not run              | —                  |
| Student ST1–ST6 | Android TalkBack   | Installed standalone PWA | Landscape   | Pending                       | Not run                | Not run              | —                  |
| Staff SF1–SF6   | iOS VoiceOver      | Normal Safari browser    | Portrait    | Pending                       | Not run                | Not run              | —                  |
| Staff SF1–SF6   | iOS VoiceOver      | Normal Safari browser    | Landscape   | Pending                       | Not run                | Not run              | —                  |
| Staff SF1–SF6   | iOS VoiceOver      | Installed standalone PWA | Portrait    | Pending                       | Not run                | Not run              | —                  |
| Staff SF1–SF6   | iOS VoiceOver      | Installed standalone PWA | Landscape   | Pending                       | Not run                | Not run              | —                  |
| Staff SF1–SF6   | Android TalkBack   | Normal Chrome browser    | Portrait    | Pending                       | Not run                | Not run              | —                  |
| Staff SF1–SF6   | Android TalkBack   | Normal Chrome browser    | Landscape   | Pending                       | Not run                | Not run              | —                  |
| Staff SF1–SF6   | Android TalkBack   | Installed standalone PWA | Portrait    | Pending                       | Not run                | Not run              | —                  |
| Staff SF1–SF6   | Android TalkBack   | Installed standalone PWA | Landscape   | Pending                       | Not run                | Not run              | —                  |

For every platform/mode pair above, record the following transition results. Confirm the selected task, focus, safe-area layout and required feedback/submission controls remain available. Use the same recorded build for browser and PWA, or create a separate run record.

| Role    | Platform / browser or PWA / profile     | Build verified | Launch/resume | File picker / document viewer return | Back navigation / pane focus | Safe areas / touch targets / large text | Result / evidence |
| ------- | --------------------------------------- | -------------- | ------------- | ------------------------------------ | ---------------------------- | --------------------------------------- | ----------------- |
| Student | iOS browser; profile Pending            | Not run        | Not run       | Not run                              | Not run                      | Not run                                 | Not run; —        |
| Student | iOS standalone PWA; profile Pending     | Not run        | Not run       | Not run                              | Not run                      | Not run                                 | Not run; —        |
| Student | Android browser; profile Pending        | Not run        | Not run       | Not run                              | Not run                      | Not run                                 | Not run; —        |
| Student | Android standalone PWA; profile Pending | Not run        | Not run       | Not run                              | Not run                      | Not run                                 | Not run; —        |
| Staff   | iOS browser; profile Pending            | Not run        | Not run       | Not run                              | Not run                      | Not run                                 | Not run; —        |
| Staff   | iOS standalone PWA; profile Pending     | Not run        | Not run       | Not run                              | Not run                      | Not run                                 | Not run; —        |
| Staff   | Android browser; profile Pending        | Not run        | Not run       | Not run                              | Not run                      | Not run                                 | Not run; —        |
| Staff   | Android standalone PWA; profile Pending | Not run        | Not run       | Not run                              | Not run                      | Not run                                 | Not run; —        |

## Independent U1 task matrix

Two independent people each attempt all four tasks without coaching. Record the route/role they used and observations, not diagnoses or sensitive participant details. The main implementer's exploratory run and two automated/agent runs do not meet this requirement. The V01 validator's independence is recorded separately in the review table.

| Task | Independent reviewer | Uncoached task                   | Profile / role / route | Result  | UX observation / evidence |
| ---- | -------------------- | -------------------------------- | ---------------------- | ------- | ------------------------- |
| U1-1 | Reviewer A           | Find the current unit            | Pending                | Not run | —                         |
| U1-2 | Reviewer A           | Find a task to work on           | Pending                | Not run | —                         |
| U1-3 | Reviewer A           | Open task details / Task Sheet   | Pending                | Not run | —                         |
| U1-4 | Reviewer A           | Find progress/status information | Pending                | Not run | —                         |
| U1-1 | Reviewer B           | Find the current unit            | Pending                | Not run | —                         |
| U1-2 | Reviewer B           | Find a task to work on           | Pending                | Not run | —                         |
| U1-3 | Reviewer B           | Open task details / Task Sheet   | Pending                | Not run | —                         |
| U1-4 | Reviewer B           | Find progress/status information | Pending                | Not run | —                         |

## Findings and observed behaviour

Add one row per actual observation. Preserve the initial failure when a fix is re-tested; link a new result rather than overwriting history. P0/P1 require recorded fixes/re-tests or a written lead decision and follow-up owner. A known reproduced limitation is a failure, not a pass.

### Canonical finding record

Copy this block for each finding, preserving the baseline's nine field names. The run/profile ID and observation tables supply supporting context.

| Finding field   | Actual entry            |
| --------------- | ----------------------- |
| Route           | Pending                 |
| Component       | Pending                 |
| Steps           | Pending                 |
| Expected Result | Pending                 |
| Actual Result   | No observation recorded |
| Severity        | Pending                 |
| Evidence        | —                       |
| Owner           | Unassigned              |
| Re-test Status  | Not yet re-tested       |

### General finding / focus / layout log

| Finding ID | Test ID / route / component | Profile / role | Exact steps | Expected result | Actual result           | Severity / task impact | Evidence | Owner / fix PR + SHA | Re-test status    |
| ---------- | --------------------------- | -------------- | ----------- | --------------- | ----------------------- | ---------------------- | -------- | -------------------- | ----------------- |
| Pending    | Pending                     | Pending        | Pending     | Pending         | No observation recorded | Pending                | —        | Unassigned           | Not yet re-tested |

### Spoken output and announcement log

Include useful spoken words verbatim, timing, focus location and whether a message was missing or repeated. Avoid real student content. Record the context for loading, success, failure and background refresh separately.

| Observation ID | S test ID / route / control | Profile / role | Trigger and state | Expected information | Actual spoken output / timing / repetitions | Result  | Evidence / finding |
| -------------- | --------------------------- | -------------- | ----------------- | -------------------- | ------------------------------------------- | ------- | ------------------ |
| Pending        | Pending                     | Pending        | Pending           | Pending              | No observation recorded                     | Not run | —                  |

### Contrast measurements and colour-independent meaning

Measure the actual rendered foreground/background for each relevant state. Add enough rows to cover text, icons, controls, borders, focus, warning, success and error in each theme. Record the method and any incomplete/inapplicable category explicitly.

| Observation ID | Route / element / state | Profile / theme | Category / applicable threshold | Foreground / background / measured ratio | Non-colour cue | Method / evidence | Result / finding |
| -------------- | ----------------------- | --------------- | ------------------------------- | ---------------------------------------- | -------------- | ----------------- | ---------------- |
| Pending        | Pending                 | Pending         | Pending                         | Not measured                             | Not observed   | —                 | Not run          |

### Zoom, reflow, text spacing, forced colours and motion observations

| Observation ID | V test ID / route / element | Profile / exact setting | Required control reachable? / clipping / scroll | Observed focus or motion behaviour | Evidence | Result / finding |
| -------------- | --------------------------- | ----------------------- | ----------------------------------------------- | ---------------------------------- | -------- | ---------------- |
| Pending        | Pending                     | Pending                 | Not observed                                    | Not observed                       | —        | Not run          |

### Independent UX observations

| Observation ID | Reviewer / task / role | Uncoached steps taken   | Completion / friction / recovery observed | Participant wording or suggestion | Evidence | Result / finding |
| -------------- | ---------------------- | ----------------------- | ----------------------------------------- | --------------------------------- | -------- | ---------------- |
| Pending        | Pending                | No observation recorded | No observation recorded                   | No observation recorded           | —        | Not run          |

## Review and decision record

Only the actual reviewer or an accurately attributed record can supply a decision. Record the exact source/document revision reviewed. A pending row is not approval; an automated check is not an independent human walkthrough. One reviewer can contribute to several activities only when the stated role and independence criteria are met.

| Activity                            | Required role                                                | Actual reviewer / independence statement | Commit / document revision and evidence reviewed | Decision | Feedback / follow-up owner / date |
| ----------------------------------- | ------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------ | -------- | --------------------------------- |
| Baseline platform/scope decision    | Objective lead with relevant testers                         | Pending                                  | Pending                                          | Pending  | —                                 |
| T02 independent pack walkthrough    | Contributor who did not write the pack                       | Pending                                  | Pending                                          | Pending  | —                                 |
| D02 developer review                | Developer                                                    | Pending                                  | Pending                                          | Pending  | —                                 |
| D02 tester review                   | Tester                                                       | Pending                                  | Pending                                          | Pending  | —                                 |
| P01 scope/order/ownership           | Objective lead plus frontend/docs leads and relevant testers | Pending                                  | Pending                                          | Pending  | —                                 |
| V01 independent validation          | Validator who did not implement the main fixes               | Pending                                  | Pending                                          | Pending  | —                                 |
| U1 Reviewer A independence          | Independent participant A                                    | Pending                                  | Pending                                          | Pending  | —                                 |
| U1 Reviewer B independence          | Independent participant B                                    | Pending                                  | Pending                                          | Pending  | —                                 |
| P0/P1 exception decision, if needed | Responsible lead; named follow-up owner                      | Pending                                  | Pending                                          | Pending  | —                                 |
| MVP01 final approval                | Objective leader                                             | Pending                                  | Pending                                          | Pending  | —                                 |
| PR approval / merge decision        | Authorised repository reviewer                               | Pending                                  | Pending                                          | Pending  | —                                 |

## Evidence index and handover status

Use one entry per artifact, with an immutable commit/run link where available. The same run may support multiple tickets only under the reuse rules in CLOSURE.md. Do not put a Planner/team-chat link here until publication actually occurred.

| Artifact / run row                                 | Ticket IDs supported                      | Exact source/profile scope | Evidence link | Status  |
| -------------------------------------------------- | ----------------------------------------- | -------------------------- | ------------- | ------- |
| A01 report and raw/per-message/deduplicated tables | A01 / P01 / MVP01                         | Pending                    | —             | Pending |
| Automated results                                  | T01 / F05 / F06 / F07 / V01 / MVP01       | Pending                    | —             | Not run |
| Manual K/S/V and journey rows                      | A03 / A04 / F05 / F06 / F07 / V01 / MVP01 | Pending                    | —             | Not run |
| Independent U1 evidence                            | V01 / MVP01                               | Pending                    | —             | Not run |
| Pack walkthrough and document reviews              | T02 / D02                                 | Pending                    | —             | Pending |
| Approved register and scope decisions              | P01 / MVP01                               | Pending                    | —             | Pending |
| Final handover and actual publication              | MVP01                                     | Pending                    | —             | Pending |

## Audit delivery status

Audit delivery and product acceptance are separate. A03/A04 may be delivered with failures once agreed coverage is completed and findings are reported. Keep the underlying test results as Fail and link subsequent fixes/re-tests separately. Do not describe absent coverage as a completed observation.

| Audit                   | Agreed scope / coverage decision | Coverage performed | Report / finding links | Delivery status | Outstanding coverage / owner |
| ----------------------- | -------------------------------- | ------------------ | ---------------------- | --------------- | ---------------------------- |
| A01 source lint audit   | Pending                          | Not run            | —                      | Not started     | Pending                      |
| A03 screen-reader audit | Pending                          | Not run            | —                      | Not started     | Pending                      |
| A04 visual audit        | Pending                          | Not run            | —                      | Not started     | Pending                      |

## Final assessment for this run

- **Completed with evidence:** None recorded in this blank template.
- **In progress:** None asserted.
- **Planned / not run:** All test and review rows above.
- **Deferred / accepted limitations:** None accepted; add only actual decisions with owners.
- **Unresolved P0/P1 findings:** Not assessed; do not interpret the empty log as zero defects.
- **Recommendation / sign-off:** Pending independent review and leader decision.

This record does not claim whole-site compliance, independent participation, approved scope or unseen MVP01 acceptance wording.
