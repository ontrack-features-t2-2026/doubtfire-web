# Batch 03 task-comment attachment API contract

## Rollout prerequisite

Run `20260831000001_add_attachment_metadata_to_task_comments` before serving the Batch 03 web bundle.
It adds nullable attachment metadata and `client_request_id` to `task_comments`, plus the unique index
`idx_task_comments_user_task_client_request` on `(user_id, task_id, client_request_id)`. Existing rows
remain valid and can use the legacy filename/MIME/size fallbacks.

No deploy-repository change is required, but deployment order matters: migrate API, roll out API, then
roll out web. Rolling back the API code must precede removing the columns/index.

## Create

`POST /projects/:project_id/task_def_id/:task_definition_id/comments` accepts:

- `comment`: optional text;
- `attachment`: optional multipart file;
- `reply_to_id`: optional task-comment id;
- `client_request_id`: optional 1–64 character hexadecimal/hyphen identifier.

The Batch 03 web client sends each attachment without `comment`, then sends the typed text once after
the attachment queue completes. It reuses each id for retry. Duplicate ids are scoped to the current
user and task and return the existing serialized comment.

Limits and controlled errors:

- empty attachment: 422;
- attachment size greater than or equal to 30,000,000 bytes: 413;
- unacceptable extension/MIME/package: 403 with an error body;
- unauthorized create/read: 403;
- missing attachment/file on GET: 404.

The authoritative DOCX media type is
`application/vnd.openxmlformats-officedocument.wordprocessingml.document`. A DOCX is stored with
`content_type = document` and `.docx`; exact uploaded bytes are retained.

## Serialized metadata

Attachment comments add:

- `has_attachment: true`;
- `type` (`audio`, `image`, `pdf`, or `document`);
- `attachment_file_name`;
- `attachment_mime_type`;
- `attachment_byte_size`.

Those metadata fields are omitted from text-only comments. The web mapper exposes their camel-case
equivalents on `TaskComment`.

## Download

`GET /projects/:project_id/task_def_id/:task_definition_id/comments/:id` retains the existing project
read authorization. It streams the stored file and MIME. `as_attachment=true` asks for download;
`document` comments force attachment disposition even if the flag is false. The safe original filename
is encoded through `ActionDispatch::Http::ContentDisposition`, including `filename*` for Unicode.

DOCX storage paths remain derived from internal comment ids, never from the supplied filename. This
separates a human-readable name from filesystem safety and preserves exact bytes.
