# Final Home browser retest, 21 September 2026

The actual settled student and tutor Home views now have named teaching-period progress bars and fit the sampled 320px viewport. Native unit-link Enter navigation remains intact. All four Home default axe scans report zero violations; color-contrast cases marked incomplete still require manual review.

Only Home was scanned in this follow-up. Previous student-task, feedback and staff-inbox evidence remains in [earlier browser report](../after/REPORT.md); this follow-up does not imply those views were rerun on the Home patch.

## Source and runtime

- Frontend: `http://127.0.0.1:4314`.
- Captured base commit `788fac88be24626178d8b994193db7cbadf98704`, base tree `a82f5171ddf02206610c506224841155164d5644`.
- Captured `git diff HEAD -- src` SHA256: `ef5c569eb67534bfa70246c115563996098d04787642b7b4833357c232b5d0e5`. The coordinator confirmed that this frozen Home source became signed commit `3d61bd58cd587c240c163235629b9df63533ab28`, tree `b796910a5d8d9af01beef80c6d7e3959f04ad51d`, with no source change since the run. Production HTML/SCSS file hashes are preserved separately in `production-file-hashes.json`.
- Same synthetic API source `7722612ef019b03bd6b4fb9319b83c52b0dac902`, API port4310 through the frontend proxy, normal database authentication. No deploy checkout was executed.
- Chrome153.0.8010.48, reduced motion, desktop1280×900 and narrow320×900. Default local axe rules, no rule exclusions. Credentials were read in memory from the existing private synthetic fixture manifest.
- Both synthetic roles signed in normally. Only auth/token-refresh POSTs were permitted; other business writes were blocked. The final Home run and two geometry probes each recorded zero business-write attempts and zero page errors. All browser processes used for these checks exited.

## Results

| Actual role/view | Rendered progress name and value                                     | Axe violations | Document width                        |
| ---------------- | -------------------------------------------------------------------- | -------------- | ------------------------------------- |
| Student Home1280 | Teaching period progress for Synthetic Upload and Submission Lab;22% | 0              | 1280px                                |
| Student Home320  | Same name;22%                                                        | 0              | 320px                                 |
| Tutor Home1280   | Teaching period progress for Synthetic Upload and Submission Lab;22% | 0              | 1280px                                |
| Tutor Home320    | Same name;22%                                                        | 0              | 320px after responsive layout settled |

The two branches are real API-driven enrolled and teaching unit cards, not mocked fixtures. Both roles had one visible main and one banner at both viewport sizes.

At320, focused the native student unit `<a>` named `Synthetic Upload and Submission Lab` and pressed Enter: route became `/projects/1/dashboard`. The tutor unit `<a>` named `Synthetic Upload and Submission Lab - Tutor` similarly navigated to `/units/1/tasks/inbox`. Destination pages were not rescanned and no task was selected or changed.

## Resize timing and authoritative geometry

The initial tutor320 width measurement ran immediately after `setViewportSize` and reported332px while the subsequent screenshot already showed a fitting card. A bounded repeat waited two animation frames for responsive layout, rendered the screenshot, then measured the DOM. It confirmed:

- viewport/document width320px;
- narrow media query matched;
- unit-card slot, native link and card each288px wide, left16px, right304px;
- no visible element overflowed the right viewport edge. The only negative-left elements were standard1px CDK visually-hidden accessibility helpers.

Use `geometry-settled/overflow.json` and `geometry-settled/tutor-home-320.png` for this geometry. The original immediate measurement in `results.json` remains preserved as a **superseded harness timing observation**, not a remaining application defect. No source change occurred between those measurements.

## Evidence and limits

`results.json` records names, actual progress markup/value, focus and route assertions, landmarks, width observations and scan summaries. Four PNGs, AX snapshots, semantic snapshots and axe JSON files accompany it. All screenshots contain synthetic accounts only. The previous unnamed-bar and student Home overflow findings are resolved by this follow-up.

`final-results.json` combines the unchanged scan/navigation assertions with the authoritative settled tutor geometry and records the immutable commit. It preserves the earlier332px measurement as a superseded timing observation rather than silently rewriting raw evidence.

Authoritative selected assets:

- `REPORT.md`, `final-results.json`, `production-file-hashes.json`;
- `student-home-desktop.png`, `student-home-320.png`, `tutor-home-desktop.png`, `geometry-settled/tutor-home-320.png`;
- `student-home-desktop-axe.json`, `student-home-320-axe.json`, `tutor-home-desktop-axe.json`, `tutor-home-320-axe.json`;
- `geometry-settled/overflow.json` for actual settled narrow tutor geometry;
- `results.json` for original progress-name, keyboard/navigation and landmark assertions, interpreted with the explicit timing correction above.

These are read-only browser observations. They do not establish full WCAG conformance, native200/400% zoom, every responsive breakpoint, assistive-technology announcements, screen-reader journeys or business-mutation flows. Axe incomplete/manual-review color checks remain recorded. The out-of-scope local Demo preview contrast findings in the earlier report were not changed or rescanned.
