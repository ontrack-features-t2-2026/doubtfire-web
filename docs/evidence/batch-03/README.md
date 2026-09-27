# Batch 03: staged attachments, DOCX, and private feedback drafts

## Result and lane

Batch 03 is complete in the active phone-evidence lanes:

- web: `/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-web` at base
  `024e12ee15e7c0309d36a621aff29b98bb4d8f6e`
- API: `/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-api` at base
  `51d662850db15dabc710cf10972415553d03b761`

The implementation is limited to feedback draft/attachment behavior and the API contract required to
store and retrieve those attachments. Batch 01 and Batch 02 work already present in the web lane was
preserved. No Batch 04 PDF-viewer, contrast, or shared download-start-feedback redesign is included.

## Diagnosis before change

- Picker, paste, and viewer drop paths posted an attachment immediately. They did not share the text
  draft or the Batch 02 explicit Send action.
- The file input and client allow-list omitted DOCX. The API's generic known-extension list omitted
  DOCX and its comment-attachment MIME list omitted the Word Open XML MIME type.
- The earlier draft path did not provide one exact user/unit/task/conversation key with a documented
  privacy boundary for raw `File` and `Blob` objects.
- Retrying a request had no client/server idempotency key. A response lost after commit could create a
  second comment, and attachment persistence was not one transactional operation with the comment row.
- Existing task-comment responses did not expose the original attachment filename, MIME type, or byte
  size. A DOCX could therefore not be rendered or downloaded with a faithful end-to-end contract.

The immutable source observations are indexed in
[source-image-manifest.md](source-image-manifest.md). Screenshots are observations, not instructions.

## Implemented behavior

### Staging and explicit sending

- Picker selection, picker cancellation, clipboard file paste, viewer drag/drop, and a completed audio
  recording all feed the same staged composer. None of those paths uploads, navigates, or refreshes.
- The picker accepts multiple items and advertises images, audio, PDF, and DOCX. Each staged item shows
  its original name, MIME/type label, formatted size, progress, failure message, Retry, and Remove.
  Long names wrap and action/status text is exposed to assistive technology.
- A second unsent audio recording replaces only the prior unsent recording; separately selected files
  remain staged.
- Batch 02's explicit Send action starts the queue. Each attachment is its own attachment comment with
  an empty caption and stable per-item `client_request_id`. Once every item succeeds, typed text is
  posted once with a separate stable draft-level request id. This avoids copying one caption onto every
  file and makes lost-response retries idempotent.
- Completed items leave the local queue. Failed items remain with their text draft and can be retried or
  removed independently. The final text is not posted until no failed/staged attachment remains.
- Empty, mismatched, unsupported, and files at or above 30,000,000 bytes are rejected before upload.
  The API repeats the authoritative validation and reports empty files as 422, oversized files as 413,
  and unacceptable formats as a controlled 403.

### Draft isolation and retention

The key contains signed-in user, unit, project, task definition, task instance, and the
`task-feedback` conversation. Text, reply id, and the stable text request id use `sessionStorage`.
Files and audio blobs remain only in the root-scoped in-memory draft service. Exact behavior and the
privacy decision are recorded in [retention-and-retry.md](retention-and-retry.md).

Successful send and explicit Discard clear only the current key. Sign-out/account change clears every
key and in-memory attachment owned by the prior user. Rapid task changes and deferred textarea/paste
callbacks carry a generation and task-key guard, so an old task cannot populate the next task.

### DOCX and attachment contract

- DOCX remains DOCX; there is no conversion. The server keeps exact bytes in the existing id-based
  comment-attachment storage path and separately records the safe original filename, detected MIME,
  and byte size.
- DOCX validation is scoped to `comment_attachment`/`word_document`; the generic extension allow-list
  was not broadened. The file must have a `.docx` extension, acceptable Word MIME, a readable OOXML ZIP,
  required `[Content_Types].xml`, `_rels/.rels`, and `word/document.xml` parts, and the correct main-part
  content type. Traversal, links/encryption, nested archives, excessive entries/expansion, missing parts,
  and corrupt packages are rejected.
- Display names remove directories and control/header-injection characters, retain safe Unicode and
  HTML-like characters, and are capped at 255 characters. They are never used as a storage path.
- Attachment metadata is conditional in comment JSON, so text-only response shape is not expanded.
  Download retains normal project authorization and returns the stored MIME, exact bytes, and a Rails
  RFC 5987-safe `Content-Disposition`. DOCX is always a download rather than inline content.
- The API database migration and rollout order are in [api-contract.md](api-contract.md).

## Verification

Final focused checks on 31 August 2026 (Australia/Melbourne):

| Check                                                  | Result                                          |
| ------------------------------------------------------ | ----------------------------------------------- |
| API DOCX/helper and task-comment request suite         | 17 runs, 97 assertions, 0 failures/errors/skips |
| Web draft/composer/viewer/service suite                | 5 files, 12 suites, 43 tests, 0 failures        |
| Web `npm run typecheck`                                | Pass                                            |
| Targeted web ESLint over Batch 03 implementation/tests | Pass, zero findings                             |
| Targeted web Prettier check                            | Pass                                            |
| Targeted API RuboCop over 8 implementation/test files  | Pass, zero offenses                             |
| Ruby syntax check over 8 implementation/test files     | Pass                                            |
| `git diff --check` in web and API                      | Pass                                            |

The API suite used an isolated seeded MariaDB and a cached Ruby 3.4 application image. It covers exact
upload/download bytes and metadata, attachment and text idempotency, uppercase extension, MIME
mismatch, corrupt/missing/invalid OOXML, traversal/nested archives, hostile/Unicode filenames,
30 MB boundary, authorization, rollback/no orphan row, and controlled rejection. The web suite covers
picker cancellation, multiple items, stage/remove/retry, text/reply/file task isolation, stale timer
guards, exact-key discard, offline/timeout retention, FormData request ids, progress, and viewer drop
delegation.

No production data, production storage, real user attachment, external delivery, or remote service was
used. The document fixture was the repository's 11,914-byte `test_files/TestWordDoc.docx`; its hash is
recorded in the source manifest.

## Handover / code map

Web:

- draft policy and keying: `src/app/common/services/feedback-draft-store.service.ts`
- staging, validation, send queue, retry, discard, and task guards:
  `src/app/tasks/task-comment-composer/task-comment-composer.component.{ts,html,scss}`
- attachment POST/progress and metadata mapping: `src/app/api/services/task-comment.service.ts`
- attachment model contract: `src/app/api/models/task-comment/task-comment.ts`
- viewer drop and DOCX download presentation:
  `src/app/tasks/task-comments-viewer/task-comments-viewer.component.{ts,html}`
- audio staging event: `src/app/common/audio-recorder/audio/audio-comment-recorder/`
- logout/account cleanup: `src/app/api/services/authentication.service.ts`

API:

- validation and OOXML inspection: `app/helpers/file_helper.rb`
- POST idempotency, controlled limits, and authorized download: `app/api/task_comments_api.rb`
- transaction/storage/metadata: `app/models/task.rb` and `app/models/comments/task_comment.rb`
- conditional entity fields: `app/api/entities/comment_entity.rb`
- schema: `db/migrate/20260831000001_add_attachment_metadata_to_task_comments.rb`
- focused tests: `test/helpers/batch03_docx_file_helper_test.rb` and
  `test/api/comments/batch03_docx_attachment_test.rb`

Batch 04 should reuse the new metadata/download contract, but still owns sent-attachment contrast,
responsive PDF viewing, and the one shared user-visible download-start helper. It must not replace the
Batch 03 idempotency or draft-retention contracts.
