# Accessibility browser fixes and verification — 21 September 2026

[PR #277](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/277) fixes the additional defects found while checking actual synthetic student and tutor pages. The final code commit is [`3d61bd58cd587c240c163235629b9df63533ab28`](https://github.com/ontrack-features-t2-2026/doubtfire-web/commit/3d61bd58cd587c240c163235629b9df63533ab28), tree `b796910a5d8d9af01beef80c6d7e3959f04ad51d`. This report supplies bounded browser and automated evidence; full human A03/A04 audits, journey acceptance and independent validation remain pending in the [closure guide](../../CLOSURE.md).

## Source stages and findings

| Stage                     | Actual source                                                                               | Evidence and outcome                                                                                                                                                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Before browser fixes      | `94068e0758954791e074f723602cd44792a3684b`                                                  | [Raw observations](before/results.json), [student task axe](before/student-task-desktop-axe.json), [staff inbox axe](before/staff-inbox-desktop-axe.json). Found unnamed Home link, missing application landmarks, invalid outcome-chip parent roles, low-contrast enabled task tabs, missing staff display names and empty assessment readouts. |
| First fix and retest      | `788fac88be24626178d8b994193db7cbadf98704`, tree `a82f5171ddf02206610c506224841155164d5644` | [Detailed report](after/REPORT.md), [settled observations](after/settled/results.json). Corrected the above findings. Settled Home then revealed an unnamed teaching-period progress bar and 11px overflow at 320px.                                                                                                                             |
| Final Home fix and retest | `3d61bd58cd587c240c163235629b9df63533ab28`                                                  | [Home report](home-final/REPORT.md), [final results](home-final/final-results.json), [production file hashes](home-final/production-file-hashes.json). Both real enrolled and teaching card branches have unit-specific progress names and fit 320px; native unit-link Enter navigation still works.                                             |

The first after run and the final Home run exercised frozen source before its commit was published. The reports retain the original base and source-diff hashes and map them to the identical committed tree. The settled staff repeat directly records `788fac88` with an empty source diff. Student/staff task pages were not rescanned after the Home-only change; their results retain their own source attribution.

## Actual browser results

Chrome 153.0.8010.48, headless, 1280×900 and 320×900 CSS-pixel viewports, existing dark account theme and reduced-motion media setting. Default axe rules included actual-browser contrast checks; no rules were excluded. This is viewport emulation, not native browser zoom or a physical-device test.

| Settled state                          | Default axe violations | Other bounded observations                                                                                           |
| -------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Sign-in at both widths                 | 0 / 0                  | One main; banner hidden with header.                                                                                 |
| Student task at both widths            | 0 / 0                  | Native task Enter navigation; one main/banner; valid static outcome list semantics.                                  |
| Student feedback at 320px              | 0                      | Loaded feedback and named comment field; no comment sent.                                                            |
| Staff inbox at both widths             | 0 / 0                  | Four actual rows with student names; empty search and restore; no blank progress/grade/heading in unselected footer. |
| Student Home at both widths, final fix | 0 / 0                  | Teaching-period progress name and value; document width 1280/320; native unit Enter route.                           |
| Tutor Home at both widths, final fix   | 0 / 0                  | Same semantics; settled document width 1280/320; native unit Enter route.                                            |
| Unit Hub desktop                       | 0                      | Single application main; route remains a labelled section.                                                           |

The final Home names describe **time through the teaching period**, not student or class completion. Both fixtures showed 22%. At 320px each card, containing link and slot is 288px wide at x=16…304. [Settled tutor geometry](home-final/geometry-settled/overflow.json) and [screenshot](home-final/geometry-settled/tutor-home-320.png) confirm the layout.

All three sampled task tabs were enabled (`aria-disabled=false`, opacity 1). On the actual `#171b21` background, active text `#818cf8` measures **5.79:1** and inactive enabled text `#99a2b0` **6.71:1**. These use existing theme tokens. Disabled opacity is preserved and separately covered by rendered tests; no disabled exception was used to excuse the observed enabled states. [Computed state and ancestor styles](after/student-task-desktop-semantics.json) and [axe result](after/student-task-desktop-axe.json) are preserved.

## Automated validation

Final code `3d61bd58` was checked locally with Node **22.23.2**, matching the CI Node 22 major. The existing installed dependency tree was reused; this is not a claim of a new clean install for this final run.

| Command                                            | Result                                                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm run test:ci`                                  | **1,347 tests passed in 179 files**                                                                              |
| `npm run test:a11y`                                | **41 tests passed in 13 files**                                                                                  |
| `npm run lint`                                     | Pass, configured maximum warnings 0                                                                              |
| `npm run typecheck`                                | Pass                                                                                                             |
| `npm run build -- --configuration production`      | Pass                                                                                                             |
| `npm run verify:deployment-config`                 | Pass                                                                                                             |
| Theme compiled-style suite on preceding `788fac88` | **18 tests passed**, including both existing palettes; Home-only follow-up does not modify those tab/theme files |

[Sanitised verification outputs](verification/) preserve the results. Existing build output includes Sass/bundle/CommonJS/selector warnings; test output includes jsdom CSS-parser warnings despite successful assertions. An earlier full run on local Node 26 failed six existing PDF/composer storage tests because `localStorage` was unavailable in that runtime; the same `788fac88` source passed all 1,346 tests on Node 22 before the final Home test brought the total to 1,347. No unrelated storage workaround was introduced. Current GitHub checks remain available on [PR #277](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/277).

[Read-only merge simulations](merge-check.json) were clean against the recorded `11.0.x` and nine other open PR heads. These detect textual conflicts at those exact commits; they do not prove future integration behavior. No PR was merged. Review order: #250 → #251 → #252 → #253 → #265 → #267 → #268 → #272 → **#277** → #270.

## Runtime, privacy and evidence limits

The frontend on local port 4314 proxied `/api` to the existing synthetic API on 4310. API source: `7722612ef019b03bd6b4fb9319b83c52b0dac902`; image `sha256:6bdb910b42135ceca88e4d1adf94e3050f4ebb759bdccb3080b6a0e80ba8fb60`; Rails test configuration, database authentication, test mail, external TII/D2L integrations disabled. No deployment-repository checkout was executed. Synthetic student/tutor accounts and unit SYN101 supplied actual API data. Passwords, access tokens and cookies are not published.

Normal sign-in/token-refresh requests were permitted; other non-read API requests were blocked. Completed after runs recorded zero business-write attempts and zero page errors. This preserves fixtures but leaves actual uploads, retries, replies, grading and moderation acceptance unrun. Use the [fixture preparation and test procedures](../../CLOSURE.md#runtime-and-fixture-preparation) for those steps on an isolated synthetic fixture.

Axe incomplete results remain in the JSON, including contrast and custom-host attribute cases requiring inspection. Zero violations is not zero incomplete findings or full accessibility conformance. No screen-reader speech, native 200/400% zoom, physical-device/PWA acceptance, complete dialog focus-return set, independent user study or leadership approval is claimed. Some narrow tab labels require the tab-strip scrolling/pagination interaction, which was not completely exercised.

The local Demo controls preview has six pre-existing contrast nodes: safety text/code `#52525b` on `#1f2530` (about 1.98:1), and mock notification text `#e6e8ec` on white (about 1.22:1). [Exact selectors and HTML](after/demo-controls-desktop-axe.json) are retained. This preview was sampled because its landmark container changed. It is outside the agreed critical student/staff journey fix, with a candidate Theme/Demo owner and no approved disposition; it remains in the [known-limitations register](../../REMEDIATION.md#known-limitations-and-future-validation).

## Interpreting the raw records

Before-fix staff 320px observations contained a loading skeleton and are not settled pass evidence. Initial after-fix Home captures also caught a splash overlay, and an initial staff readiness locator was ambiguous. Those local harness attempts are not counted in the table above; use `after/settled/` for Home and staff. Raw aggregate records preserve their history, while unready screenshots are intentionally omitted from the published selection.

The first final-Home tutor width read happened before responsive layout settled and returned 332px. Without any source edit, a repeat waited two animation frames and confirmed 320px. The original value remains in [raw results](home-final/results.json); [derived final results](home-final/final-results.json) explicitly identify the superseded observation and authoritative geometry rather than silently altering it.

Screenshots and DOM/accessibility snapshots contain synthetic data. Published evidence excludes private credential manifests, local authentication helpers and machine-specific browser harnesses. The [asset manifest](asset-manifest.json) records SHA-256 hashes; raw axe/semantic/result JSON is unchanged from the captured selection. Reports and verification logs are separately labelled narrative or sanitised output.
