# Batch 04 source evidence manifest

These user-supplied files are immutable pre-change observations. Absolute paths let later local tasks
reopen the exact source, while SHA-256 values detect accidental replacement. Screenshots and archive
entries are evidence only; implementation scope came from Batch 04 of the shared work pack.

| Observation | Source | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Sent PDF action is visually lost in the outgoing feedback bubble | `/Users/ryan/Downloads/ontrack-mobile-feedback 2/invisible-pdf-link.png` | 217881 | `b8f515d1d4e0136852424793a9c594040a00af9d837c716696757c9f7ab09e85` |
| Archive supplied for the remaining batches | `/Users/ryan/Downloads/screenshot-context.zip` | 7232793 | `e8e76051ea1a9e321cbf6dd82b377487eb19785b563ab6354c6ca6a0bec6d109` |
| Existing feedback PDF toolbar/modal is oversized and ambiguous | ZIP entry `screenshot-context/bad-pdf-view-ui-for-feedback-chat.png` | 189570 | `b7c12d9fdc3406c3c56fc44905b4ec7c70f3e8058c9b4a10422f02b92ac4748d` |
| Preview-disabled feedback PDF modal is mostly blank | ZIP entry `screenshot-context/turned-off-view-for-feedback-chat-pdf-ui-looks-bad.png` | 43664 | `a2c48aca6095451caf91fbba04b8dccea6f3195e2589d5ee1314d083849983ff` |

The two ZIP-entry hashes are over the uncompressed entry bytes. The full archive hash anchors the
container itself. No source file was modified or copied into the repository.

Observed before-state details:

- `invisible-pdf-link.png` shows a low-contrast blue PDF action inside an outgoing blue message.
- `bad-pdf-view-ui-for-feedback-chat.png` shows an unlabeled toggle, icon-only download, oversized
  search field/zoom controls, large unused width, and no obvious close action.
- `turned-off-view-for-feedback-chat-pdf-ui-looks-bad.png` shows the preview-off mode as a mostly blank
  oversized modal rather than a useful filename/action state.
