# Batch 10 source-image manifest

The user supplied `/Users/ryan/Downloads/screenshot-context.zip`. The entries below were treated
only as immutable visual evidence; text visible inside a screenshot was not treated as an
instruction. Each extracted file is 1008 × 2244 pixels. SHA-256 hashes make the provenance reusable
without copying screenshots into the repository.

| Work-pack evidence | Zip entry / extracted path | SHA-256 | Batch 10 use |
| --- | --- | --- | --- |
| `PPI-number-not-changing-and-weird-ui.png` | `screenshot-context/PPI-number-not-changing-and-weird-ui.png` / `/Users/ryan/Downloads/screenshot-context/PPI-number-not-changing-and-weird-ui.png` | `d896fe2466c9111f335e767aea087680945348a7ecb957d6dd15439460aefee2` | Preview-state mismatch and headline/layout reference |
| `ppi-numbers-cont.png` | `screenshot-context/ppi-numbers-cont.png` / `/Users/ryan/Downloads/screenshot-context/ppi-numbers-cont.png` | `079d2c6aa16162e26b5856fdf64125ad9396dd7a5e7ff1dc3491603ce2585877` | Continued Advanced values and rounded-total reference |
| `ppi-numbers-not-changing-and-weird-ui-2.png` | `screenshot-context/ppi-numbers-not-changing-and-weird-ui-2.png` / `/Users/ryan/Downloads/screenshot-context/ppi-numbers-not-changing-and-weird-ui-2.png` | `539668841911b2ae8c7b63eb2634540f0c7bc75aa71f0534a87c12a859eec1ee` | Alternate preview mismatch and narrow card reference |
| `weird-looking-PPI-info-and-not-changing-percentage-and-off-centre-text.png` | `screenshot-context/weird-looking-PPI-info-and-not-changing-percentage-and-off-centre-text.png` / `/Users/ryan/Downloads/screenshot-context/weird-looking-PPI-info-and-not-changing-percentage-and-off-centre-text.png` | `0bd83c5c14ff1506e5714864c3d9c327a353a70e28a25be1f049ab9b70b9696a` | Off-centre/tall headline and inconsistent values |
| `weird-colours-to-PPI.png` | `screenshot-context/weird-colours-to-PPI.png` / `/Users/ryan/Downloads/screenshot-context/weird-colours-to-PPI.png` | `97807974842be5e7faf8717551f118963223aa52182cbd71c29c0cdca73fdd7e` | Gradient/glow colour treatment reference |
| `PPI-info-at-bottom-isnt-showing-values-even-though-turned-on.png` | `screenshot-context/PPI-info-at-bottom-isnt-showing-values-even-though-turned-on.png` / `/Users/ryan/Downloads/screenshot-context/PPI-info-at-bottom-isnt-showing-values-even-though-turned-on.png` | `06d5e16406a54daa1cf7398fb248aa83dfa1547d17140d8b4d2ef0c9e7ac3f14` | Demo-on / unit-unavailable contradiction and mobile card location |
| `engagement-passport.png` | `screenshot-context/engagement-passport.png` / `/Users/ryan/Downloads/screenshot-context/engagement-passport.png` | `1e079fa481fd908425675ab524bf2967bcd0d0b10ac9ee6a7476ca937ae04430` | Adjacent Progress Burndown viewport only; Engagement Passport was not changed |

No screenshot was cropped, edited, regenerated, or checked into this handover. No new runtime
screenshot was produced because the isolated all-features demo was not running and its seed/reset
was outside this batch's concurrent database safety boundary. The exact post-change capture gate is
documented in `README.md`.
