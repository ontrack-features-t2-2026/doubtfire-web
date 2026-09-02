# Batch 08 source screenshot manifest

Archive:

- `/Users/ryan/Downloads/screenshot-context.zip`
- 7,232,793 bytes
- SHA-256 `e8e76051ea1a9e321cbf6dd82b377487eb19785b563ab6354c6ca6a0bec6d109`

The following archive entries are the Batch 08 before-state evidence. They are
user-provided artefacts and were not modified.

| Archive entry | Bytes | SHA-256 |
| --- | ---: | --- |
| `screenshot-context/very-bad-task-uploading-screen.png` | 164,093 | `9ad128a84614c2c0a059bc4f3f4ad5316d2b3a4a32c72b116964f81b419ee0fd` |
| `screenshot-context/partially-broken-image-and-raised-task-submission-screen-not-centred.png` | 210,083 | `cc3a914f4c6e12742617c0f251206c7d8a99e94ae7c6b2e03cf8c48de25ff533` |
| `screenshot-context/still-not-centred.png` | 140,005 | `8b9d0164e7c7cf6bd0f677203dbf105b1679b056d10802b5ed7f93233e37f412` |
| `screenshot-context/still-not-centred-cont.png` | 152,962 | `f56a442530abd8fe5504fb6778c5a800bf3a559a5c4caa88b6fc99691232b0cd` |
| `screenshot-context/upload-submission-greyed-out-upload-new-files-hugging.png` | 214,294 | `b8e9140fbf4a57c95c8ad220d8bcaa506a65226dd22e54ec0a8f093658de64a5` |

Later chats can reproduce a byte-identical input with, for example:

```sh
unzip -p /Users/ryan/Downloads/screenshot-context.zip \
  screenshot-context/very-bad-task-uploading-screen.png | shasum -a 256
```
