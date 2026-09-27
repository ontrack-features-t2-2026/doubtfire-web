# Batch 02 conversation landing contract

## Scope

This slice owns the feedback conversation's readiness and reveal behavior only. It does not parse
notification records or URLs, navigate, replace browser history, or change the shared page/sticky
scroll shell.

## Diagnosed pre-change behavior

- `TaskCommentsViewerComponent` tried to scroll its inner comments element after fixed 100 ms and
  50 ms delays. Those timers were guesses rather than a rendered-history boundary.
- A populated cache was shown before an authoritative comments request. A notification could point
  to a message absent from that cache, but there was no separate "fresh history ready" signal.
- Comment requests were not cancelled when the selected task changed, so a late result could act on
  the next conversation.
- The global `commentAdded$` event scrolled every mounted viewer, including viewers for other tasks.
- A failed history request never cleared the loading spinner.
- Notification destinations already use the `/projects/:projectId/dashboard/:task/feedback` route,
  but there was no route-agnostic pending hook for an already-open destination to invoke.

## Reusable API

`ConversationLandingService` accepts a stable, non-sensitive conversation identity:

```ts
const request = conversationLanding.requestLatestMessages({
  projectId: task.project.id,
  taskDefinitionId: task.definition.id,
});
```

The request is one-shot and remains pending if the destination viewer has not mounted or its fresh
history has not arrived. The matching `TaskCommentsViewerComponent` consumes it only after a
two-frame rendered boundary, then:

1. reveals the newest point in its owned comments scroller;
2. brings the composer into the nearest visible position;
3. leaves `document.activeElement` unchanged, so notification landing does not open the keyboard;
4. completes the matching request without clearing a newer or different intent.

The service returns the request so a future Batch 11 navigation owner can call
`conversationLanding.cancel(request)` if navigation fails. Batch 11 remains responsible for
validating destinations, carrying notification intent, navigation, and browser Back behavior.

The viewer also exposes `revealLatestMessagesAndComposer()` for an already-mounted host. Its legacy
`scrollDown()` entry point delegates to the same pending behavior.

## Readiness and cleanup

- Cached comments can paint immediately, but a pending landing waits for the subsequent fresh
  request.
- Starting another task load cancels the previous subscription and invalidates scheduled reveal
  frames.
- Destroying the viewer cancels requests, landing subscription, and animation frames.
- A failed fresh request clears the spinner but retains the landing intent for a later retry.
- Comment-added and task-status events are filtered to the active project/task definition.

## Boundary with other batches

- **Batch 05:** still owns outer page scrolling, sticky/header offsets, and the fixed-height dashboard
  shell. This slice changes no shell CSS.
- **Batch 11:** still owns notification models, secure route intent, the notification page/bell, and
  invoking or cancelling this hook. This slice changes no notification or routing source.

## Focused coverage

- A request made before the viewer exists remains pending until fresh history renders.
- Cached history cannot fulfil a latest-message notification landing.
- A same-route request reaches an already-mounted ready viewer.
- A cancelled/stale task request cannot reveal the next task.
- Landing reveals both the end marker and composer without changing focus.
- Request replacement, matching completion, live delivery, and cancellation are covered directly on
  the coordinator.
