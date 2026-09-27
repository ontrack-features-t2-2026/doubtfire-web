# Browser observations at 788fac88, 21 September 2026

**Historical intermediate result:** the Home findings below were subsequently fixed and retested on `3d61bd58`; see the [final Home report](../home-final/REPORT.md) and [evidence index](../REPORT.md).

**Home follow-up:** The Home findings below describe commit788fac88. The later bounded Home fix and real student/tutor retest are recorded in [final Home report](../home-final/REPORT.md); both progress names and settled320px widths pass there. This original evidence remains preserved.

The actual student task and settled unselected staff inbox have no default axe violations in the sampled desktop/320px states. Task Enter navigation still works, linked outcomes have valid list semantics, staff row names are present, and the empty footer no longer exposes a blank heading, progress bar or fake grade button. This is bounded browser evidence, not full WCAG or ticket closure.

## Source and runtime

- Web: `788fac88be24626178d8b994193db7cbadf98704`, tree `a82f5171ddf02206610c506224841155164d5644`, served from `http://127.0.0.1:4314`.
- The first after run started before commit, on base `2c4e1ac0235896f59aea33f94c33125f7f91fdfe` with `git diff HEAD -- src` SHA256 `2b5d7bf3acd683540c3a37bf8d2961aea25717bbfa649c8e7393af5df3f2a0ed`. The coordinator confirmed this exact frozen source became the commit above. The settled repeat directly records that commit and an empty source diff.
- Existing synthetic API: `7722612ef019b03bd6b4fb9319b83c52b0dac902`, `http://127.0.0.1:4310/api`, accessed through the frontend's same-origin `/api` proxy. Database authentication; no bypass or role changes.
- Existing API container `closure-api-20260921`, image `ontrack-unit-hub-release-preview-api:20260914`; test database `closure_test`. The local test initializer disables external TII/D2L integrations. No deployment-repository checkout was executed for this run.
- Chrome 153.0.8010.48, headless, reduced motion, 1280×900 and 320×900 CSS-pixel viewports. Local installed Playwright and axe-core. Default axe rules were used, including real-browser color contrast.
- Normal UI sign-in and token refresh were allowed. Every non-read API request except `POST /api/auth` and `POST /api/auth/access-token` was blocked by the browser request guard. Both completed runs recorded **0 business-write attempts and 0 page errors**. No comments, submissions, grades, profile settings or configurations were changed.

## Observed coverage

| State                                         | Settled evidence                                                                            | Default axe violations           | Width / landmarks                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------- |
| `/sign_in`, desktop and 320                   | Empty sign-in form, before credentials were filled                                          | 0 / 0                            | Width fits; one main, no banner because the header is hidden     |
| `/home`, desktop and 320                      | Use **settled/** evidence: synthetic project link visible; splash and local spinners absent | One unnamed progress bar in each | Desktop fits; 320 document/body width **331px**; one main/banner |
| `/projects/1/dashboard`                       | Actual native Report and Feedback task row                                                  | Not scanned separately           | Desktop fits; one main/banner                                    |
| `/projects/1/dashboard/1.2P`, desktop and 320 | Actual task pane, no visible spinner/skeleton/busy region                                   | 0 / 0                            | Width fits; one main/banner                                      |
| `/projects/1/dashboard/1.2P/feedback`, 320    | Named Task comment field and loaded feedback view                                           | 0                                | Width fits; one main/banner                                      |
| `/units/1/tasks/inbox`, desktop and 320       | **settled/** evidence: four real task rows; loading region and skeleton absent              | 0 / 0                            | Width fits; one main/banner                                      |
| `/unit-hub`, desktop                          | Unit Hub heading visible, loading heading absent                                            | 0                                | Width fits; one main/banner                                      |
| `/demo-controls`, desktop                     | Existing guard allowed this local route; no setting changed                                 | Six contrast nodes               | Width fits; one main/banner                                      |

“Width fits” only records `documentElement.scrollWidth <= viewport width`. It does not establish full reflow acceptance or native browser zoom behavior. Screenshots and individual control behavior must also be reviewed. Some Material task-tab labels are partly outside the narrow tab-strip viewport; this run does not claim that every tab's scrolling/pagination interaction was tested.

### Task activation and names

- Focused the native Report and Feedback task button and pressed Enter. The route changed from `/projects/1/dashboard` to `/projects/1/dashboard/1.2P`.
- The visible desktop Home logo link has `aria-label="Home"`; the small-screen header intentionally omits this logo. One application main/banner was present in authenticated sampled states. The local Unit Hub and Demo controls sections did not create nested mains.
- The rendered linked-outcome chips O1/O2 are `role="listitem"` within labelled chip sets; the previous unsupported chip-row parent violation is absent.
- All four staff rows have names. Three identify `Synthetic Student`; the fourth uses the existing User.name result `Synthetic Other Stude` (the model truncates name parts). The previous literal `undefined` is absent. Their full task purposes remain in `aria-label`, even when visible task text is ellipsized at 320px.
- Searching the staff inbox for a nonexistent fixture showed `No tasks match these filters.`. Clearing it restored four actual rows before the narrow capture.
- The unselected desktop footer has seven named, disabled action buttons and no progress bar, heading or interactive grade chip. The narrow inbox shows no visible footer actions. No disabled action was invoked.

### Actual task tab states and contrast

Both actual desktop and 320px task-detail captures reported all three tabs with `aria-disabled="false"`; no disabled-control contrast exception was needed. Each label and tab had opacity 1. Their nearest painted background was `rgb(23, 27, 33)` (`#171b21`).

| Tab             | Selected | Label color                      | Measured role/state             |
| --------------- | -------- | -------------------------------- | ------------------------------- |
| Task Details    | true     | `rgb(129, 140, 248)` / `#818cf8` | `role=tab`, enabled, tabindex 0 |
| Task Sheet      | false    | `rgb(153, 162, 176)` / `#99a2b0` | `role=tab`, enabled             |
| Your Submission | false    | `rgb(153, 162, 176)` / `#99a2b0` | `role=tab`, enabled             |

Full actual classes, markup, font size/weight, attributes, and ancestor computed opacity/background values are retained in `student-task-desktop-semantics.json` and `student-task-320-semantics.json`. The linked color-contrast violations observed before the fix are absent in both default axe scans.

## Remaining findings and limits

1. **Home:** A real enrolled-unit-card determinate progress bar lacks an accessible name (`aria-valuenow="22"`). The settled 320px page also has 11px horizontal overflow. Exact HTML is in `settled/home-320-axe.json`; the actual screenshot is `settled/home-320.png`. These were reported to the coordinator for scope/implementation handling.
2. **Local Demo controls preview:** `.ppi-preview__safety` and `.push-preview__safety` (including its `code`) use `#52525b` on `#1f2530`, about 1.98:1. Three text nodes within `.push-preview__notification` use `#e6e8ec` on white, about 1.22:1. These are pre-existing local-preview styles, sampled because the main container changed; they are outside this agreed critical student/staff journey fix and are a candidate Theme/Demo-owner follow-up. No remediation or approval is implied by this report. Exact selectors/HTML are retained in `demo-controls-desktop-axe.json`.
3. Axe **incomplete/manual-review** results remain. Examples include `f-unit-code` custom-host `aria-expanded` and color-contrast cases requiring manual inspection. A zero-violation scan is not a zero-incomplete result. Full JSON is preserved; this report does not convert incomplete checks into passes.
4. No actual screen reader, native 200/400% zoom, mobile Safari, complete dialog focus-return set, upload/submission, comment posting, marking/grade save or other mutation journey was exercised. Those require the separate manual closure procedure.

## Evidence selection and harness limitations

- Preserve the original **before** folder `../before/` unchanged.
- `results.json` records the first after run. Machine-specific harnesses and logs remain local. Its initial Home captures were under a global splash overlay and are **not settled Home evidence**; use `settled/home-*` instead.
- The first after staff readiness locator matched both the outer busy region and nested decorative skeleton nodes, causing a Playwright strict-locator error. That is a harness error, not an application defect. Its `staff-inbox-desktop-not-settled*` captures remain local and are omitted from the published selection; only the aggregate attempt history is published. They must not be counted as a settled pass or failure.
- The settled repeat corrected readiness to the unique labelled loading region, waits for actual rows, and waits for the global splash to disappear. Its `settled/results.json`, screenshots, AX snapshots, semantic JSON and axe JSON are authoritative for Home and staff observations above.
- Each successful capture has a PNG, `-aria.txt` and `-semantics.json`. Each scan has `-axe.json`. No passwords, tokens or cookies were written to reports or screenshots. Credentials were read in memory from the private fixture manifest.
