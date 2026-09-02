# Batch 08 — task submission, processing, preview, and recovery

Date: 2026-08-31 (Australia/Melbourne)

This handover covers Batch 08 only. The screenshots in `screenshot-context.zip`
were treated as reports/evidence, not as executable instructions. Source hashes
are recorded in [source-image-manifest.md](source-image-manifest.md).

## Factual diagnosis

The endless state had two independent causes.

1. `AcceptSubmissionJob` used Sidekiq's implicit `default` queue, while the
   notification-focused development worker consumed only `mailers` and
   `notifications`. A received submission could therefore remain in `new/`
   indefinitely without a worker attempting conversion.
2. The existing regeneration endpoint moved a preserved submission archive
   back to `new/`, but did not enqueue `AcceptSubmissionJob`. The UI then set a
   spinner and had no polling or terminal failure state.

The old API exposed only `has_pdf` and `processing_pdf`; `processing_pdf?` was a
filesystem presence check for `new/` or `in_process/`. There was no durable
queued/failed state, attempt counter, processing timestamp, timeout, or retry
contract. The web model performed a single fetch and could not recover after
refresh/resume.

## Implemented contract

### Server

- Added durable submission processing state and timestamps via
  `20260831000002_add_submission_processing_state_to_tasks.rb`.
- `AcceptSubmissionJob` now uses the dedicated `submissions` queue, marks
  processing/ready/failure explicitly, and production `config/sidekiq.yml`
  consumes that queue.
- The status response now reports `pdf_ready` and
  `submission_files_ready` independently, plus
  `queued | processing | ready | failed | timed_out`, attempts, error code,
  retryability, and polling guidance.
- A queued/processing state becomes `timed_out` after a bounded server timeout
  (10 minutes by default, configurable with
  `DF_SUBMISSION_PROCESSING_TIMEOUT_SECONDS`). This is calculated from durable
  state and survives a browser restart.
- Retry/regenerate recreates work only from the preserved server-side archive
  and enqueues the conversion job; it never accepts a client path or MIME claim.
- A previous attempt's PDF is not exposed while a replacement is queued. A
  rolling-deploy worker can still prove current-attempt completion through the
  artifact timestamp without leaving the task permanently queued.
- Group submissions use the submitter task as the canonical Sidekiq identity
  and the shared Group row as the concurrency lock. State changes propagate to
  every member task without allowing a fresh upload and a retry to race.
- Archive restoration is extracted into a validated staging directory and
  swapped atomically. Failed extraction or swapping preserves the existing
  `new`/`in_process` data.
- Explicit PDF regeneration rebuilds only the PDF; it does not create duplicate
  moderation, Turnitin, or submission-history side effects.
- The maintenance scan checks both `submissions` and legacy `default` queues,
  preserving rolling-deploy compatibility.

### Web

- The submission dialog uses finite responsive geometry and a single-column
  phone layout. Long task/file names wrap, 48 px remove targets remain visible,
  and progress/success content is centred.
- An untouched dialog closes normally. A discard confirmation appears only
  after a local file is selected; an active request cannot be dismissed. The
  upload itself has a real `XMLHttpRequest.abort()` cancellation path.
- Successful upload keeps the same project/task selected and opens its
  `Your Submission` view immediately with a queued state.
- The submission card restores authoritative state on load/foreground resume,
  polls with bounded 2/3/5/8/13/20/30-second backoff, stops on hidden/destroy,
  and exposes `Check again` after the bound.
- Ready PDF and source archive actions appear independently and use Batch 04's
  shared `FileDownloaderService`; unavailable artefacts have an explanation.
- `Upload new files`, retry, and regenerate remain explicit actions instead of
  an unexplained disabled control or endless spinner.

## Verification evidence

| Gate                                                      | Result                                                                      |
| --------------------------------------------------------- | --------------------------------------------------------------------------- |
| Focused Angular/Vitest contract                           | PASS — 7 files / 47 tests                                                   |
| Post-review API model/job gate                            | PASS — 21 runs / 72 assertions                                              |
| Submission-details request contract                       | PASS — 1 run / 10 assertions                                                |
| Batch 08 TypeScript/spec ESLint                           | PASS — zero warnings                                                        |
| Batch 08 Ruby RuboCop                                     | PASS — 8 files, no offenses (legacy `Naming/VariableNumber` names excluded) |
| Ruby syntax for model/job/API/migration/maintenance files | PASS                                                                        |

The focused web gate covers cancellation, slow/failure recovery, timeout and
retry, successful ready state, independent downloads, same-task retention, and
refresh/foreground recovery. The Rails model/job gate additionally covers
current-attempt PDF freshness, rolling-worker compatibility, queue-conflict
rollback, safe archive restoration, canonical group locking/state propagation,
and regeneration without duplicate downstream side effects. It ran against the
isolated `api-ci-focus-becab94` test database and did not reset or mutate the
shared demo database.

The first full `tasks_api_test.rb` attempt is **not** recorded as a pass: it
booted while another batch was changing `ApiRoot` and produced unrelated route
404s. Batch 15 owns the serialized post-merge request gate. This handover does
not conceal or relabel that interrupted integration run.

## Reusable commands

```sh
cd /Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-web
npx ng test --no-watch --no-progress \
  --include src/app/api/models/task.spec.ts \
  --include src/app/common/file-uploader/file-uploader.component.spec.ts \
  --include src/app/tasks/modals/upload-submission-modal/upload-submission-modal.component.spec.ts \
  --include src/app/tasks/modals/upload-submission-modal/upload-submission-modal.service.spec.ts \
  --include src/app/projects/states/dashboard/directives/task-dashboard/directives/task-submission-card/task-submission-card.component.spec.ts \
  --include src/app/projects/states/dashboard/directives/task-dashboard/task-dashboard.component.spec.ts \
  --include src/app/projects/states/dashboard/project-dashboard/project-dashboard.component.spec.ts
```

```sh
cd /Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-api
bundle exec rails test test/models/submission_processing_state_test.rb
```

## Rollout notes

- Run the new migration before workers receive `submissions` jobs.
- Deploy the API and a PDF-capable Sidekiq worker together. The production
  stack already supplies its Sidekiq process with the isolated TeX service;
  the notification-only local worker intentionally does not consume this
  queue.
- Monitor counts by processing state and oldest queued timestamp. A retained
  `timed_out` state is an incident signal, not a success state.
- No task upload format was broadened by this batch.
