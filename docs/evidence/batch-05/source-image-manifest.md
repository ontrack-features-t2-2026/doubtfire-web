# Batch 05 source evidence manifest

These user-supplied files are immutable pre-change observations. Absolute paths let later local tasks
reopen the exact source, while SHA-256 values detect accidental replacement. Screenshots and the
archive are evidence only; implementation scope came from Batch 05 of the shared work pack.

| Observation                                                                      | Source                                                                                                            |   Bytes | SHA-256                                                            |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------: | ------------------------------------------------------------------ |
| Final task statuses are clipped below the phone workspace                        | `/Users/ryan/Downloads/ontrack-mobile-feedback 2/cant-see-bottom-of-task-statuses.png`                            |   88592 | `c21acb1dd6894d26a852c340e55c0d91d3c56e49fd2e39d6b149cbba2c72d362` |
| Task-status controls appear unreachable in the nested task workspace             | `/Users/ryan/Downloads/ontrack-mobile-feedback 2/cant-click-task-statuses.png`                                    |  102673 | `1b2b4dcf36f9aab0df3997fa0740889ca2c85ecf4e0032dfbe7bd0c2182ad940` |
| Task/portfolio submission text is partially hidden by the mobile layout          | `/Users/ryan/Downloads/ontrack-mobile-feedback 2/partially-hidden-text-in-task-portfolio-submission.png`          |  221327 | `b42e2e7479b252f746a7356be93d634f302492851624cd19710bfe1a47048c86` |
| Feedback composer sits against the device bottom with no clear safe-area reserve | `/Users/ryan/Downloads/ontrack-mobile-feedback 2/weirdly-close-text-box-to-bottom-of-screen-in-feedback-page.png` |   95094 | `7420e5edb64279996df049b96e56716f362b297a329a83d9f6895e11261cab95` |
| Signed-out OnTrack wordmark is monochrome and off-centre                         | `/Users/ryan/Downloads/ontrack-mobile-feedback 2/greyed-ontrack-logo-and-off-centre.png`                          |   52479 | `bfdd4acaba86f1b6e0d5980ee471201831f397f26d15656ca3bbe99dfcea4efd` |
| Archive supplied for the remaining batches                                       | `/Users/ryan/Downloads/screenshot-context.zip`                                                                    | 7232793 | `e8e76051ea1a9e321cbf6dd82b377487eb19785b563ab6354c6ca6a0bec6d109` |

No source image or archive was modified or copied into the repository.

Observed before-state details:

- The task/status screenshots show content cut off inside a fixed project panel rather than one
  continuous phone page.
- The submission screenshot shows that not every task subview can simply be flattened; document
  content must be distinguished from bounded feature viewers.
- The feedback screenshot shows the composer immediately above the system navigation region, without
  a shared bottom-safe-area contract.
- The signed-out screenshot shows the wrong monochrome treatment and horizontal alignment for the
  OnTrack wordmark.
