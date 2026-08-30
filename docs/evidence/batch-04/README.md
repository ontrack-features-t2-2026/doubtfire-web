# Batch 04: attachment contrast, responsive PDF preview, and download feedback

## Result and scope

Batch 04 is complete in the active web lane at
`/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-web`. It builds on the attachment
metadata and authorized download contract from Batch 03. The change is intentionally limited to sent
feedback attachments, the feedback PDF modal, and the shared download-start helper. No feature-page
redesign and no Batch 05 shell/scrolling work is included.

No API or deploy change is required for this batch. Batch 03 remains the server prerequisite because
it supplies `attachment_file_name`, `attachment_mime_type`, `attachment_byte_size`, and the authorized
attachment response headers used here.

## Diagnosis before change

- The sent PDF action was `text-formatif-blue` inside the blue outgoing feedback bubble. Its icon and
  “view pdf” label could disappear into the background; a DOCX had no equivalent semantic card.
- The modal fetched the complete PDF before opening, so slow and failed requests had no finite modal
  state. It rendered a large fixed-looking surface with icon-only or ambiguous controls, a giant search
  field, no filename, and a blank surface when preview was disabled.
- The existing PDF toggle exposed an unexplained implementation switch between the OnTrack PDF.js
  viewer and the browser viewer. Search, zoom, download, mode, and close were not presented as one
  responsive, labelled control set.
- File downloads parsed only the basic `filename=` parameter, could use an unsafe path-like name, and
  gave inconsistent feedback. Preview fetches and user downloads also needed different semantics:
  fetching a preview is silent, while a user download may truthfully say only that browser dispatch
  started—not that a file was saved.

The immutable before-state observations are indexed in
[source-image-manifest.md](source-image-manifest.md). Screenshots are evidence, not instructions.

## Implemented behavior

### Shared sent-attachment card

- PDF, DOCX, and generic sent files use one keyboard-operable button card with a file icon, visible
  type badge, original filename, optional byte size, and an explicit **Preview** or **Download** action.
  Type and action are conveyed in text and accessible names rather than color alone.
- Long names wrap within a `minmax(0, 1fr)` grid and the feedback bubble is bounded to the viewport.
  Focus receives a three-pixel yellow outline outside the card.
- An outgoing card uses white text on `#2424b8` (10.40:1 contrast). An incoming card uses `#171725`
  on white (17.71:1; 15.57:1 against the surrounding `#f1f0f0` bubble). These exceed WCAG AA for
  normal text, including metadata and action labels.
- Images keep an explicit semantic preview button. Their background preview retrieval remains silent
  and the owned object URL is released on destruction.

### Responsive PDF modal and finite viewer states

- Selecting a PDF opens the modal immediately with the authorized URL and actual attachment filename.
  The modal therefore owns visible `loading`, `ready`, `error`, `empty`, and `preview disabled` states.
  Retrieval or parser failures end in a useful alert with **Retry** and **Download** rather than a
  permanent spinner or blank panel.
- The header shows the filename, preview type, and a 48-pixel labelled Close button. Angular Material
  provides the dialog focus trap, native Escape dismissal, close-on-navigation, initial close-button
  focus, and focus restoration. There is no duplicate document-level Escape listener.
- Preview on/off and viewer mode are separate named controls. **OnTrack viewer** means the searchable,
  zoomable PDF.js renderer; **Browser viewer** means the browser's embedded PDF renderer. The legacy
  `useNativePdfViewer` preference is migrated into the named mode.
- Search, bounded 50–250% zoom, mode, preview, download, and close controls have visible labels or
  exact accessible names. The real filename propagates from the Batch 03 response through the card,
  modal header, viewer, and download.
- The toolbar wraps at 720 CSS pixels; primary actions use three equal columns on a phone and stack
  below 359 pixels. Controls are at least 44 pixels. The dialog becomes a safe-area-aware, borderless
  `100dvh × 100vw` surface at narrow width or height, while desktop is capped at 960 pixels. The same
  CSS-pixel breakpoints apply when a desktop viewport reaches the narrow layout at 200% zoom.
- Remote preview blobs are owned and revoked by the viewer. A caller-provided `blob:` URL remains
  caller-owned. Stale preview callbacks cannot replace a newer PDF and their object URL is released.

### One shared download-feedback implementation

`FileDownloaderService` has one private semantic dispatch path used by two public convenience entry
points:

- `downloadFileWithFeedback` fetches an authorized URL, derives the response filename, owns and revokes
  its object URL, and suppresses a stale response for the same logical control.
- `downloadBlobToFileWithFeedback` dispatches an existing caller-owned blob URL without revoking it.

Both routes call the same helper that clicks the download link and only then announces
`Download started: <filename>`. Dispatch or network failure gives a short accessible error and never
echoes raw server details. No message claims the browser saved the file.

RFC 5987 `filename*` takes precedence over `filename`; malformed or unsupported extended values fall
back safely. Control, bidirectional-control, and path characters are removed, only the final path
segment is retained, and the name is capped at 255 Unicode code points. Internally created object URLs
are revoked after browser dispatch.

Preview retrieval continues to use the toast-free `downloadBlob` method. This batch migrates the
feedback attachment download and the PDF viewer only. Later feature batches should reuse
`downloadFileWithFeedback` for their own task-sheet, submission, portfolio, or calendar actions rather
than creating another toast helper.

## Verification table

Focused checks run on 31 August 2026 (Australia/Melbourne):

| Contract | Evidence/result |
| --- | --- |
| Shared feedback dispatch, `filename*` precedence, sanitization, click-before-message, stale suppression, release, and controlled failure | `file-downloader.service.spec.ts` |
| Authorized comment attachment caller uses the shared helper | `task-comment.service.spec.ts` |
| Card PDF/DOCX/generic labeling, author variants, long name, byte size, focusable button, and action output | `sent-attachment-card.component.spec.ts` |
| PDF loading/ready/error/empty/preview-off states, actual filename, labelled controls, zoom bounds, retry, mode migration, silent preview, and object-URL ownership | `pdf-viewer.component.spec.ts` |
| Modal filename/header/close and responsive dialog/focus/Escape configuration | `comments-modal.component.spec.ts` and `comments-modal.service.spec.ts` |
| PDF opens before retrieval; image preview remains silent and releases its object URL | `pdf-image-comment.component.spec.ts` |
| Combined focused Angular run | 14 suites, 25 tests, 25 passed, 0 failed |
| Web TypeScript check | Passed after Batch 04 implementation |
| Targeted Batch 04 formatting/lint | Passed |
| `git diff --check` | Passed |

The verification is deterministic component/service coverage and source-level responsive inspection.
The local unauthenticated app shell was reachable, but no production or user account was used to
manufacture a signed-in feedback conversation screenshot. The original screenshots therefore remain
the immutable visual before evidence; later integrated device verification should capture the same
PDF and DOCX cards at 320/360/desktop widths without changing this contract.

## Handover / code map

- sent attachment component:
  `src/app/tasks/task-comments-viewer/sent-attachment-card/sent-attachment-card.component.{ts,html,scss}`
- feedback viewer integration:
  `src/app/tasks/task-comments-viewer/task-comments-viewer.component.{html,scss}` and
  `src/app/tasks/task-comments-viewer/pdf-image-comment/pdf-image-comment.component.{ts,html,scss}`
- responsive modal: `src/app/common/modals/comments-modal/comments-modal.component.{ts,html,scss}`
  and `comments-modal.service.ts`
- PDF state machine and controls: `src/app/common/pdf-viewer/pdf-viewer.component.{ts,html,scss}`
- shared download feedback: `src/app/common/file-downloader/file-downloader.service.ts`
- authorized attachment caller: `src/app/api/services/task-comment.service.ts`
- dialog surface override: `src/styles.scss` under `.comments-modal-dialog`
