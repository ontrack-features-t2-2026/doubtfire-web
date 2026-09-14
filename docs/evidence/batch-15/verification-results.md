# Batch 15 verification results

**Captured:** 2026-08-31, Australia/Melbourne
**Scope:** final current-tree static, isolated API/database, guarded demo and browser gates

## Tree identity

| Layer  | Working path                                                                | Base HEAD                                  | State tested                                                                    |
| ------ | --------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| Web    | `/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-web`    | `024e12ee15e7c0309d36a621aff29b98bb4d8f6e` | Dirty shared working tree containing Batches 01–15 selected web changes         |
| API    | `/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-api`    | `51d662850db15dabc710cf10972415553d03b761` | Dirty shared working tree containing Batches 03, 07–12 selected API changes     |
| Deploy | `/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-deploy` | `e791b57ba3e949e01285270f4bc0ea29fb23bb39` | Dirty shared working tree containing the guarded Batch 09 demo launcher changes |

These are integrated uncommitted working trees, not a release commit. The exact release revision
must be captured after the changes are committed or merged.

## Batch 15 non-database gates

| Command/gate                                                                                | Result                                                                                                                                                           | Evidence boundary                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web `npm run typecheck`                                                                     | **PASS**, exit 0                                                                                                                                                 | Current merged web sources after Batch 12 and the mechanical lint cleanup                                                                                                                                                                                                                                                                     |
| Web `npm run lint`                                                                          | **PASS**, exit 0, `All files pass linting`                                                                                                                       | The first integrated run found 19 attribute-order errors and 6 Prettier warnings across B04/B08/B10/B12 integration points. An approved `eslint --fix` changed ordering/formatting only; no behavior was altered.                                                                                                                             |
| Merged high-risk Angular/Vitest union in project Node 22 container                          | **PASS: 44 files, 362 tests**                                                                                                                                    | B01 lifecycle/bootstrap; B02–04 feedback/audio/files/PDF; B05–08 shell/tasks/submission; B09–11 demo/PPI/notifications; B12 identity/email; B13 planner/calendar; B14 portfolio/tutorial/group specs                                                                                                                                          |
| Post-browser contained-fix Angular set                                                      | **PASS: 4 files, 23 tests**                                                                                                                                      | Emoji outside-dismissal, Additional-email component/service, and Project Planner initialization. Two regression tests were added after the 362-test union.                                                                                                                                                                                    |
| Same union attempted on host Node 26                                                        | **Not authoritative:** 43 files/356 tests passed; six PDF specs failed before assertions because Node 26 exposed no `localStorage` without `--localstorage-file` | The same six PDF specs passed in the project Node 22 run. This was an environment mismatch, not relabelled as a product failure.                                                                                                                                                                                                              |
| Web development bundle: `npm run build -- --configuration development` in Node 22 container | **PASS**, exit 0, 31.621 s; output generated in `dist/`                                                                                                          | Proves the merged Angular bundle compiles; it is not a production-optimised release artefact.                                                                                                                                                                                                                                                 |
| Web production bundle: `npm run build -- --configuration production`                        | **PASS**, exit 0, 86.695 s; 11.03 MB initial bundle                                                                                                              | Final rerun used the project Node 22 image, a 6 GiB Node heap and the existing dependency volume after stopping rerunnable containers inside Docker's 7.75 GiB VM. Earlier host/container exits 134/137 are superseded resource diagnostics. Component-budget, CommonJS and selector warnings remain visible for release review.              |
| Signed-out merged browser geometry, captured by the root integration owner                  | **PASS** at 320×800, 360×800, 390×844, 412×915, 800×360 landscape, and 1440×900                                                                                  | `document`/`body` scroll width equalled the target width at every size. Mobile form width was viewport minus 32 px; the landscape form was 416 px and centred. Evidence: `browser/signed-out-320.png` (SHA-256 `0deb9c91552c71d717cea34a42bc25d47df06c67c2145ccf7eaa55874e4e5bd6`). This report attributes rather than claiming that capture. |
| Authenticated isolated-demo browser journey                                                 | **PASS for the recorded current-browser scope**                                                                                                                  | Tasks/filter/search, composer draft/emoji, demo controls, PPI full/privacy states, seven notifications/confirmation/deep link, profile, planner/calendar, extension dialog, portfolio, tutorials and both Group states at 390 px. Authenticated task-shell widths equalled 320/360/390/412/800/1440. See `browser-results.md`.                |
| API Ruby 3 syntax across all changed/untracked `.rb` files                                  | **PASS: 47 files**                                                                                                                                               | Ran in `notifications-demo-api`; host Ruby 2.6 was deliberately not used because it cannot parse the repository's supported anonymous block forwarding syntax.                                                                                                                                                                                |
| Final isolated API gate                                                                     | **PASS: 157 runs, 6,010 assertions, 0 failures, 0 errors, 0 skips**                                                                                              | Core 150/5,968 plus task-sheet 1/8, submission-details 1/10 and identity-policy 5/24 in isolated `api-ci-focus-becab94`. Covers DOCX, B08 processing, guarded scenario, PPI privacy, notifications, identity and additional email/mail.                                                                                                       |
| Deploy `bash -n development/all-features-demo/demo.sh`                                      | **PASS**                                                                                                                                                         | Syntax only; did not seed, reset, or destroy any database.                                                                                                                                                                                                                                                                                    |
| Guarded `./demo.sh prepare`                                                                 | **PASS**                                                                                                                                                         | Isolated all-features DB only. Verifier: 10 tasks, 60% submitted, 10% complete, three available and one insufficient PPI hook, seven notifications, Team Indigo 3/4. No shared/live database was touched.                                                                                                                                     |
| `git diff --check` in web/API/deploy                                                        | **PASS** in all three trees                                                                                                                                      | Repeated after the mechanical lint cleanup and Batch 15 documentation.                                                                                                                                                                                                                                                                        |

## Contained integration regressions fixed in Batch 15

The full linter exposed only ordering/formatting failures. The contained fix ran ESLint's own fixer
over these existing feature templates/modules:

- `src/app/common/modals/comments-modal/comments-modal.component.html`
- `src/app/common/pdf-viewer/pdf-viewer.component.html`
- `src/app/doubtfire-angular.module.ts`
- `src/app/projects/states/dashboard/directives/progress-dashboard/peer-progress-unit-summary/peer-progress-unit-summary.component.html`
- `src/app/projects/states/dashboard/directives/task-dashboard/directives/task-submission-card/task-submission-card.component.html`
- `src/app/projects/states/dashboard/directives/task-dashboard/task-dashboard.component.html`
- `src/app/tasks/task-comments-viewer/pdf-image-comment/pdf-image-comment.component.html`
- `src/app/tasks/task-comments-viewer/sent-attachment-card/sent-attachment-card.component.html`

The result reorders attributes/imports and applies Prettier wrapping only. The authenticated merged
walkthrough then exposed and Batch 15 narrowly repaired three behavioral integration faults:

- optional chaining now also protects an emoji ViewChild's transiently missing `nativeElement`;
- Additional notification email response callbacks explicitly mark the profile view for checking;
- the planner height uses a finite zero-item fallback instead of transient `NaN`.

The subsequent full lint, typecheck, 4-file/23-test post-fix set and direct browser retests all
passed. No new browser error was emitted by the repaired paths.

## Completed focused gates inherited from batch handovers

| Batch | Reported focused result                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01    | Full web suite 119 files / 782 tests; typecheck/lint/development build pass; initial production optimiser OOM boundary documented and resolved by the final Batch 15 Node 22 rerun                    |
| 02    | Full web suite 124 files / 813 tests plus focused media/composer checks; typecheck/lint/build pass                                                                                          |
| 03    | Web 43 tests; API 17 runs / 97 assertions; DOCX exact-byte/idempotency/security coverage                                                                                                    |
| 04    | Web 14 suites / 25 tests; typecheck and targeted lint pass                                                                                                                                  |
| 05    | Web 8 suites / 80 tests plus signed-out browser geometry at 320/360/390/412/1440                                                                                                            |
| 06–07 | Combined web 13 suites / 94 tests; final task-sheet API request gate passed 1 run / 8 assertions                                                                                            |
| 08    | Web 47 focused tests; final API model/job 21 runs / 72 assertions plus request 1/10; rolling-worker/group/retry/archive cases pass                                                          |
| 09    | Web 45 tests, typecheck/lint, deploy compose contract, final database scenario gate and exact guarded fixture verifier pass                                                                 |
| 10    | Web 93-test PPI/Burndown set plus 18 demo tests; final privacy/scenario Rails gate and available/insufficient authenticated browser states pass                                             |
| 11    | Web 11 files / 176 tests; notification API gate, seven-row browser presentation, confirmation and feedback deep-link journey pass                                                           |
| 12    | Web 34 tests; API 89 runs / 1,268 assertions; typecheck/targeted lint/RuboCop pass; no external delivery was attempted because the configured SMTP target is Mailpit with no outbound relay |
| 13    | Web 7 files / 51 tests; WebCal API 15 runs / 76 assertions; browser geometry at 320/360/390/412/1440                                                                                        |
| 14    | Web 8 files / 22 tests; typecheck/lint/format pass; authenticated 390 px Portfolio/Tutorial/ordinary-empty/Team Indigo states recorded                                                      |

Counts above are the batch owners' recorded results and are linked from each batch README. Batch 15
does not combine them into a fictitious single full-suite count.

## Final serialized gates and remaining boundaries

The reserved database and browser lane completed after all batch owners stopped writing:

1. migrations plus the combined isolated API set passed 157 runs / 6,010 assertions;
2. guarded all-features preparation and its exact fixture verifier passed;
3. the authenticated synthetic browser journey and seven hashed after-state images were recorded in
   [browser-results.md](browser-results.md).

The first isolated identity-policy invocation reported fixture setup errors because the preceding
scenario cleanup intentionally left that test database with no baseline units. Standard test
population restored only `api-ci-focus-becab94`; the identity set then passed 5/24 and the combined
result above was green. No shared demo or live database was touched, and the setup error is not
silently counted as a pass.

The following are still deliberately not called passes:

1. true 200% page zoom, real Android/iOS audio, soft keyboard, OS resume/process eviction, Android
   Back and installed-PWA cache behavior;
2. a real PDF/TeX production worker plus slow/failed browser upload journey;
3. external SMTP arrival, because the available runtime has no outbound relay.

## Outbound email boundary

The available API and worker use SMTP `mailpit:1025`, a `.local` sender, and a Mailpit instance with
no configured outbound relay/provider. This is safe for local capture but cannot deliver to either
authorised external address. No external email was sent and arrival must not be claimed. Batch 12 did
perform a local-catcher-only transaction with a reserved `example.test` recipient: Mailpit accepted
Message-ID `6a94a3af16a7a_109887455@16978d6d8b75.mail` as internal id
`7YMk3ebqBBvF5d4KeNUVX3`; the database transaction rolled back. The next owner must configure a
controlled provider/sender/domain and then send at most the single non-sensitive authorised external
test described by the work pack.
