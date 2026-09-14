# Batch 02: mobile feedback composer, audio, and conversation landing

## Result

Batch 02 is complete in the `doubtfire-web` evidence lane at detached base revision
`024e12ee15e7c0309d36a621aff29b98bb4d8f6e`. It changes the feedback composer, audio recorder/player,
and task-scoped latest-message reveal contract only. Existing Batch 01 work and the pre-existing
`package-lock.json` change were preserved.

## Diagnosis before change

- The composer used a `contenteditable` `div` with `enterkeyhint="send"` and
  `(keydown.enter)="send($event)"`. Return therefore posted instead of creating a paragraph. The
  field prompt was only `Aa`, and the normal text path had no labelled Send button.
- Attachment and microphone actions collapsed while typing, the microphone sat on the leading side,
  and the emoji action was a bare icon rather than a button. The picker had no outside-tap, Escape,
  route, task-change, or successful-send dismissal contract.
- The footer had no safe-area padding. Its controls used negative-margin/scale positioning, which
  explains the reported alignment and bottom-edge failures.
- The recorded preview drew uncancelled animation frames. Sent audio exposed progress but no decoded
  waveform, no one-at-a-time coordinator, incomplete error/replay behavior, and incomplete cleanup of
  media resources.
- Conversation reveal used fixed 50/100 ms guesses and a global comment-added event. It could act on
  stale cached history or the wrong mounted task, and it had no reusable pending intent for a future
  notification route.

The source observations and immutable hashes are in [source-image-manifest.md](source-image-manifest.md).

## Implemented behavior

### Composer and emoji

- A labelled `<textarea>` uses `inputmode="text"`, `enterkeyhint="enter"`, and a clear
  `Write a message...` prompt. Enter remains available for new lines.
- A visible `Send`/`Save` action is the only text submit path. It is disabled for whitespace and
  while a request is in flight.
- The order is attachment, field, microphone, emoji, Send. The field auto-grows to 144 px, then
  scrolls internally.
- Phone controls use 44–48 px targets and the footer uses left, right, and bottom
  `env(safe-area-inset-*)` padding. No Discord gift action was added.
- The emoji picker is bounded to the viewport and has a transparent outside-tap backdrop. The same
  target guard also handles pointer/click events; Escape returns focus to the trigger. Route changes,
  task changes, recorder mode, and successful sends close it. Interactions inside the picker remain
  open.

### Audio

- Recording has explicit `inactive`, `requesting`, `recording`, and `stopping` states. Cancelling a
  pending permission request stops a late stream instead of retaining it.
- Permission denial and empty recordings produce recoverable messages. A failed audio post retains
  the preview so it can be retried; success discards it.
- Recorder previews capture bounded real time-domain amplitudes and draw played/unplayed progress.
  Sent messages decode the audio into 40 normalized waveform peaks and show elapsed/total time.
- Preview and sent-audio timelines support pointer and keyboard seeking. Ended audio resets for
  replay; corrupt or zero-duration media enters a finite error state.
- A shared coordinator permits one active audio element. Batch 01 lifecycle events pause media on
  backgrounding and route changes without automatic resume.
- Streams, tracks, audio contexts/nodes, workers, object URLs, animation frames, DOM listeners, and
  subscriptions are released on cancellation, replacement, completion, or destruction.

### Latest-message landing

`ConversationLandingService.requestLatestMessages({projectId, taskDefinitionId})` records a
non-sensitive, one-shot intent. A matching viewer waits for authoritative history, then waits two
render frames, reveals its own end marker and composer, and does not focus the textarea. Stale task
loads and animation frames are cancelled. The complete Batch 11 integration contract is documented
in [conversation-landing.md](conversation-landing.md).

## Evidence

- [composer-390x844.png](composer-390x844.png) is a privacy-safe crop from the local synthetic app.
  It shows the two-line field, far-left attachment, right-side microphone/emoji, and explicit Send.
  SHA-256: `b0299318feeb796e5daa91d68d56c7cf1f052d2d1eac8ba378750de007005047`.
- [layout-measurements.json](layout-measurements.json) records the 320, 360, 390, 412, and 1024 px
  geometry. Every measured width had `documentScrollWidth === viewportWidth`; phone controls remained
  at least 44 px; the form retained 15 px below it and 12 px between controls and its bottom edge.
- Browser Return-key verification left the value as `Line one\n` and did not invoke Send. The field
  was cleared afterward; no feedback was posted.
- At 390 px the emoji panel measured `left=8`, `right=382`, `top=321`, `bottom=741`; Escape closed it
  and returned focus to `Choose an emoji`. Pointer, click/backdrop, and inside-picker paths are also
  covered by the component test.
- Actual microphone permission and live audio upload were deliberately not invoked. Recorder,
  decoding, playback, failure, and cleanup cases use deterministic fake media in the tests.

## Verification

Final checks on 30 August 2026 (Australia/Melbourne):

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass, zero warnings |
| Focused Batch 02 integration set | 11 files, 50 tests passed before the final full run |
| `npm run test:ci` | 124 files passed; 813 tests passed; 1 existing todo |
| `npm run build` | Pass; output generated in `dist/` |
| `git diff --check` | Pass |

The first full-suite attempt shared memory with the dev server and exhausted that container. The
authoritative final run used the same mounted source/dependencies in a disposable container with the
dev server stopped and exited successfully. A Batch 02 test also initially restored
`requestAnimationFrame` without its original writable descriptor; preserving the full descriptor
removed that cross-file test leak before the successful full run.

## Batch boundary and next integration

- Batch 03 still owns staged attachments, DOCX/MIME policy, retry grouping, and durable draft state.
  This batch deliberately did not redesign attachment upload semantics.
- Batch 05 still owns the outer page scroll/sticky shell and hardware-device viewport acceptance.
- Batch 11 still owns notification parsing, validation, navigation, and browser history. After its
  destination is accepted, it should request the task identity through `ConversationLandingService`;
  it must not reimplement scrolling or focus the field.
- No API or deployment repository change was required, and no production data or external service
  was accessed.

## Batch 02 code map

- Composer: `src/app/tasks/task-comment-composer/task-comment-composer.component.{ts,html,scss}`
- Composer regression matrix: `src/app/tasks/task-comment-composer/task-comment-composer.touch-targets.spec.ts`
- Sent audio: `src/app/common/audio-player/audio-player.component.{ts,html,scss}`
- Recorder state/preview: `src/app/common/services/recorder-service.ts` and
  `src/app/common/audio-recorder/audio/base-audio-recorder.ts`
- Audio coordination/waveform: `src/app/common/services/audio-playback-coordinator.service.ts` and
  `src/app/common/services/audio-waveform.service.ts`
- Landing: `src/app/tasks/task-comments-viewer/conversation-landing.service.ts` and
  `src/app/tasks/task-comments-viewer/task-comments-viewer.component.ts`

The adjacent discussion/microphone consumers were updated only to use the new recorder cleanup and
lifecycle contract.
