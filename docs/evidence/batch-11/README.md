# Batch 11 — notification centre, deep links, deletion, and mobile access

**Date:** 2026-08-31 (Australia/Melbourne)
**Web lane:** `/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-web`
**API lane:** `/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-api`
**Prerequisites consumed:** Batch 02 conversation landing and Batch 09 guarded demo registry

## Outcome

Notifications now expose their stable event as a distinct, readable type instead of presenting
every row as the same generic comment. The full page has visible **Mark all read** and **Delete
all** actions. Delete all is confirmation based and deletes only the current user's notifications
at or below the highest id visible when the user confirmed, so a notification arriving while the
dialog is open is retained.

A validated feedback notification now carries a one-shot route intent. Once the project has
resolved the public task abbreviation to its task-definition id, the dashboard calls Batch 02's
`ConversationLandingService`. The comments viewer waits for a fresh authoritative history response
and a rendered view before revealing the latest messages and composer. It never focuses the input
or opens the software keyboard, and Angular navigation is left in normal history so browser Back is
preserved.

The notification bell is now a direct mobile toolbar action with an exact accessible unread count
and a compact `99+` visual cap. The QR action was removed from the toolbar and remains available in
the avatar/profile menu. No live student record, production notification, demo registry row,
notification email job, or notification mailer was changed by this batch.

## Diagnosis and corrections

| Reported symptom                                                                   | Source-level cause                                                                              | Batch 11 correction                                                                                                                                                          |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Demo notifications looked like repeated comments                                   | The API exposed only the broad category to the client presentation; the event hook was not used | The notification entity maps `event` and one shared presentation helper maps supported events to stable labels, icons, and tones with a generic fallback                     |
| A feedback notification opened near the top of an already mounted thread           | Navigation knew only the URL; same-route clicks could scroll a stale client cache               | A one-shot route intent survives route resolution, converts the task abbreviation only after project data exists, and invokes the Batch 02 fresh-history/render landing hook |
| Mobile notifications were hidden in the account menu while QR occupied the toolbar | The header deliberately suppressed the bell below the `xs` breakpoint                           | The bell is always present; QR lives in the profile menu; the two right-edge controls have fixed phone sizing and the task label yields space                                |
| There was no safe bulk deletion                                                    | Only per-row deletion existed                                                                   | The full page confirms the affected count and sends a current-user, positive `through_id` boundary to one bulk API endpoint                                                  |
| Large unread counts could crowd the narrow header                                  | The raw count was always rendered in the badge                                                  | The visual badge caps at `99+` while the button's accessible name keeps the exact count                                                                                      |

## Event presentation and guarded demo contract

`notification-presentation.ts` uses the stable event hook and never parses private message text to
infer a type. It includes explicit presentation for new tasks, due-soon reminders, date changes,
feedback/discussion, marking and status changes, submissions, extensions, portfolios, groups, and
tutorials; an unknown event falls back first to the known category and then to a generic update.

Batch 09 remains the sole scenario authority. Its guarded `mobile-feedback-v1` fixture supplies the
seven supported walkthrough rows below only in the isolated all-features demo database:

| Event hook              | Visible type   | Read state |
| ----------------------- | -------------- | ---------- |
| `new_task_available`    | New task       | unread     |
| `task_due_soon`         | Due soon       | unread     |
| `task_due_date_changed` | Date changed   | unread     |
| `task_comment_created`  | New feedback   | unread     |
| `task_status_changed`   | Status changed | read       |
| `extension_assessed`    | Extension      | read       |
| `portfolio_received`    | Portfolio      | read       |

The feedback preview is deliberately `You have new feedback in OnTrack.` and contains no comment
body. Demo mode does not manufacture client-side notifications or alter live student data.

## Bulk deletion invariants

- The page takes the maximum notification id from the confirmed snapshot and includes the affected
  count in the Material confirmation dialog. Cancel performs no request.
- The server starts from `current_user.notifications` and applies `id <= through_id`; another
  account cannot be selected by the request.
- A positive boundary is required. The endpoint cannot be called as an unbounded delete.
- Rows newer than the boundary stay on screen and on the server. Known cache rows at or below the
  boundary are evicted only after success.
- Failure leaves rows and unread state unchanged. Success announces the deleted count; the final
  row reaches the focusable empty state, while a partial result moves focus to the replacement row.
- Mark all read remains a separate idempotent operation and re-synchronises the shared unread
  count. Page and dropdown pagination/cache cancellation behavior is unchanged and covered by the
  focused suite.

## Feedback route and privacy invariants

- The existing notification route allow-list still rejects absolute URLs, schemes, protocol-
  relative paths, control characters, queries, fragments, and unexpected route families.
- Only an exact allow-listed `/projects/:id/dashboard/:abbreviation/feedback` path creates a route
  intent. Unsafe and non-feedback destinations cannot create one.
- A later notification click supersedes the previous intent; refused or failed navigation cancels
  it; sign-out clears it before another account can authenticate.
- The route layer stores no feedback body and does not guess a task-definition id. The dashboard
  consumes the intent only after matching both the project id and resolved task abbreviation.
- An already-open conversation performs a fresh server read before answering the landing request.
  The render-boundary hook scrolls but never focuses the composer.

## Measured mobile header evidence

The in-app browser inspected the running local web at `http://127.0.0.1:4400/home` while the
existing session header was available. These are DOM geometry values, not estimates from a
screenshot:

| Viewport | Document scroll width | Bell bounds           | Profile right edge | Result                                           |
| -------: | --------------------: | --------------------- | -----------------: | ------------------------------------------------ |
|   320 px |                320 px | x 224–268, 44 × 44 px |             312 px | bell and profile visible; no horizontal overflow |
|   412 px |                412 px | x 316–360, 44 × 44 px |             404 px | bell and profile visible; no horizontal overflow |

After the session check completed the local app returned to sign-in, so no authenticated demo-row
screenshot is claimed here. The source now also gives the phone account trigger an explicit 44 px
height; the serialized demo gate below should capture the final authenticated visual state.

## Verification completed

```text
npm run typecheck
Result: passed

npx ng test --watch=false \
  --include='src/app/api/services/spec/notification.service.spec.ts' \
  --include='src/app/api/services/spec/notification-route.service.spec.ts' \
  --include='src/app/api/services/spec/notification-feedback-route-intent.service.spec.ts' \
  --include='src/app/api/services/spec/authentication.service.spec.ts' \
  --include='src/app/common/notifications/notification-presentation.spec.ts' \
  --include='src/app/common/notifications-page/notifications-page.component.spec.ts' \
  --include='src/app/common/header/notification-bell/notification-bell.component.spec.ts' \
  --include='src/app/common/header/header.component.spec.ts' \
  --include='src/app/projects/states/dashboard/project-dashboard/project-dashboard.mobile.spec.ts' \
  --include='src/app/tasks/task-comments-viewer/conversation-landing.service.spec.ts' \
  --include='src/app/tasks/task-comments-viewer/task-comments-viewer.component.spec.ts'
Result: 11 files, 176 tests passed

npx eslint <the 23 Batch 11 TypeScript, template, and focused spec files> --max-warnings 0
Result: passed

docker exec notifications-demo-api sh -lc \
  'cd /doubtfire && bundle exec rubocop app/api/notifications_api.rb test/api/notifications_api_test.rb'
Result: 2 files inspected, no offenses detected

git diff --check
Result: passed in the shared web tree and the two Batch 11 API files
```

The focused web suite covers event mapping and fallback, exact/unread badge behavior, list/error/
empty states, keyboard rows, page size and pagination, Mark all read consistency, confirmation and
Cancel, cutoff preservation, failure rollback, focus restoration, route allow-list rejection,
same-route and anonymous route intents, navigation cancellation, sign-out cleanup, abbreviation-to-
definition resolution, fresh-history waiting, render-boundary scrolling, and the no-focus rule.

## Serialized runtime/API gate still required

The database-backed API test was deliberately not run while other batches were writing the shared
API test database. Run it once the API lanes are serialized:

```text
docker exec notifications-demo-api sh -lc \
  'cd /doubtfire && RAILS_ENV=test bundle exec rails test test/api/notifications_api_test.rb'
```

Then prepare the guarded all-features scenario once, sign in as the documented synthetic
`demo_student`, and verify at 320 px, 412 px, desktop, and 200% zoom:

1. the seven event types above appear with 4 unread / 3 read and privacy-safe feedback copy;
2. Mark all read updates rows, page/dropdown state, bell, and count;
3. Delete all shows the count, Cancel is inert, confirmation reaches success/empty state, and a
   deliberately injected newer synthetic row survives the confirmed cutoff;
4. a feedback notification lands after the authoritative comment response with latest messages and
   composer visible, does not focus the field, and browser Back returns to Notifications;
5. the bell remains visible and usable at both phone widths, and QR opens from the profile menu.

Do not create those rows in a production or ordinary development database; use only Batch 09's
guarded scenario.

## Handover and reusable evidence

- Source screenshot provenance: `docs/evidence/batch-11/source-image-manifest.md`
- Batch 02 landing contract: `docs/evidence/batch-02/conversation-landing.md`
- Batch 09 registry authority: `docs/evidence/batch-09/README.md`
- Event presentation: `src/app/common/notifications/notification-presentation.ts`
- Bulk page behavior: `src/app/common/notifications-page/notifications-page.component.ts`
- Route intent: `src/app/api/services/notification-feedback-route-intent.service.ts`
- Route allow-list integration: `src/app/api/services/notification-route.service.ts`
- Landing adapter: `src/app/projects/states/dashboard/project-dashboard/project-dashboard.component.ts`
- Fresh-history consumer: `src/app/tasks/task-comments-viewer/task-comments-viewer.component.ts`
- API boundary: `doubtfire-api/app/api/notifications_api.rb`

Batch 12 can treat notification records, event presentation, route intent, and deletion as stable.
Batch 11 did not touch `notification_email_job.rb`, `notifications_mailer.rb`, or `api_root.rb`; the
verified additional-email lane remains isolated from this work.
