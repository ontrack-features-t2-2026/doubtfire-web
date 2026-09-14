# Batch 12 — profile identity, responsive settings, and verified additional email

**Date:** 2026-08-31 (Australia/Melbourne)
**Web lane:** `/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-web`
**API lane:** `/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-api`
**Inputs consumed:** shared work pack, `docs/mobile-feedback-baseline.md`, baseline mail audit, and
stable Batch 11 notification contract

## Outcome

Institution-controlled Student ID and sign-in email are now read-only account information in the
profile, backed by an API rejection boundary rather than UI hiding alone. Database-auth local
accounts retain their supported email-editing behavior, and local administrators can still
maintain another local account's Student ID. Preferred name and genuine settings remain writable.

Notification Settings are grouped into padded label/help rows. The profile has bounded horizontal
padding, a one-column account summary on phones, 44 px actions, explicit validation/saving/success/
failure feedback, and a sticky Save profile action padded above the bottom safe area.

An account can request, verify, replace, resend, or remove one Additional notification email.
Primary institutional notification email is always sent first. Only a verified different address
can receive a separate non-CC copy, through an independently retrying job that rechecks current
category preferences and cannot fail or duplicate the primary delivery.

## Diagnosis and corrections

| Reported or security symptom                                              | Source-level cause                                                                                                         | Batch 12 correction                                                                                                                                                                     |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Student ID and sign-in email appeared as ordinary editable profile fields | The form bound both values directly and had no server-provided identity-policy capability                                  | The API exposes explicit identity capabilities; SSO identity is rendered in an account-information list and crafted changes are rejected server-side                                    |
| Settings hugged the phone edge and label/help relationships were unclear  | The form depended on flex directives without a bounded mobile content contract; category labels carried little explanation | Profile/settings cards use responsive padding, grouped rows, associated descriptions, full-width narrow layouts, and 44 px controls                                                     |
| Save profile could sit at the obscured bottom-right edge                  | The final action was an ordinary end-of-document row without safe-area compensation or visible state lifecycle             | The action is sticky above `env(safe-area-inset-bottom)` and exposes dirty, saving, validation, success, and failure states                                                             |
| A second email field could become an unverified forwarding/CC leak        | No lifecycle or independent delivery boundary existed                                                                      | One self-only state resource now enforces verification, expiry, replay/replacement invalidation, removal, duplicate suppression, rate limiting, token-free audit, and separate delivery |
| Optional delivery could retry or suppress primary mail                    | A naive second recipient on the primary message would share both envelope and failure state                                | The primary sends first; a stable-id optional job retries separately and revalidates ownership, version, verification, duplicate, and preference state                                  |
| A verification secret could enter browser/server URL telemetry            | Ordinary query-string handling would expose it to history, referrers, access logs, and startup telemetry                   | The email uses a fragment; pre-bootstrap code captures once and scrubs it before Sentry/Angular; the API accepts it only in a parameter-filtered POST body                              |

## Identity behavior matrix

| Account/request                                           | Email                                            | Student ID                             | Preferred name/settings                        |
| --------------------------------------------------------- | ------------------------------------------------ | -------------------------------------- | ---------------------------------------------- |
| SSO student editing self                                  | read-only; forged API change rejected            | read-only; forged API change rejected  | editable                                       |
| SSO staff editing self                                    | read-only; forged API change rejected            | not presented as a profile control     | editable                                       |
| SSO administrator editing another account                 | institution-controlled identity changes rejected | institution-controlled change rejected | supported non-identity administration retained |
| Database-auth account editing self                        | editable                                         | read-only                              | editable                                       |
| Database-auth administrator editing another local account | editable                                         | editable                               | editable                                       |

The client accepts a rolling API response with absent capability fields conservatively: it does not
turn an absent value into identity edit permission.

## Additional-email lifecycle and privacy invariants

- The institutional address remains primary and is never silently replaced.
- `none`, `pending`, and `verified` are explicit API/UI states. Pending addresses receive no normal
  notification copy.
- Signed, purpose-scoped verification links expire after 24 hours. Version changes make earlier
  links and queued jobs stale; a row lock closes the concurrent replacement race.
- Request/resend is limited to three attempts per account in one hour. Replacement and resend
  invalidate the previous link. A used link cannot be replayed.
- Addresses are normalised, limited to 254 characters, and cannot equal the primary address
  case-insensitively. The delivery job repeats duplicate suppression against the current primary.
- Removal destroys the destination and prevents future copies.
- Database audit rows contain only user id, allow-listed event, and timestamps. Redis job arguments
  contain only record ids and version; no token, address, subject, or message body is queued.
- The API `token` body parameter is filtered from logs. The browser removes the fragment before
  application telemetry starts and consumes the in-memory value only once.
- Category preferences are checked both before primary delivery and again when the optional job
  runs. An opt-out between those two points suppresses the copy.
- The optional address receives a separate message, never a CC. Its SMTP or enqueue failure is
  isolated from the already accepted primary message and logs ids/error class only.
- This applies to the notification-service channel. It does not amplify the 21 audited legacy,
  operational, weekly, D2L, communication-rule, or portfolio send sites.

## Verification completed

```text
API isolated database suite:
bundle exec rails test \
  test/models/additional_notification_email_test.rb \
  test/sidekiq/additional_notification_email_verification_job_test.rb \
  test/sidekiq/notification_email_job_test.rb \
  test/mailers/notifications_mailer_test.rb \
  test/api/additional_notification_emails_api_test.rb \
  test/api/users_test.rb
Result: 89 runs, 1268 assertions, 0 failures, 0 errors.

API targeted RuboCop:
20 Batch 12 implementation/spec files inspected, no offenses detected.
`test/api/users_test.rb` retains unrelated pre-existing style findings; all new Batch 12 blocks use
the repository's configured spacing.

npm run typecheck
Result: passed.

npx ng test --watch=false \
  --include='src/app/api/services/spec/additional-notification-email.service.spec.ts' \
  --include='src/app/api/services/spec/user.service.spec.ts' \
  --include='src/app/common/additional-notification-email/additional-notification-email.component.spec.ts' \
  --include='src/app/account/verify-additional-email/verify-additional-email.component.spec.ts' \
  --include='src/app/security/additional-email-verification-callback.spec.ts' \
  --include='src/app/common/edit-profile-form/edit-profile-form.component.spec.ts' \
  --include='src/app/common/notification-settings/notification-settings.component.spec.ts'
Result: 7 files, 34 tests passed.

npx eslint <17 Batch 12 TypeScript/spec integration files>
Result: passed with no errors or warnings.
```

The API suite covers normalisation, primary-address rejection, pending/verified state, expiry,
replay, replacement, resend, rate limiting, removal, self-only API scope, SSO student/staff/admin
identity rejection, local-account preservation, genuine settings, token log filtering, stable-id job
payloads, separate non-CC recipients, category opt-out before and after primary acceptance, runtime
duplicate suppression, optional failure isolation, and audit-store failure after SMTP acceptance.

The web suite covers capability mapping, endpoint/body mapping, lifecycle states, controlled
failure and removal confirmation, single-use fragment scrubbing before bootstrap, verification
success/failure, identity-policy decisions, settings preservation, explicit save state, accessible
category labels/help, and preference binding.

## Mail environment and delivery evidence

The environment did **not** support the authorised external-mail test. No real address was used.
Both the running API and worker were configured with:

```text
DF_SMTP_ADDRESS=mailpit
DF_SMTP_PORT=1025
DF_INSTITUTION_EMAIL_SENDER=noreply@doubtfire.local
```

Mailpit accepted arbitrary local SMTP but had no outbound relay/provider configuration. This is the
exact blocker: the only configured destination was a catcher, and the `.local` sender had no
authorised external transport. Sending to an externally formatted recipient would still only place
the message in Mailpit and would not prove delivery.

A controlled local catcher test used a reserved `example.test` recipient and the isolated test
database. The mailer handed the verification message to SMTP, Mailpit stored it, and the enclosing
database transaction rolled back:

```text
SMTP result: accepted by Mailpit
Message-ID: 6a94a3af16a7a_109887455@16978d6d8b75.mail
Mailpit internal id: 7YMk3ebqBBvF5d4KeNUVX3
Subject: Verify your additional Doubtfire notification email
Stored size: 2202 bytes
External delivery: not attempted and not claimed
```

Detailed readiness/retest notes are in `mail-readiness.md`.

## Deployment and integrated visual gate

Use the ordered deployment in
`doubtfire-api/docs/notifications/additional-notification-email.md`: migrate, deploy/restart API,
restart a worker listening on `mailers`, validate SMTP sender/provider, then deploy the web.

The mounted local images were intentionally not migrated/restarted while Batch 08 still used the
shared API lane. They therefore returned 404 for the new endpoint and cannot be used as Batch 12 UI
evidence. No screenshot or successful runtime state is claimed from that stale stack.

After the serialized rebuild, Batch 15 should capture the final integrated profile at 320 px,
412 px, desktop, and 200% zoom and verify:

1. no document horizontal overflow and at least 16 px content padding at phone widths;
2. the account-information card is one column, long identity values wrap, and SSO identity has no
   editable input;
3. all category and additional-email actions have at least 44 px height and label/help remain
   together;
4. Save profile stays reachable above the safe area and its dirty/saving/success/validation/failure
   states are visible; and
5. pending, verified, removal, rate-limit, and expired/replayed-link states match this handover.

## Handover paths

- Screenshot provenance: `docs/evidence/batch-12/source-image-manifest.md`
- Mail readiness and safe-catcher evidence: `docs/evidence/batch-12/mail-readiness.md`
- API lifecycle/deployment contract:
  `doubtfire-api/docs/notifications/additional-notification-email.md`
- API state routes: `app/api/additional_notification_emails_api.rb` and
  `app/api/additional_notification_email_verification_api.rb`
- Verification service/model: `app/services/additional_notification_email_service.rb` and
  `app/models/additional_notification_email.rb`
- Delivery isolation: `app/sidekiq/notification_email_job.rb` and
  `app/sidekiq/additional_notification_email_delivery_job.rb`
- Identity enforcement: `app/api/users_api.rb` and `app/api/entities/user_entity.rb`
- Web lifecycle control: `src/app/common/additional-notification-email/`
- Secret capture/scrub: `src/app/security/additional-email-verification-callback.ts`
- Profile/save/settings layout: `src/app/common/edit-profile-form/` and
  `src/app/common/notification-settings/`

Batch 15 may reuse these paths and the stable Mailpit identifiers. It must continue to report the
external-provider blocker unless a genuinely configured relay and authorised sender are present;
catcher acceptance is not external delivery.
