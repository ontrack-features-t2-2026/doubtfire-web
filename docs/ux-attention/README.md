# Task attention and notification choices

This change brings the most urgent student and teaching work onto the home page,
puts the next allowed action first on a task, and makes notification choices
independent of in-app history.

## Behaviour

- Student home shows unread task messages, returned work, changed dates and
  extensions, and approaching or passed effective deadlines across current
  units. Work waiting for tutor feedback/help is counted separately. Opening a
  date update marks that notification read; opening in a new tab does not.
- Teaching home shows waiting feedback, help requests, pending extensions and
  the longest wait in teaching days. The linked inbox uses the same tutor/all
  scope. The API still enforces assignment and observer restrictions.
- Task details start with the existing status, effective date and one next
  action. Submission, prerequisite and extension rules remain enforced by the
  existing task policy. Other valid actions remain available. The submission
  cutoff label explains what the date means, and upload processing uses plain
  language.
- Notification history has unread, unit, category and event filters, groups by
  day, and server paging. Mark all read applies to the whole inbox. Global
  deletion is hidden in a filtered view, uses a confirmation boundary, and
  preserves notifications arriving after that boundary.
- Task, feedback and portfolio email/push choices are independent. Task choices
  include extension, group and tutorial updates. In-app history remains.
  Unit Hub retains its existing overall switch and channel controls. All these
  settings expose Save and restore correctly through Discard.
- Student summary cadence is independent of event channels. Teaching summaries
  are opt-in, default off, and contain queue counts without student names.
- Calendar copy distinguishes a refreshing subscription from a one-time file.
  The provider controls refresh timing; OnTrack remains the source for recent
  changes.

## Release dependency

Release with the matching API changes and migration
`20261001000001_add_notification_channel_choices`. The web expects
`GET /api/notifications?paginated=true`, `GET /api/attention/staff`, and the new
channel/staff summary fields on the current-user profile. The old notification
array endpoint remains available for existing bell and reminder clients.

The API migration copies existing choices and preserves earlier digest opt-outs.
Apply it before the new API/worker/web images. See the API notification guide and
linked deploy PR for rollout, schedules and conservative rollback handling.

## Verification and remaining acceptance

Local verification on 1 October 2026: all 293 web test files / 2,603 tests passed,
including attention, action policy, keyboard focus, failure/retry, stale request
cancellation, settings persistence and accessibility regressions. Lint,
TypeScript/Angular checks, deployment configuration checks, the production build,
and PWA source/build checks passed.

The browser tool could not verify the local computer's security policy, so the
live browser walkthrough is **not completed**. Automated component tests are not
human usability or screen-reader evidence. Before release, check the following
with synthetic student, tutor and unit-chair accounts on the institution's
approved desktop and mobile browsers:

1. Review home attention; open feedback/date changes and confirm the task action
   and date. Check submitted work is not shown as overdue student work.
2. Submit permitted work, request an extension, and confirm changed dates agree
   across task details, email summaries and the refreshed calendar subscription.
3. Change each notification preference, save, reload, and check Discard restores
   unsaved edits. Confirm independent email/push choices and digest cadence.
4. Filter a multi-page notification history, move between pages with the
   keyboard, mark all read, and check focus and empty/error states.
5. Check tutor and chair counts against their inboxes, including submitted work
   above a student's current target grade and pending extensions. Confirm
   observers and unrelated staff cannot see those counts.
6. Opt into a teaching summary using a controlled test inbox, confirm its scope,
   then opt out. Check real delivery, SSO, screen readers, calendar provider
   refresh and physical-device push separately; these depend on institution
   configuration and are not proved by the local tests.
