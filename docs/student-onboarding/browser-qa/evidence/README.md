# Synthetic browser and compatibility evidence

Recorded 21 September 2026 (Australia/Melbourne) against production tutorial
`0ff843477300c7848003c6612f534f75c5727e7f`. The [fixture](../README.md) compiles the
actual tutorial shell and service with real application global styles, fonts,
theme marker and Angular Router. Account, history and surrounding page controls
are synthetic. No real student or assessment data was used.

| Browser / engine | Recorded version | Result |
| --- | --- | --- |
| Chrome | 153.0.8010.48 | 15 named checks passed |
| Microsoft Edge | 153.0.4234.32 | 15 named checks passed |
| Firefox | 155.0 | 15 named checks passed |
| WebKit | 26.6 | 15 named checks passed |

[results.json](results.json) contains the individual checks. They cover the profile
boundary and empty history, modal Tab wrap, page controls/browser Back, Escape,
four steps/completion, minimal persistence, replay, narrow scrolling, CSS zoom,
role/flag/history/storage failures, missing targets, resume/skip/dismissal and dark
theme. Page errors from every context are also asserted empty. These are
Playwright browser assertions, not a human participant study.

The final evidence combines complete Chrome/Edge runs with a bounded
Firefox/WebKit rerun after correcting the fixture's keyboard handling. Firefox's
runtime uses disposable app-data directories. Narrow wrapped links are reached by
Tab (Option+Tab under WebKit's macOS default), then keyboard End. The check waits
for scrolling to finish and verifies the entire link rectangle lies within the
panel and viewport. No production CSS was changed for browser automation.

## Representative screenshots

- [Light welcome, 1280 × 900](chrome-welcome.png)
- [Dark welcome, 1280 × 900](chrome-dark-welcome.png)
- [Guided step, 320 × 568](chrome-320px.png), at the initial scroll position; the
  panel scrolls to expose the full written-guide link.
- [No units / missing control, 390 × 844](chrome-missing.png)
- [200% CSS zoom, 1280 × 900](chrome-css-zoom-200.png)

The `*-welcome-aria.txt` and `*-step-aria.txt` files preserve two accessibility-tree
snapshots for each recorded engine. They establish exposed roles/names and content;
they do not establish human screen-reader usability.

## Limits and combined validation

These checks do not cover the full application header/profile form, actual API
authorization, institution browser policy, real enrolled projects, native Safari,
actual browser 200% zoom, human assistive technology, pilot participants or reviewer
approval. WebKit is an engine run. CSS zoom is explicitly a synthetic layout check.
Those remaining activities are tracked in [validation.md](../../validation.md).

[combined-validation.json](combined-validation.json) records the exact tutorial
and migration heads for a temporary local compatibility tree: all 1,158 tests in
151 files and its production build passed. That tree was never pushed or merged
on GitHub; reviewers still control merge decisions.
