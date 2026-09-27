# Batch 15 — integrated verification evidence index

**Date:** 2026-08-31 (Australia/Melbourne)
**Scope:** final merged verification plus contained integration-regression repairs

## Outcome

The current shared web/API/deploy trees have been traced against every one of the 43 original
screenshots and the written cross-cutting requirements. The primary handover is:

- [mobile-feedback-final-verification.md](../../mobile-feedback-final-verification.md) — status,
  evidence/test result, accessibility/security note, remaining owner and next step for each issue.

Supporting evidence:

- [verification-results.md](verification-results.md) — exact current-tree gates and honest
  production-build/database/browser boundaries.
- [source-image-manifest.md](source-image-manifest.md) — attached ZIP/original archive provenance,
  43 PNG hashes and the detected duplicate-content pair.
- [browser-results.md](browser-results.md) — isolated authenticated journey, width measurements,
  clean-origin/cache provenance, screenshot hashes and honest device boundaries.
- [browser/signed-out-320.png](browser/signed-out-320.png) — root integration owner's signed-out
  after capture, SHA-256
  `0deb9c91552c71d717cea34a42bc25d47df06c67c2145ccf7eaa55874e4e5bd6`.

## Current integrated result

- Web typecheck: pass.
- Full web lint: pass after ESLint mechanically reordered attributes/imports and applied Prettier
  wrapping to eight integration-point files. No feature behavior changed.
- Cross-batch web union: 44 files / 362 tests pass in the project's Node 22 container.
- Post-browser contained-fix set: 4 files / 23 tests pass; final typecheck and full lint pass.
- Development bundle: pass in 31.621 seconds.
- Production-optimised bundle: pass in the project Node 22 image after rerunnable containers were
  stopped and Node received a 6 GiB heap inside Docker's 7.75 GiB VM; 86.695 seconds, 11.03 MB
  initial bundle. Earlier host exit 134 and container exit 137 attempts are retained as superseded
  resource diagnostics.
- API changed-file Ruby 3 syntax: 47 files pass.
- Final isolated API gate: 157 runs / 6,010 assertions, 0 failures, 0 errors, 0 skips.
- Deploy demo launcher shell syntax: pass.
- `git diff --check`: pass in web, API and deploy.
- Signed-out geometry: root-owned measurements pass at 320, 360, 390, 412, landscape and desktop
  with no horizontal overflow.
- `all-features-demo` preparation passed its exact fixture verifier: 10 tasks, 60% submitted, 10%
  complete, three PPI-available units, one insufficient-cohort unit, seven notifications and Team
  Indigo at 3/4 capacity.
- Authenticated merged browser evidence passed at 390 px for Tasks/filtering, demo controls, PPI and
  privacy suppression, notifications/deep links, composer draft/dismissal, profile, planner/calendar,
  extension dialog, portfolio, tutorials and both Group Work states. The task shell also measured no
  horizontal overflow at 320/360/390/412, landscape and desktop.
- Batch 15 repaired three contained integration regressions found by that journey: an optional
  emoji ViewChild dereference, missing Additional-email render notification, and transient planner
  `NaN` height. The retested paths produced no new browser errors.

## Deliberately not claimed

- The production build passes, with its emitted component-budget, CommonJS and selector warnings
  preserved for normal release review rather than hidden.
- No external email delivery is claimed. Batch 12's only delivery evidence is a reserved
  `example.test` message accepted by the local Mailpit catcher; the configured environment has no
  outbound relay.
- Engagement Passport remains investigation/governance work, and ordinary Group Work data remains a
  unit configuration/data responsibility.
- True 200% browser zoom, real Android/iOS audio/keyboard/resume, installed-PWA eviction, real
  PDF/TeX conversion and slow/failed browser uploads remain device or production-environment gates.

## Handover

Use the status matrix and browser/API result ledgers as the final SIT764 evidence appendix. Keep the
remaining device/external-service boundaries explicit rather than converting them into inferred
passes.
