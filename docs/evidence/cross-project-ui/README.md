# Dashboard validation record

Validated on 21 September 2026. All projects, tasks and account information are
synthetic. Screenshots show the production Angular bundle with local HTTP
fixtures, not a production student account or a running backend.

## Automated checks

- Dashboard and global project-loading tests: **4 files, 100 tests passed**.
- Targeted TypeScript/template lint: passed with zero warnings.
- Production build on Node 22.23.2: passed. Existing dependency sourcemap,
  CSS selector and `eval` warnings remain visible in build output.
- Chrome 153.0.8010.48: **24 browser scenarios passed**, no page errors.
  [Machine-readable results](browser-results.json) record the measurements.
- Local merge simulations with web PR #251 (keyboard controls) and #264
  (comment unread count/coverage) completed without conflicts.

The browser run covered 320, 390, 640, 768, 1024 and 1440 CSS pixels in both
density modes. At every width the document matched the viewport width, all
three cards retained visible project links, and long names wrapped. The 640 px
case also covers the layout width of a 1280 px window at 200% reflow; it does
not claim a manual browser zoom or screen-reader test.

Keyboard checks opened/toggled the checkbox filter menu and returned focus to
its trigger. Feedback available/no feedback/unavailable filters produced 6/6/3
tasks, clearing restored 15, and a no-match search retained input focus. Active
refresh loading and failure retained the three cards and button focus; retry
recovered. An empty response rendered the explicit empty state. A previous-unit
request failure recovered to one previous project with focus on its retry button.

## Representative captures

- [320 px, comfortable](320-comfortable.png): essential mobile project summary,
  primary link and expanded task list.
- [390 px, compact](390-compact.png): reduced spacing with usable controls.
- [1440 px, comfortable](1440-comfortable.png): wrapping grid and long titles.
- [Failed refresh with existing data](stale-error.png): recovery instruction and
  preserved cards.

These are post-change captures. Browser checks use synthetic HTTP responses;
API access-control coverage is separately present in API PR #133. Human
screen-reader sign-off and institutional acceptance remain reviewer activities.

## Checkout combination

- Web: `codex/remaining-dashboard-20260920`, implementation at
  `d2b3e02439bd2957d81ae9b58936c1724b72fe1c`, based on `11.0.x`
  `283b493367681d1abab23e5fe7c633ba3a57e5c2`.
- API reference: `11.0.x` `d7f7a5b9c2d34ef279ac3a70bc58823def64005c`.
- Deploy reference: `11.0.x` `41e50d9db4d12c0792b353fddf1494b01ad197c0`.

API and deploy are compatibility references, not services exercised by this
browser run. No calendar integration, push service or real email was used.
