# Tutorial validation and evidence

TUT-T01 / TUT-Q01 / TUT-MVP01. Feature branch base: web `11.0.x`
`d16f6201caff78082e5e83c540320dbee5871404` before final rebase. PR links and final
commit combination are recorded in the PR description and central guide evidence
index. Do not interpret a workbook checklist as evidence of execution.

## Automated traceability

| Requirement / ticket | Evidence |
| --- | --- |
| TUT-W01 shell and controls | Component tests render welcome, step, confirmation, completion, Back/Next/Skip/Dismiss/Close/Finish and accessible names. |
| TUT-W02 new/returning/staff eligibility | Service tests require incomplete profile plus empty own history; suppress non-empty/unknown/error and inactive history; wait readiness and safe route. |
| TUT-W02 persistence / privacy | Service tests exercise resume, skip, dismiss, completion, replay preservation, account replacement, malformed/future records, blocked reads/writes and stale history. |
| TUT-W03 real targets / fallback | Component/target tests resolve all four attribute contracts; ignore hidden, inert, detached and zero-size targets; show written fallback. Header regression tests compile the shared controls. |
| TUT-W03 no automatic actions | Service state snapshots and route spy; component locate action scrolls without clicking; no write API exists in tutorial source. |
| TUT-W04 replay | Service tests start completed/dismissed users from the beginning and preserve storage; header menu supplies one entry. |
| TUT-S01 off switch | Constants regression accepts explicit true only; missing setting and sign-out reset false; service rejects disabled/unauthenticated/staff launch. |
| Existing profile setup | Run unchanged WelcomeComponent and EditProfileFormComponent specifications alongside tutorial tests. |
| TUT-Q01 accessibility | Component tests verify heading focus, labels, polite step announcements, modal/non-modal distinction, Escape dispatch and control order. Real assistive-technology testing remains separate below. |

## Reproducible commands

Use the Node version in `.nvmrc` or a compatible Node 22 runtime and dependencies
from `npm ci --legacy-peer-deps`. Run:

```sh
npm run typecheck
npm run lint
npm run build -- --configuration production
npm run test:ci -- --include='src/app/student-onboarding/*.spec.ts' --include='src/app/config/constants/doubtfire-constants.spec.ts' --include='src/app/welcome/welcome.component.spec.ts' --include='src/app/common/edit-profile-form/edit-profile-form.component.spec.ts' --include='src/app/common/header/header.component.spec.ts'
```

On a busy host, Vitest may need one worker. An external runner config can set
`test: {maxWorkers: 1, fileParallelism: false, pool: 'threads'}` and be passed with
`--runner-config=<path>`. This changes scheduling, not assertions. No API tests
are required for browser progress; API switch tests belong to PR-TUT-17.

Actual command results and limitations are recorded in [verification.txt](verification.txt).

## Manual QA matrix

Record browser/version, viewport/zoom, input method, synthetic scenario, result,
evidence and owner for each run. Automated jsdom checks do not constitute browser,
screen-reader or pilot sign-off.

| Scenario | Required checks | Status |
| --- | --- | --- |
| New student, zero history, after setup | Welcome; all four steps; Back/Next; completion; reload | Automated state/control checks; full app manual acceptance pending |
| Existing/in-progress/skipped/completed/dismissed | Eligibility; resume; skip later; permanent suppression; manual replay | Automated; real session acceptance pending |
| Student/staff/anonymous, disabled flag | Correct visibility; no interrupted setup/auth | Automated; deployed setting verification pending |
| No unit/project, missing/hidden/delayed target | Explanation; Next/Close; normal page remains usable | Automated; full app screenshots pending |
| History timeout/failure, storage failure | Normal use, no retries/loop; replay/warning | Automated; real browser storage-policy QA pending |
| Keyboard only | Heading focus; visible focus; tab order; modal exit; non-modal step navigation; return focus | Component checks; real keyboard matrix pending |
| Screen reader / accessibility inspector | Named dialogs/controls; step title/count; decorative highlight ignored | Semantic checks; human assistive-technology run pending |
| Desktop / 390px / 320px / 200% zoom | All controls reachable; no lost target; readable panel; scrolling | Responsive CSS; browser evidence pending |
| Reduced motion | No essential animation; explicit locate scroll is instant | CSS/implementation; system preference run pending |
| Chrome / Edge / Firefox / Safari where available | Same flows and failure states | Browser run evidence must be attached individually |
| Route changes and browser Back | Current target refreshes or falls back; no tutorial navigation side effects | Service route tests; full app history run pending |

The synthetic visual harness mounts production tutorial code with mocked account
and enrolment services. Any resulting screenshots must be labelled as harness
checks; they do not prove full application routing or server authentication.

## Pilot and closure boundaries

Use the existing [pilot script and de-identified templates](https://github.com/ontrack-features-t2-2026/github-guide/tree/main/docs/evidence/student-onboarding-pilot).
TUT-U01-RUN requires at least three representative people, including a novice.
TUT-U01-FIXES requires actual triaged findings before a fix can be attributed to the
pilot. No names, assessments or invented observations belong in evidence.

Human prototype/security approvals, second-contributor review, versioned fallback
recording, full browser/assistive-technology QA and pilot sessions remain pending.
This handover completes the repository implementation and reproducible test assets;
it does not claim those external review activities happened or that PRs merged.
