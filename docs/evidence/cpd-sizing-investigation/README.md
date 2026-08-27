# CPD sizing investigation evidence

Evidence captured: 2026-08-23

Docs-only replacement prepared: 2026-08-27

Report: [`docs/cpd-sizing-investigation.md`](../../cpd-sizing-investigation.md)

This folder contains the evidence for `CPD - Investigate sizing issue`. All visible unit codes, task names, dates, and statuses are synthetic. No production system, live account, student record, token, or secret was used.

## Source baselines

- 10.x CPD feature: `187902747adb3a851bd3294b97b2a9d4a6e8ca95`.
- Bootstrap removal and repository utility rescaling: `a8ba06c01cd47937249d5780face427143b7dac4`.
- CPD reintroduction on 11.x: `2c6d2786e9484c57436099d25281aa45fa89453c`.
- 11.x before the responsive adjustment: `b9386055`.
- CPD-Q04 responsive adjustment: `854f9ce9ba5f100b0425996c3f5d7e248faa6b32`.
- Investigation snapshot: `53f1c5532eefc75cadf7834748a5a85c2bc6b3e8`.
- Docs-only replacement base: `9962e7ea171a2bf6d7a12be50874fa5c7ee77e21`.

## Deterministic comparison set

The numbered JPG files were captured from `synthetic-cpd-comparison.html`. The local-only harness reconstructs the source-derived card, search, padding, gap, and root-font dimensions. It does not load the Angular application or make network requests.

| File | Evidence |
| --- | --- |
| `01-current-v11-1440x900.jpg` | Current 11.x, three cards, 1440 x 900. |
| `02-legacy-v10-feature-1440x900.jpg` | Legacy 10.x-root rendering, three cards, 1440 x 900. |
| `03-current-v11-640x800.jpg` | Current one-card containment threshold at 640 x 800. |
| `04-legacy-v10-feature-640x800.jpg` | Legacy one-card rendering at 640 x 800. |
| `05-current-v11-390x844-mobile-limitation.jpg` | Current phone-width overflow at 390 x 844. |
| `06-v11-before-sizing-fix-640x800.jpg` | 11.x immediately before CPD-Q04 at 640 x 800. |
| `07-current-v11-480x800.jpg` | Current one-card overflow at 480 x 800. |
| `08-legacy-v10-feature-480x800.jpg` | Legacy one-card fit at 480 x 800. |

Supporting files:

- `measurements.txt` records measured widths and overflow results.
- `source-comparison.txt` records the exact commits, utility classes, and rendered values.
- `synthetic-cpd-comparison.html` is the reproducible standalone harness.
- `verification.txt` records the passing repository checks.
- `SHA256SUMS` provides integrity checks for every evidence artifact.

Verify the evidence integrity from the repository root:

```sh
cd docs/evidence/cpd-sizing-investigation && shasum -a 256 -c SHA256SUMS
```

The harness images are deterministic layout reconstructions, not signed-in application screenshots. This limitation is intentional so the root-scale comparison is repeatable and privacy-safe. The exported raster dimensions may exclude browser chrome or scrollbar pixels, so `measurements.txt` is the authoritative record of the captured DOM client and scroll widths.

## CPD-Q04 application capture set

The `before-*.png` and `after-*.png` files preserve the application-level evidence supplied with [PR #34](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/34). They compare the 11.x state immediately before and after its local responsive adjustment at these viewport widths:

- 1440 x 900
- 1280 x 900
- 1024 x 900
- 768 x 900
- 390 x 900

These images show that CPD-Q04 changed the card from 544 px to 512 px, the search field from 256 px to 224 px, and the unit-scope selector from fixed width to fluid with a 256 px maximum. They do not represent the original 10.x 10 px root scale; use the numbered comparison set for that question.

## Reproduction

Serve this folder locally:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open one of these URLs and set the viewport to the size in the filename:

```text
http://127.0.0.1:8765/synthetic-cpd-comparison.html?mode=legacy
http://127.0.0.1:8765/synthetic-cpd-comparison.html?mode=pre-fix
http://127.0.0.1:8765/synthetic-cpd-comparison.html?mode=current
```
