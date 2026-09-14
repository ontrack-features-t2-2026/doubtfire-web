# Batch 12 mail readiness and safe delivery record

## Read-only environment findings

On 2026-08-31 the running `notifications-demo-api` and `notifications-demo-sidekiq` containers both
reported:

```text
DF_SMTP_ADDRESS=mailpit
DF_SMTP_PORT=1025
DF_INSTITUTION_EMAIL_SENDER=noreply@doubtfire.local
```

The `notifications-demo-mailpit` container exposed only its local SMTP catcher behavior. Its
environment allowed unauthenticated local SMTP and retained messages, but contained no outbound
relay host, provider credentials, authorised external sender, or forwarding rule.

## Decision

The work-pack condition for a real delivery was not met. A worker was running, but its SMTP target
was a local catcher rather than an external provider. A message addressed like an internet mailbox
would remain in Mailpit, so doing that would neither test nor prove external delivery. No supplied
real address was used, committed, logged, or seeded.

Before one authorised external test can be run, operators must configure and verify all of:

1. an outbound SMTP/provider endpoint rather than `mailpit`;
2. its required authentication and TLS policy;
3. an authorised sender domain/address rather than the local `.local` sender;
4. a Sidekiq worker listening on `mailers`; and
5. provider delivery/event access sufficient to distinguish accepted, delivered, bounced, and
   rejected states.

Only then should exactly one non-sensitive, clearly labelled verification message be sent to one
authorised supplied recipient and its provider message/delivery id recorded. Do not repeat the
test merely because the UI is refreshed.

## Local Mailpit handoff performed

One non-external integration check was performed from a short-lived API container attached to both
the isolated Batch API test network and the local Mailpit network:

- recipient: reserved `example.test` domain (not a user or real mailbox);
- database: isolated test database;
- persistence: user and pending-address writes enclosed in a transaction and rolled back;
- SMTP target: `notifications-demo-mailpit:1025`;
- result: SMTP accepted; Mailpit metadata API confirmed the exact message was stored;
- Message-ID: `6a94a3af16a7a_109887455@16978d6d8b75.mail`;
- Mailpit internal id: `7YMk3ebqBBvF5d4KeNUVX3`;
- subject: `Verify your additional Doubtfire notification email`;
- stored size: 2202 bytes; and
- message body/token: not read, printed, or committed.

This proves only the application-to-catcher SMTP handoff and template construction. It is not an
external delivery result and requires no arrival confirmation from the user.
