# Batch 05: shared phone document flow, reachable task navigation, and signed-out branding

## Result and scope

Batch 05 is complete in the active web lane at
`/Users/ryan/Downloads/test-codex/phone-evidence-20260828/doubtfire-web`. The phone project workspace now
uses the page as its one vertical scroller, keeps the compact task tabs reachable without pinning the
application header or selected-task heading, reserves safe-area space at the bottom of shared pages,
and restores the approved coloured OnTrack mark on signed-out phone layouts.

This batch changes the shared shell and layout contracts only. It does not redesign Tasks, Task
Details, feedback, Portfolio, or any other feature page; it does not add Batch 09 demo wording or
fixtures; and it does not change live student data. Purpose-built desktop split panes, PDF viewers,
submission views, history, and moderation surfaces remain bounded.

## Diagnosis before change

- The project shell and each child pane imposed fixed heights plus independent `overflow` rules.
  On a phone this produced nested vertical scrollers, clipped final cards, and controls that appeared
  unreachable even though they were present in the DOM.
- The task list retained `overflow-x: hidden`. Combining that with `overflow-y: visible` would compute
  the vertical axis back to `auto`, silently recreating a nested scroll container. The phone override
  therefore uses `overflow-x: clip`, which clips horizontal paint without establishing a scroll box.
- The whole mobile task toolbar moved as one unit. Keeping every header/banner/heading sticky would
  consume substantial phone height and could hide content. The compact four-tab task navigation is
  now the only sticky project element.
- Task Details is ordinary document content on a phone, while Task Sheet, Submission, History, and
  moderation are purpose-built bounded views. Flattening every task-dashboard state would break those
  feature surfaces, so document-flow modifiers are applied to Details only.
- Shared page containers did not reserve the device bottom safe area. Signed-out phone screens also
  used fixed viewport-height utilities and a monochrome/off-centre wordmark, producing clipping and
  incorrect OnTrack branding.

The immutable before observations are indexed in
[source-image-manifest.md](source-image-manifest.md). Screenshots are evidence, not instructions.

## Implemented behavior

### One phone document scroller

- The viewport opts into `viewport-fit=cover`. Shared CSS defines one task-tab height, sticky offset,
  and bottom-safe-area token. Phone pages clip horizontal overflow without creating a horizontal or
  vertical scroll container, and anchors reserve the sticky-tab offset.
- The project dashboard shell, layout, phone panes, task list, Task Details, and feedback conversation
  release their phone-only fixed heights and vertical overflow to the document. The unit task list
  explicitly pairs `overflow-x: clip` with `overflow-y: visible`.
- `f-page-container` now owns consistent phone bottom padding using the shared safe-area token. The
  project workspace adds the same bottom reserve because it is not wrapped by that component.
- Feedback's existing Batch 04 attachment-card sizing remains intact while its conversation panel
  joins the shared document flow. This batch does not alter composer behavior or attachment styling.

### Reachable navigation without hidden content

- The selected-task heading and four-tab navigation are direct siblings of the project shell. The
  heading remains in normal document flow; only the compact task navigation is `position: sticky` at
  the top of the document.
- Task-list and overview phone panes no longer own hidden or auto vertical overflow. The final task
  status, feedback composer, and detail cards can therefore be reached through document scrolling.
- Task Details receives a semantic `--document` modifier on the shell/body. Focused negative tests
  prove Task Sheet and Submission do not receive that modifier.

### Desktop preservation

- The base project shell retains `overflow: hidden` and its existing viewport-derived height. The
  desktop task list retains `overflow-y: scroll`; desktop split panes and comments remain bounded.
- The phone behavior is contained in the existing `max-width: 639.98px` breakpoint. Source contracts
  assert both the desktop clipping rule and the phone release rule.

### Signed-out OnTrack identity

- Sign-in and welcome use a shared `signed-out-shell`, `signed-out-content`, and `signed-out-card`
  layout. Phone height is content-driven with `100dvh` minimums and safe-area padding on all sides;
  desktop retains full-height behavior and its white sidebar logo.
- The phone wordmark uses `/assets/images/logo.svg`, has the explicit alternative text `OnTrack logo`,
  and centers the mark, product name, and heading. The former monochrome mark and forced custom mobile
  viewport height are removed.

## Verification

Focused checks run on 31 August 2026 (Australia/Melbourne):

| Contract                                                                                                     | Evidence/result                                                                                |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Shared page-container class and safe bottom reserve                                                          | `page-container.component.spec.ts`                                                             |
| Phone project tabs are direct sticky shell children; desktop shell clips while phone shell releases overflow | `project-dashboard.mobile.spec.ts`                                                             |
| Details alone receives document-flow flattening; Task Sheet and Submission remain bounded                    | `task-dashboard.component.spec.ts`                                                             |
| Phone task list uses `overflow-x: clip` plus visible vertical overflow; desktop list remains scrollable      | `unit-task-list.component.spec.ts`                                                             |
| Feedback conversation releases phone vertical scrolling without losing Batch 04 document-bubble bounds       | `task-comments-viewer.component.spec.ts`                                                       |
| Sign-in/welcome use the coloured centred OnTrack wordmark; desktop hero retains its white logo               | `sign-in.component.spec.ts`, `welcome.component.spec.ts`, and `hero-sidebar.component.spec.ts` |
| Combined focused Angular run                                                                                 | 8 suites, 80 tests, 80 passed, 0 failed                                                        |
| Web TypeScript check                                                                                         | Passed                                                                                         |
| Targeted Batch 05 formatting and ESLint                                                                      | Passed                                                                                         |
| `git diff --check`                                                                                           | Passed                                                                                         |

After the web container was restarted, root also loaded the rebuilt bundle on a fresh local origin
and recorded signed-out geometry in
[`signed-out-browser-geometry.json`](signed-out-browser-geometry.json). At 320, 360, 390, and 412
CSS pixels, document width exactly matched viewport width, both body and signed-out shell retained
visible vertical overflow, the form remained inside 16-pixel side reserves, and the visible wordmark
used `/assets/images/logo.svg` with `OnTrack logo` alternative text. At 1440×900 the desktop sidebar
remained visible and full-height with its white logo, while the phone wordmark was hidden.

The focused run compiles the real Angular templates and component styles and checks the desktop/phone
overflow contracts. Signed-out geometry is browser-measured; final authenticated project-workspace
geometry still requires the isolated demo fixture. No production account or live student record was
modified to manufacture screenshots.

Integrated geometry verification should cover 320, 360, 390, and 412 CSS-pixel phone widths and a
desktop viewport, checking:

1. `document.scrollingElement` is the sole vertical scroller for Overview, Tasks, Task Details, and
   Feedback on a phone; `scrollWidth <= clientWidth` throughout.
2. The final task/status card and the feedback composer can be reached without an inner-pane scroll.
3. Only the four task tabs remain sticky; the application header, demo banner, and selected-task
   heading scroll normally and content is not obscured beneath the tabs.
4. Task Sheet, Submission, History, PDF, and moderation states retain their bounded viewers.
5. Desktop retains the fixed-height split shell and internal task-list/comments scrolling.
6. Signed-out phone screens show the centred coloured mark and remain usable above the bottom safe
   area in portrait and with the keyboard closed.

## Handover / code map

- document viewport and shared tokens: `src/index.html` and `src/styles.scss`
- shared page bottom reserve: `src/app/common/page-container/page-container.component.{ts,html,scss}`
- phone/desktop project shell and sticky tabs:
  `src/app/projects/states/dashboard/project-dashboard/project-dashboard.component.{html,scss}`
- Details-only document modifier:
  `src/app/projects/states/dashboard/directives/task-dashboard/task-dashboard.component.{html,scss}`
- task-list overflow boundary:
  `src/app/units/task-viewer/directives/unit-task-list/unit-task-list.component.scss`
- feedback shell integration: `src/app/tasks/task-comments-viewer/task-comments-viewer.component.scss`
- signed-out layout and branding: `src/styles/common/hero-sidebar-layout.scss`,
  `src/app/sessions/states/sign-in/sign-in.component.{html,scss}`, and
  `src/app/welcome/welcome.component.html`
