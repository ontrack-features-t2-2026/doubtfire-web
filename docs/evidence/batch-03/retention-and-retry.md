# Batch 03 retention and retry contract

## What survives

| State                           | Storage                           | Normal task navigation / picker return / 30-second background | Hard reload or OS process termination                                                  |
| ------------------------------- | --------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Typed text                      | user/task-scoped `sessionStorage` | Retained                                                      | May survive a same-tab reload/session restore, but not promised after tab/session loss |
| Reply target id                 | user/task-scoped `sessionStorage` | Retained and resolved when comments arrive                    | Same limitation as text                                                                |
| Stable text `client_request_id` | user/task-scoped `sessionStorage` | Retained for safe retry                                       | Same limitation as text                                                                |
| Selected `File` objects         | root service memory only          | Retained while the Angular process remains resident           | Not retained                                                                           |
| Unsent audio `Blob`             | root service memory only          | Retained while the Angular process remains resident           | Not retained                                                                           |
| Per-file retry/progress state   | root service memory only          | Retained while resident                                       | Not retained                                                                           |

This is deliberate least-persistence. Raw file/audio bytes are not copied to `localStorage`,
`sessionStorage`, IndexedDB, service-worker caches, or another durable browser store. Therefore the
implementation satisfies ordinary picker and foreground/background flows but **does not claim that a
staged file or recording survives genuine OS process termination**. Durable raw-blob recovery would
need an explicit product/privacy decision in a later batch.

## Isolation and clearing

The exact key contains the signed-in user id, unit id, project id, task-definition id, task id, and
conversation id. A draft is loaded only through that exact context. Switching A to B first saves A
using A's previous context, invalidates delayed callbacks, clears the visible composer, then loads B.

- successful complete send clears only the current context;
- explicit Discard clears only the current context, including text/reply-only drafts;
- logout/account change removes all `feedback_draft_v1` session keys and in-memory items for the prior
  user;
- picker cancellation is a no-op and preserves the current state;
- storage denial does not block the composer, but then only the live field/memory state exists.

## Idempotency and failure behavior

Every staged item receives a UUID-compatible `client_request_id` when staged. The final text receives
a separate stable id when its send begins. The API stores the id on `task_comments` with a unique
`user_id + task_id + client_request_id` index and returns the existing row when the same request is
seen again. The same id cannot deduplicate another user's or another task's request.

An attachment comment row and its file persistence run inside one database transaction. If conversion,
move, metadata save, or final file verification fails, the transaction rolls the row back and removes
any partial file. A failed request therefore does not leave an empty attachment comment. The composer
keeps typed text and the failed card; offline and timeout messages explicitly say the draft remains.

Successful attachments are not uploaded again when a later item fails. Text is posted once only after
all attachment cards have completed or been removed. If the response is lost after either an attachment
or text commit, retrying with the same id returns the original row rather than creating a duplicate.
