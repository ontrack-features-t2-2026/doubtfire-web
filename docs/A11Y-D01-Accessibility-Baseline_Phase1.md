# OnTrack Accessibility Baseline - Phase 1

**Ticket:**  A11Y-D01 - Define the OnTrack accessibility baseline and critical user journeys
**Branch:** `docs/accessibility-baseline`
**Scope:** Documentation and copy specification only. No production code, API behaviour or data flow is changed by this document.

## 1. Purpose & Scope

The document exists so that every accessibility audit and implementation ticket for OnTrack works from the same test scope, the same severity language, the same evidence format, and a shared understanding of what "done" means for this phase of work. It is written in plain language throughout, so that anyone on the team - *regardless of technical background* - can read, apply, and rely on it without needing to interpret jargon or infer intent.

### 1.1 What this document covers

- Site-wide support for people with disabilities and neurodivergent users, across both technical accessibility (*keyboard, screen reader, semantics, etc.*) and cognitive/neurodivergent usability (*plain language, predictable layout, minimal unnecessary complexity*).
- Two critical, end-to-end user journeys - one **student**, one **staff** - mapped against OnTrack's real routes and components, to give future audits a concrete, reproducible starting point rather than an abstract checklist.

### 1.2 What this document explicitly excludes

**Dark mode** is a separate objective and is not covered here. Where this baseline discusses colour and contrast, it is testing OnTrack's existing colour scheme as it stands today, not preparing for or requiring a dark mode implementation.

### 1.3 Relationship to other objectives and tickets

- This baseline applies across all objectives - any team running an accessibility audit or building a new feature **should use the terminology, severity scale, and finding template defined here**.
- However, this does **not** make this objective the implementation owner for every feature's accessibility. Individual features and their tickets retain ownership of their own behaviour and their own accessible implementation. This document sets shared expectations; it does not centralise responsibility for meeting them.

### 1.4 Boundary on future usability

No one participating in future usability testing or feedback sessions related to this work will be required to disclose a disability or diagnosis in order to take part. Testing methods and recruitment should be designed with this in mind from the outset.

## 2. Target Standard

OnTrack's accessibility target for this phase of work is [**WCAG 2.2 Level AA**](https://www.w3.org/TR/WCAG22/).

This is a **target the team is working toward, not a certification claim**. Adopting this standard means it is the benchmark used to write test methods, judge findings, and prioritise fixes throughout this baseline and the audits that follow it. It does not mean OnTrack currently meets [WCAG 2.2 AA](https://www.w3.org/WAI/WCAG2A-Conformance), that any page has been certified as compliant, or that meeting this target removes the need for ongoing attention as the site changes. Progress toward this target should be understood as an improvement and guardrail program - measurable progress, without ever presenting the current state of the site as fully compliant.

## 3. Critical User Journeys
---
### 3.1 Student Journey
Enter Unit - View Task - Submit Work - Find Feedback

| Step                            | Route                                              | Component                        | Role Required                                                                                    | Notes                                                                                                                                                                                                                              |
| ------------------------------- | -------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Enter unit / view task list** | `/projects/:projectId/dashboard`                   | `ProjectDashboardComponent`      | Student (project owner)                                                                          | **Split-pane layout** - resizable divider is mouse-drag only (CDK drag-drop) check for a keyboard-accessible alternative. Comments panel auto-collapses below 999px - verify it's still reachable, not hidden from assistive tech. |
| **View a task (incl. status)**  | `/projects/:projectId/dashboard/:taskAbbreviation` | `TaskDashboardComponent`         | Student; extra tabs (Similarity, History, Staff/Tutor Notes) hidden unless viewer has staff role | **Tabbed** - Details, Task Sheet, Submission (+ staff-only tabs). Verify tab keyboard nav + active-tab announcement.                                                                                                               |
| **Submit work**                 | N/A — modal, opened from task dashboard            | `UploadSubmissionModalComponent` | Student (project owner)                                                                          | **Multi-stage** - group rating (if group task) - upload - comment. Comment required (25+ chars) for Need Help/portfolio-only. Verify disabled-submit reason is announced. check file uploader's keyboard operability.              |
| **Find feedback**               | Same as "View a task," Details tab                 | `TaskDashboardComponent`         | Student                                                                                          | Feedback/status likely renders via `taskStatusData` in the default tab - not independently inspected further, scoped for Phase 1.                                                                                                  |

### 3.2 Staff Journey
Find Submission - Review - Give Feedback - Change Status

| Step                               | Route                                                       | Component                                        | Role Required                                                                  | Notes                                                                                           |
| ---------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **Find a submission (Inbox)**      | `/units/:unitId/tasks/inbox` (+ `/:studentId/:taskDefAbbr`) | `UnitTaskInboxStateComponent` (routeMode: inbox) | Tutor, Convenor, Admin, Auditor                                                | Default landing page for a unit - shared component across all four modes below.                 |
| **Find a submission (Explorer)**   | `/units/:unitId/tasks/definition` (+ variant)               | same (routeMode: definition)                     | Tutor, Convenor, Admin, Auditor                                                | Filter by task definition.                                                                      |
| **Find a submission (Moderation)** | `/units/:unitId/tasks/moderation` (+ variant)               | same (routeMode: moderation)                     | Tutor, Convenor, Admin, Auditor                                                | Mentor moderation queue.                                                                        |
| **Find a submission (Overflow)**   | `/units/:unitId/tasks/overflow` (+ variant)                 | same (routeMode: overflow)                       | Tutor, Convenor, Admin, Auditor                                                | Overdue queue.                                                                                  |
| **Claim a task**                   | *N/A — inline UI action*                                    | `TaskClaimComponent`                             | Inherited from parent route guard (confirmed in `role-whitelist.guard.ts`)     | Locks task for 30 min - success shown via alert + snack bar - verify both reach screen readers. |
| **Review the submission**          | *Same routes as above, task selected*                       | `InboxDashboardComponent`                        | Inherited; Tutor Notes further restricted                                      | Tabbed viewer, read-only.                                                                       |
| **Grade the submission**           | *N/A — modal*                                               | `GradeTaskModalComponent`                        | Inherited (confirmed in `role-whitelist.guard.ts` on the parent `tasks` route) | Sets grade/quality rating. Custom rating widget - check keyboard + screen reader support.       |
| *(Change task status)*             | *Not located*                                               | *Not located*                                    | —                                                                              | *Was unable to locate the exact status change component.*                                       |

## 4. Accessibility Test Areas
---
For each area: *what to check*, *how to check it*, and *what evidence to capture*. Where the journey mapping above already surfaced a specific known risk, it's referenced directly so testers know exactly where to start.

### 4.1 Keyboard
Every interactive element (buttons, tabs, modals, form controls) must be reachable and operable using only a keyboard.

- **Known risk**: The student dashboard's task-list resize divider (`ProjectDashboardComponent`) is currently mouse-drag only (CDK drag-drop) — check whether a keyboard-accessible alternative exists.
- **Method**: Navigate each journey step using Tab/Shift+Tab/Enter/Space/Arrow keys only, no mouse.
- **Evidence**: Screen recording of keyboard-only traversal, noting any unreachable or un-triggerable controls.

### 4.2 Focus
Focus should be visible at all times, and should move logically (never lost, never trapped).

- **Known risk**: Modals (`GradeTaskModalComponent`, `UploadSubmissionModalComponent`, `BatchFeedbackWorkflowDialogComponent`) should trap focus while open and return it sensibly on close.
- **Method**: Open/close each modal and confirm focus placement before, during, and after; check focus order across multi-stage flows (e.g. the upload modal's group - details - comments stages).
- **Evidence**: Screen recording or annotated screenshots showing focus indicator position at each step.

### 4.3 Screen Reader
All content and state changes must be announced correctly (NVDA/VoiceOver, per the environment matrix in Section 5).

- **Known risks**: Success messages shown via alert + snack bar (task claiming); tab switching in `TaskDashboardComponent`/`InboxDashboardComponent`; loading states (`inboxLoading` in the staff inbox); the redirect to `/unauthorised` when a role-restricted route is accessed without permission (`role-whitelist.guard.ts`) - confirm the redirect and resulting page are announced clearly, and that the brief loading check beforehand doesn't leave a screen reader user on a blank or ambiguous page.
- **Method**: Navigate each journey step with a screen reader active; confirm dynamic changes (loading, success/error, tab switches, redirects) are announced, not just visually shown.
- **Evidence**: screen recording with screen reader audio, or a transcript of announcements against expected announcements.

### 4.4 Semantics
Correct use of headings, landmarks, lists, buttons vs. links, and ARIA roles/attributes where native HTML isn't sufficient.

- **Method**: Inspect the rendered DOM (browser dev tools or an automated tool) for each journey step.
- **Evidence**: Annotated DOM snapshot or automated scan report per page/step.

### 4.5 Zoom / Text Resize
Content must remain usable at 200% browser zoom and at increased OS/browser text-size settings, with no loss of content or function.

- **Method**: Test each journey step at 200% zoom and at a large text-size setting.
- **Evidence**: Before/after screenshots at default and 200% zoom.

### 4.6 Reflow
Content must reflow to a single column at narrow viewports (per the environment matrix) without horizontal scrolling or loss of content.

- **Known risk**: The student dashboard's split-pane layout (task list + task detail) and its narrow-viewport comment-panel collapse behaviour.
- **Method**: Resize the browser to each viewport in the test matrix and confirm layout and content remain accessible.
- **Evidence**: Screenshots at each viewport width.

### 4.7 Contrast
Text and meaningful UI elements must meet **WCAG 2.2 AA** contrast ratios (4.5:1 for normal text, 3:1 for large text/UI components) checked against whichever colour theme/mode is active (excluding dark mode itself, which is out of scope).

- **Method**: Automated contrast check per page/step.
- **Evidence**: Contrast checker output per checked element.

### 4.8 Colour
Information must never be conveyed by colour alone (e.g. status icons/labels in `taskStatusData`, warning/overflow icons in the staff task list).

- **Method**: Review each status/warning indicator and confirm an icon, label, or text equivalent accompanies any colour coding.
- **Evidence**: Screenshot with colour-blindness simulation applied (e.g. a simulator extension), or annotated screenshot noting the non-colour cue.

### 4.9 Motion
Any animation (transitions, loading spinners, drag interactions) must respect the OS/browser "reduce motion" setting, and must not be essential to completing a task.

- **Method**: Enable "reduce motion" at the OS level and repeat each journey step, checking nothing becomes unusable.
- **Evidence**: Screen recording with reduce-motion enabled.

### 4.10 Cognitive Clarity
Plain language, predictable layout, clear error/validation messaging, and minimal unnecessary complexity.

- **Known risk**: The upload submission modal's minimum comment length requirement (25+ characters) and its disabled-submit state - confirm the reason for disablement is clearly communicated, not just visually implied.
- Method: walk through each journey step as a first-time user would, noting any unclear instructions, ambiguous error states, or unexplained disabled controls.
- Evidence: written notes per step, plus screenshots of any unclear or ambiguous UI encountered.

## 5. Test Environment Matrix
---
The matrix below is limited to combinations the team can realistically reproduce - it is not exhaustive coverage of every browser/OS/screen-reader/device combination in use by real students and staff.

### Browsers
- Chrome (latest stable) - **Primary**
- Firefox (latest stable)
- Safari (latest stable, macOS) / Edge (latest stable, Windows)

### Operating Systems
- Windows (latest supported release)
- macOS (latest supported release)
- A mobile OS for the mobile viewport pass (iOS or Android - pick one consistently per test cycle, note which was used)

### Screen Readers
- NVDA (Windows) - **Primary**, (paired with Chrome or Firefox)
- VoiceOver (macOS) - (paired with Safari)
- Additional, as available: JAWS (Windows), TalkBack (Android) - use as necessary. 

### Viewports
- Desktop: 1920×1080, 1440×2560 or 1366×768 (covers the large majority of desktop users)
- Mobile: One common mobile width (e.g. 390×844, matching a current iPhone) or the device actually available to the tester.

Each finding logged against the finding template (Section 7) should record which specific browser/OS/screen-reader/viewport combination it was found in, since accessibility issues can be combination-specific.

## 6. Severity Scale (P0–P3)
---
Each finding is assigned one severity level, based on a combination of four factors: 
- How much harm or exclusion it causes.
- Whether it blocks a task entirely.
- How often a user would hit it.
- Whether it affects a shared component used across many pages. 
When factors point to different levels, use the **highest** applicable severity.

### P0 — Blocking
A user relying on assistive technology or an accessibility feature **cannot complete a core task at all** (e.g. cannot submit work, cannot find their grade, cannot navigate past a certain point). No workaround exists within the page.

- **Example**: A modal traps keyboard focus with no way to close or continue.
- **Shared-component impact**: If the broken component appears across the inbox, explorer, moderation, and overflow views, treat as **P0** even if any single view alone might seem lower-impact.

### P1 — Severely Degraded
A core task is **technically possible but significantly harder, slower, or more frustrating** for a user of assistive technology or an accessibility feature - not fully blocked, but a serious barrier.

- **Example**: A status change is made but not announced to screen reader users, forcing them to guess or re-check manually.
- **Example**: Content critical to a decision (e.g. feedback text) is present but not reachable in a logical reading/focus order.

### P2 — Minor Barrier
The task is completable without serious difficulty, but there's a **real, noticeable accessibility problem** - inconsistent focus indication, a contrast ratio just below AA, a redundant or confusing label.

- **Example**: A warning icon relies on colour alone but a text label is present elsewhere on the same row (so the information isn't entirely lost, just less discoverable).

### P3 — Cosmetic / Low Impact
A **minor inconvenience** with negligible effect on task completion - small inconsistencies, non-critical polish issues, or edge cases affecting very few users or very rarely encountered states.

- **Example**: a decorative element lacks `alt=""` but conveys no information.

### Applying the scale
- **Harm**: How seriously does this affect a real user's ability to use OnTrack independently and with dignity?
- **Task-blocking**: Does it stop a task outright, slow it down, or barely register?
- **Frequency**: Is this hit on every use of a page, or only in a rare edge case?
- **Shared-component impact**: Does fixing this in one place fix it everywhere, or does the same bug need fixing repeatedly across pages? Widespread shared-component issues should be escalated at least one level from what a single-page view of the same issue would suggest.

## 7. Finding Template
---
Every accessibility finding logged against this baseline uses the same fields, in the same structure, regardless of who logs it or which journey it comes from. Do not add, remove, or rename fields per-ticket - the structure only stays reusable if it stays fixed.

| Field               | Description                                                                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Route**           | The exact URL/path where the issue was found (e.g. `/units/:unitId/tasks/inbox`). Use the real path pattern from the app, not a paraphrase.                                                                                                                  |
| **Component**       | The Angular **component name** responsible for the affected UI (e.g. `GradeTaskModalComponent`), if known. Helps whoever fixes the issue locate the code quickly.                                                                                            |
| **Steps**           | The exact sequence of actions to reproduce the issue, written so someone unfamiliar with the finding could follow them without guessing (include role/account used, browser/OS/screen reader, and viewport - matching an entry from **Section 5**'s matrix). |
| **Expected Result** | What should happen, per **WCAG 2.2 AA** and/or this baseline's test-area guidance (**Section 4**).                                                                                                                                                           |
| **Actual Result**   | What actually happens - described factually, without severity judgement built into the wording.                                                                                                                                                              |
| **Severity**        | One of **P0–P3**, assigned per the criteria in **Section 6**.                                                                                                                                                                                                |
| **Evidence**        | A screen recording, screenshot, or tool output (e.g. software generated report, contrast checker result) demonstrating the issue. Use demonstration accounts and sanitised data only (see **Section 8**).                                                    |
| **Owner**           | The person or team responsible for triaging or fixing the finding.                                                                                                                                                                                           |
| **Re-test Status**  | Not yet re-tested / Fixed - confirmed / Fixed - not confirmed / Still present / Won't fix (with reason). Updated after a fix is attempted, using the same environment the issue was originally found in wherever possible.                                   |

## 8. Security & Privacy Notes

>**Use demonstration accounts and sanitised evidence only.** No real student, staff, or unit data should appear in any screenshot, recording, or written finding produced during audits against this baseline.

 >**Do not use real student assessment content in test-plan examples.** Any example task, submission, or feedback used to illustrate a journey or a finding must be fabricated or clearly marked as a demonstration.

>**Hidden accessibility text is still data exposure.** Content added purely for assistive technology - `aria-label`, `alt` text, visually-hidden spans, and similar - must be checked for unauthorised information the same way visible content is. A hidden label is not a safe place to leak information that shouldn't be shown to the current viewer (e.g. another student's name, an internal-only note, a role-restricted detail). This applies equally to elements found during the journeys above, such as the role-gated Tutor Notes tab (`InboxDashboardComponent`, `TaskDashboardComponent`) - hidden text near those areas should be checked as carefully as the visible UI already is.

## 9. Phase 1 — Definition of Done

### 9.1 What Phase 1 explicitly does not mean

- That any accessibility audit has actually been run - running the audits is separate, future work.
- That any component has been fixed, or that any specific page currently passes **WCAG 2.2 AA**.
- That OnTrack is accessibility-compliant or certified in any formal sense. **WCAG 2.2 AA** is adopted here as a **target to work toward**, not a claim being made about the current state of the site.

### 9.2 Explicitly out of scope for Phase 1

(per this ticket): Running the audits, fixing flagged components, implementing dark mode, purchasing commercial accessibility tooling, and formal legal certification. These are future work, to be scoped as separate tickets once this baseline is in use.

### 9.3 Known open items
For whoever picks up the next piece of work.

- The staff-side mechanism for changing a task's status was not located during Phase 1 (see Section 3.2) - worth confirming before auditing the "give feedback" step in depth.
- The exact rendering of feedback/comment text within the student's task-dashboard Details tab was not inspected beyond confirming its general location (see Section 3.1).

## 10 Phase 1 (this baseline) is complete when

| Requirement                                                                                                           | Result  | Evidence    |
| --------------------------------------------------------------------------------------------------------------------- | ------- | ----------- |
| The target standard and scope are written in plain language.                                                          | **Met** | Section 1   |
| The plan covers both technical accessibility and cognitive or neurodivergent usability.                               | **Met** | Section 1.1 |
| Dark mode is clearly excluded from implementation while contrast and colour use remain testable.                      | **Met** | Section 1.2 |
| At least one student journey and one staff journey are mapped from start to finish.                                   | **Met** | Section 3   |
| Every accessibility test area has a repeatable method and a defined evidence type.                                    | **Met** | Section 4   |
| The test environment matrix exists that the team can actually reproduce.                                              | **Met** | Section 5   |
| The severity scale distinguishes a blocked task from a minor inconvenience.                                           | **Met** | Section 6   |
| The findings template exists and can be reused without editing its structure.                                         | **Met** | Section 7   |
| Security and privacy expectations for future audit evidence are documented.                                           | **Met** | Section 8   |
| The document states that Phase 1 is an improvement and guardrail program, not proof that the whole site is compliant. | **Met** | Section 9.1 |

## 11. Known Codebase Notes
---
### AngularJS

- Angular migration in progress - legacy `.coffee` state files and orphaned `.tpl.html`/`.scss` files still exist alongside migrated `.component.ts` files (e.g. `dashboard.tpl`, `task-dashboard.tpl`). Not active code, but can be confusing when browsing.
- Route-vs-template mismatches to expect - old CoffeeScript state definitions may reference templates that no longer exist post-migration.
### Confirmations 

- What initially looked like a role-guard inconsistency between the bare `/units/:unitId/tasks` path and `tasks/inbox`/`tasks/definition`/etc. is **not an inconsistency** - <u>they are two different features sharing a URL prefix</u>. The bare `tasks` path renders `TaskViewerStateComponent`, a task-*definition* viewer (unit-administration-adjacent, correctly restricted to Convenor/Admin/Auditor). The `tasks/inbox` etc. paths render `UnitTaskInboxStateComponent`, which reviews individual student *submissions* (correctly includes Tutor, since that's core marking work).
- `SelectedTaskService` is shared infrastructure between staff and student views - task-selection state isn't duplicated per role.
### Unknowns

- Task status transitions are confirmed as student-triggered (via `UploadSubmissionModalComponent.processTaskStatusChange` on submission), but the staff-side status-change mechanism was not located during Phase 1 investigation.

## 12 Coverage
---
### 12.1 Files

|                                        |                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `unit-task-inbox-state.component.ts`   | Confirmed the shared staff inbox/explorer/moderation/overflow component |
| `app.routes.ts`                        | The authoritative routing file - confirmed all staff route paths        |
| `inbox-dashboard.component.ts`         | Confirmed the read-only submission viewer                               |
| `inbox-dashboard.component.html`       | Confirmed no grading action lived there                                 |
| `staff-task-list.component.ts`         | Confirmed task selection, keyboard shortcuts, filtering                 |
| `task-claim.component.ts`              | Confirmed the claim action                                              |
| `task-status.ts`                       | Confirmed the status vocabulary                                         |
| `grade-task-modal.component.ts`        | Confirmed the actual grading action                                     |
| `project-dashboard.component.ts`       | Confirmed the student split-pane layout                                 |
| `task-dashboard.component.ts`          | Confirmed "view a task" and likely feedback location                    |
| `upload-submission-modal.component.ts` | Confirmed the student submission action                                 |
| `role-whitelist.guard.ts`              | Confirmed guard redirect behaviour                                      |
| `task-viewer-state.component.ts`       | Resolved the apparent role-guard inconsistency                          |
| `definitions.coffee`                   | Legacy staff route definition (superseded)                              |
### 12.2 Paths

|                                         |                                                                   |
| --------------------------------------- | ----------------------------------------------------------------- |
| `units/states/tasks/inbox/`             | Revealed the Angular migration                                    |
| `units/states/tasks/inbox/directives/`  | Revealed inbox-dashboard, moderation, staff-task-list, task-claim |
| `projects/states/dashboard/`            | Revealed directives, dashboard.tpl, selected-task.service         |
| `projects/states/dashboard/directives/` | Revealed progress-dashboard, student-task-list, task-dashboard    |
| `task-dashboard/`                       | Revealed `task-dashboard.component.ts` plus legacy files          |
