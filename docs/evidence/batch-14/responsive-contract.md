# Batch 14 responsive contract

This is a factual source-to-code trace, not a replacement for the final authenticated device capture.

| Reported source                                          | Before evidence                                                                                     | Contained after contract                                                                                                                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `partially-hidden-text-in-task-portfolio-submission.png` | Learning Summary Report validation occupies the same bottom area as Back/Next, so text is obscured. | Validation is a separate `role="alert"` before the action row; actions cannot overlay it; the footer includes bottom safe-area padding.                                             |
| `clipped-image-in-portfolio-submission.png`              | Submitted tick/message are laid out off-centre and clip inside the narrow content region.           | The status is a single centred column; its icon has an explicit 4rem box; heading and source text wrap; upload-again remains in-flow.                                               |
| `very-bad-tutorials-ui.png`                              | The eight-column desktop table is squeezed into phone width, making cells and actions unreadable.   | Below 640px, one card per real tutorial exposes all eight table concepts in a two-column definition list plus a 44px action. At desktop width the sortable table remains unchanged. |
| `no-group-work-when-should-be.png`                       | A generic empty message cannot distinguish missing configuration from configured-but-empty data.    | The presentation uses `Unit.hasGroupwork()` and the selected real `GroupSet.groups`; it reports `not-configured`, `configured-empty`, or renders the real group manager.            |

## Width budget

At the smallest requested width of 320px:

- Portfolio mobile navigation uses two 44px controls, two 8px gaps, and at least 16px horizontal
  padding. The `minmax(0, 1fr)` centre therefore retains 200px and permits wrapping.
- Tutorial and student Group Work cards use fluid width with `min-width: 0`. Their two detail columns
  cannot force the card wider than its container because every grid track is `minmax(0, 1fr)` and
  values use `overflow-wrap: anywhere`.
- File selections use a `minmax(0, 1fr)` filename track plus a 48px remove control. On phones the row
  can stack instead of extending beyond the viewport.

The same layout rules are continuous through 360px, 390px, and 412px; there are no fixed 1000px table
or content widths in the phone presentation.

## Data and interaction invariants

- Portfolio next/previous controls call the same guarded state transition as desktop tab selection.
- Tutorial cards and table rows call the same `switchToTutorial` model operation.
- Group cards render `Group`, `GroupSet`, `Tutorial`, and `Project` values already authorised in the
  entity caches. Join/leave still use existing model/service methods.
- Demo mode may label a matching group as synthetic; it may not supply the group data rendered by the
  feature component.
