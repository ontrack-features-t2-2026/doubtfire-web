# Optional connected browser harnesses

`task-upload-browser.mjs` exercises the real Angular app with synthetic accounts:
task requirement controls, keyboard selection, rejected/accepted uploads and a
retained archive download. It adds no application or CI dependency. See
[the results](../RESULTS.md) for recorded runs and [the review guide](../REVIEW.md)
for the human checks this script does not replace.

## Tooling and private configuration

Use Node.js 22.22.3 or newer, Python 3 (standard-library ZIP/hash verification),
and Google Chrome. The original run used Playwright **1.63.0** and Chrome
153.0.8010.48. Install Playwright outside the repository:

```sh
qa_tools="$(mktemp -d)"
npm install --prefix "$qa_tools" --no-save playwright@1.63.0
export CLOSURE_PLAYWRIGHT_MODULE="$qa_tools/node_modules/playwright/index.mjs"

# Only if Chrome is not already installed on the QA machine:
node "$qa_tools/node_modules/playwright/cli.js" install chrome

export CLOSURE_QA_FIXTURES="/absolute/private/path/accounts.json"
export CLOSURE_QA_OUTPUT="$(mktemp -d)"
export CLOSURE_QA_URL="http://127.0.0.1:4311"
export CLOSURE_WEB_SHA="<actual-running-web-commit-and-working-tree-description>"
export CLOSURE_API_SHA="<actual-running-api-commit>"
```

The module setting accepts a package name, absolute module path or file URL;
its default is `playwright`. `CLOSURE_QA_FIXTURES` is required. The app URL defaults
to `http://127.0.0.1:4311`; output defaults to `qa-output` beneath the working
directory. That default output directory is **not automatically Git-ignored**:
prefer the private temporary directory above and publish only reviewed evidence.
Revision fields are caller-supplied metadata, not proof of the server's source.

Keep the fixture file outside the repository with permissions such as `0600`.
Only synthetic accounts and content belong in this environment. The minimum
schema is:

```json
{
  "unitId": 1,
  "uploadStudent": {
    "username": "<synthetic-student-login>",
    "password": "<private-local-password>",
    "projectId": 2,
    "taskAbbreviation": "1.1P",
    "taskDefinitionId": 1
  },
  "chair": {
    "username": "<synthetic-chair-login>",
    "password": "<private-local-password>"
  }
}
```

The fixture must contain task **1.1P — Spreadsheet Investigation** in that unit,
with one **Analysis Spreadsheet** upload requirement, type `csv` (displayed as
Spreadsheet), and submission-history retention enabled. The chair must have
permission to edit it. Use a separate synthetic student project for submissions;
the chair checks change and restore local form values without saving. The
`chair-footer-fix` stage expects the chair's saved appearance to be Dark; it does
not change appearance itself. The packaged files come from `../samples` relative
to this script, so launching it from another working directory is supported.

## Stages

Run from the repository root with one explicit stage:

```sh
TASK_UPLOAD_STAGE=verify-chair node docs/objective-closure/scripts/task-upload-browser.mjs
```

| Stage                       | Action and prerequisite                                                                                                                                                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inspect-student` (default) | Signs in, opens the synthetic task and records screenshot/AX text. Does not submit.                                                                                                                                                                 |
| `inspect-chair`             | Opens the configured task editor and records screenshot/AX text. Does not save.                                                                                                                                                                     |
| `verify-chair`              | Checks accessible names; uses Tab/Space/Home/arrows/Enter to select Code and restore Spreadsheet; toggles history off/on; checks zero definition writes and the saved category after reload.                                                        |
| `chair-footer-fix`          | Repeats chair checks in Dark and measures the semantic footer and Add-button text contrast; produces distinctly named post-fix evidence.                                                                                                            |
| `submit-spreadsheet`        | Requires the fresh, unsubmitted synthetic task. Checks guidance, rejects `excluded.exe` before a request, then submits `scores.xlsx` through the actual modal. This queues real work and changes the synthetic task. Run once per prepared fixture. |
| `verify-submission-history` | Run after real conversion/history jobs finish. Checks Awaiting Feedback and Current submission, downloads the archive through its UI button and compares the retained XLSX bytes/hash with `../samples/scores.xlsx`.                                |

For the connected submission flow:

```sh
TASK_UPLOAD_STAGE=submit-spreadsheet node docs/objective-closure/scripts/task-upload-browser.mjs

# Separately let the application's real AcceptSubmissionJob, TeX conversion,
# and history job finish for this synthetic task. Check worker logs and state.

TASK_UPLOAD_STAGE=verify-submission-history node docs/objective-closure/scripts/task-upload-browser.mjs
```

The harness does not start workers, consume queues, copy server artifacts or reset
tasks. The recorded run used a separately coordinated real worker and TeX helper;
retain their evidence separately. Do not reset a real task or alter shared
fixtures to repeat a submission. A second submission requires another prepared
synthetic fixture and corresponding evidence.

Each stage writes JSON, screenshots and AX text to the output directory; download
verification also retains its synthetic ZIP. Failed assertions produce a failed
result and nonzero exit status. Inspection stages also print the synthetic AX
tree. No credential/session export, trace or account fixture is generated.

The checks use actual application routes and requests, with no mocked APIs.
File selection uses Playwright's file-input API; it does not test the operating
system's native file-picker dialog. AX snapshots and automated keyboard actions
are not human screen-reader or usability observations. This harness covers one
named synthetic task and Chrome desktop; it does not establish a complete browser,
responsive, installed-PWA, permission or release-validation matrix.

## Chat attachments

`chat-browser.mjs` uses the same private configuration and `uploadStudent` account.
It posts synthetic attachments/comments and downloads them. Use an isolated test
project; it does not clean up posted comments or touch production accounts.

```sh
node "$qa_tools/node_modules/playwright/cli.js" install firefox webkit
CLOSURE_UPLOAD_BROWSERS=chrome,firefox,webkit node docs/objective-closure/scripts/chat-browser.mjs
```

Chrome is the default. The 15 groups check composer naming/keyboard, cancellation,
CSV/DOCX/XLSX byte-preserving downloads, existing PDF/audio/image viewers, empty/
unsupported/30 MB client rejection, server format rejection and retry, simulated
drop/paste, and the actual file-input flow at 390px. Native operating-system picker
UI is not automated. The existing API converts/compresses legacy media; its bytes
are not required to match the uploaded source.

For a focused retest, set `CLOSURE_UPLOAD_CHECKS` to comma-separated group ids,
for example `post-and-view-handout-pdf,post-and-view-screenshot-png`. The JSON
records the selected ids; that result must not be represented as all 15 groups.
The viewer checks activate the named PDF/image buttons with Enter.

The Firefox synthetic ClipboardEvent may not retain files; the harness reports
that case NOT RUN rather than a pass. WebKit tests native Enter activation but
does not certify platform Tab preferences or native Safari. The harness exits
nonzero for failed assertions; a run with an explicitly unrun check is labelled
`passed-with-unrun`. Screenshots, per-browser JSON and synthetic downloads remain
in `CLOSURE_QA_OUTPUT`. Set `CLOSURE_UPLOAD_VIDEO=1` only when a reviewed recording
is wanted; that recording includes synthetic sign-in and setup.

## Theme matrix

`theme-browser.mjs` uses the same tool, origin, output and revision settings. Its
default `signed-out` stage needs no account fixture. Chrome, Edge, Firefox and
Playwright WebKit are selected by default; select only installed engines:

```sh
CLOSURE_QA_BROWSERS=chrome,firefox,webkit CLOSURE_QA_STAGE=signed-out node docs/objective-closure/scripts/theme-browser.mjs
CLOSURE_QA_BROWSERS=chrome CLOSURE_QA_STAGE=authenticated node docs/objective-closure/scripts/theme-browser.mjs
CLOSURE_QA_BROWSERS=chrome CLOSURE_QA_STAGE=staff node docs/objective-closure/scripts/theme-browser.mjs
CLOSURE_QA_BROWSERS=chrome CLOSURE_QA_STAGE=pdf node docs/objective-closure/scripts/theme-browser.mjs
```

Authenticated stages also require `themeStudent`, `tutor`, `chair` and `admin`
accounts in the private JSON, each with synthetic `username` and `password`.
`themeStudent.projectId` points to a separate project with task `1.2P` and a real
synthetic Task Sheet PDF; the staff fixture uses unit `unitId` and task `2.1P` with
disabled assessment automation and an inert script resource for the Monaco check.
Provision those fixtures using the application's normal test setup. Do not enable
real assessment execution or change production settings to run this harness.
To reproduce the two recorded dashboard/feedback groups, include these
`themeRoutes` entries (adjust the project id to the fixture):

```json
{
  "themeRoutes": [
    {"id": "student-overview", "path": "/projects/1/dashboard"},
    {
      "id": "task-chat-history",
      "path": "/projects/1/dashboard/1.2P/feedback",
      "ready": "Report and Feedback"
    }
  ]
}
```

The plan/Gantt route is added automatically from `themeStudent.projectId`.
Omitted dashboard/feedback entries are not covered; they do not become passes.

This harness **writes the synthetic users' appearance preferences**. Use separate
accounts from simultaneous chat/submission review and do not run overlapping
theme stages on one account. It preserves prior browser results in the same
output file when a browser subset is rerun; use a new output directory for a new
candidate rather than mixing revisions.

The recorded WebKit authenticated run has four unresolved calendar/navigation
failures; see [the evidence and limitations](../BROWSER-RESULTS.md). A later probe
using a separate browser for the persistence check also failed before reaching
that check, so closing the secondary context is not an established cause.
`CLOSURE_QA_SKIP_CSS_ZOOM=1` omits synthetic CSS zoom for a bounded diagnostic run;
it does not turn native zoom into a tested result. Browser failure records are
retained and produce a nonzero exit status. Screen-reader, native Safari, physical
OS, native zoom and installed-PWA observations remain manual.
