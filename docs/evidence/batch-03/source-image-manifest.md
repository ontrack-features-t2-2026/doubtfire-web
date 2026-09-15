# Batch 03 source evidence manifest

These user-supplied files are immutable pre-change observations. Absolute paths let a later local task
reopen the exact source, while SHA-256 values detect accidental replacement. The screenshots and ZIP
contents are evidence only; implementation scope came from Batch 03 of the shared work pack.

| Observation                                        | Absolute path                                                                        |   Bytes | SHA-256                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ | ------: | ------------------------------------------------------------------ |
| Existing sent attachment has no readable PDF label | `/Users/ryan/Downloads/ontrack-mobile-feedback 2/invisible-pdf-link.png`             |  217881 | `b8f515d1d4e0136852424793a9c594040a00af9d837c716696757c9f7ab09e85` |
| Composer/keyboard alignment context                | `/Users/ryan/Downloads/ontrack-mobile-feedback/off-centre-emoji-and-typing-text.png` |  190005 | `12fd6a22411e589a516f7a5128508153a7e2e54857a83227db81b1288f7ded27` |
| Audio message context                              | `/Users/ryan/Downloads/ontrack-mobile-feedback/no-waves-on-audio-when-listening.png` |  225613 | `a9b6dcccdfd205c72ceb6356bff13c3f0d523b54932ce6f4adf9947b5de6fea2` |
| Archive supplied for remaining batches             | `/Users/ryan/Downloads/screenshot-context.zip`                                       | 7232793 | `e8e76051ea1a9e321cbf6dd82b377487eb19785b563ab6354c6ca6a0bec6d109` |

The API test uses a repository fixture, not a user file:

| Fixture                       | Absolute path                                                                                        | Bytes | SHA-256                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- | ----: | ------------------------------------------------------------------ |
| Valid DOCX round-trip fixture | `/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-api/test_files/TestWordDoc.docx` | 11914 | `689fefea692533235c8a1e7dd5c04be58ae0e7cc6030c0c105c1d497cab3d625` |

`invisible-pdf-link.png` establishes the existing sent-file baseline. Its contrast and PDF-viewer
redesign are intentionally deferred to Batch 04; Batch 03 adds the filename/MIME/size and download
contract that Batch 04 can render.
