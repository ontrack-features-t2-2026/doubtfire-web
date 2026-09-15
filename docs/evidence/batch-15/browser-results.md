# Batch 15 authenticated browser results

**Captured:** 2026-08-31, Australia/Melbourne
**Runtime:** isolated `all-features-demo` Compose project
**Browser origin:** `http://127.0.0.1:4400`
**Synthetic account:** `demo_student`

## Provenance and safety

`./demo.sh prepare` applied the selected migrations, populated only the isolated
`doubtfire-all-features-demo` database, and passed its verifier before the browser journey. The
verified fixture contained 10 tasks, 60% submitted, 10% complete, three PPI-available units, one
insufficient-cohort unit, seven notification hooks, and Team Indigo with three of four places
filled.

The authenticated journey used the clean `127.0.0.1` origin because a pre-existing service worker
on `localhost:4400` was still serving an older hashed bundle from a different local stack. The
clean origin had no service-worker controller and loaded the current Vite `main.js`. No browser
storage, cache, or user profile was cleared. This distinction matters: the old `localhost` cache is
not evidence about the merged tree.

The journey made no upload, feedback-send, extension, profile, group, PPI, or notification-delete
request. Opening the synthetic feedback notification performed its normal read transition, changing
the isolated account from four unread notifications to three. A two-line local feedback draft was
created to test persistence and then removed with the explicit **Discard draft** action. Demo mode
was enabled only for this synthetic session.

## Measured results

- The demo control described synthetic local data, switched from **Demo off** to **Demo on**, kept
  the URL stable, and exposed direct Tasks/PPI/Burndown/Notifications destinations. The page had
  `document/body/viewport = 390/390/390` px.
- The Tasks view exposed the labelled `Search tasks` field, all 15 canonical status options, and the
  simplified mobile rows. Selecting an Overview `Awaiting Feedback` card produced the persistent
  `taskStatus=ready_for_feedback&taskView=tasks` filter and showed both matching fixture tasks.
- A `DUE7` PPI card showed 10% completed and, after the labelled Advanced switch, 60% submitted plus
  the seven privacy-rounded lifecycle rows. The `DEMO30243` hook instead showed only “Progress is
  hidden to protect privacy” and “Not enough students”, with no suppressed values.
- Notifications showed all seven event types and the expected four unread/three read starting
  split. **Delete all** opened a confirmation naming all seven rows; Cancel preserved them. The
  feedback notification landed at
  `/projects/146/dashboard/AWAITING/feedback`, selected the Feedback tab, and rendered the latest
  landing/composer viewport rather than the top of a long history.
- The feedback composer rendered a multiline `textarea`, explicit disabled/enabled Send action,
  attachment/audio/emoji controls, and no horizontal overflow. A two-line draft survived
  Details → Feedback navigation. Outside-click emoji dismissal closed without sending.
- Profile at 390 px resolved the self-only additional-email state to a labelled empty field and
  disabled **Send verification email** action, with `document/body/viewport = 390/390/390` px.
- The Task Planner rendered 10 complete phone cards, retained grade/status/dates/actions, and had no
  horizontal overflow. Its Web Calendar dialog measured 358×291 px at x=16 within 390×844.
- The Request extension dialog measured 358×547 px at x=16 within 390×844 and retained labelled
  Reason/date fields plus Cancel/Request actions.
- Portfolio rendered the semantic `Step 1 of 5` navigation, then `Step 2 of 5 — Select Grade`; Next
  remained disabled until the assessment-criteria acknowledgement. Tutorials rendered the exact
  configured empty state without a squeezed table.
- `DEMO10001` truthfully reported that group work was not configured. Switching to exact fixture
  unit `DEMO20007` rendered the clearly labelled synthetic Team Indigo card, capacity `3 of 4`, and
  its three members.

Authenticated task-detail shell geometry after the contained fixes:

| Viewport | Document width | Body width | Mobile project nav |
| -------- | -------------: | ---------: | -----------------: |
| 320×800  |         320 px |     320 px |             320 px |
| 360×800  |         360 px |     360 px |             360 px |
| 390×844  |         390 px |     390 px |             390 px |
| 412×915  |         412 px |     412 px |             412 px |
| 800×360  |         800 px |     800 px |      desktop shell |
| 1440×900 |        1440 px |    1440 px |      desktop shell |

The notification action remained present at every size (44×44 px on the measured phone shell and
48×48 px on the measured desktop shell).

## Contained regressions found and repaired

The merged walkthrough found three narrow integration faults; none required a feature redesign:

1. outside-click emoji dismissal could close the picker and then call `.contains` on a ViewChild
   whose `nativeElement` was between render states;
2. the Additional notification email request completed, but its asynchronous state needed an
   explicit change-detection mark in this app shell, otherwise the profile retained its loading
   copy;
3. the planner's initial height calculated `undefined + 2` before child items existed, producing a
   transient `NaN` and an Angular expression-check error.

After the fixes, the three browser paths produced no new console errors. The four directly affected
spec files passed 23 tests; merged typecheck and full lint also passed.

## Screenshots

| File                          | SHA-256                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| `signed-out-320.png`          | `0deb9c91552c71d717cea34a42bc25d47df06c67c2145ccf7eaa55874e4e5bd6` |
| `authenticated-tasks-390.png` | `316fdbe55202cebeb8c483d2d1fa57b4f2c0f797ef1abbab22945ebe1904ae92` |
| `demo-controls-390.png`       | `92e89d649e6606eff38cbcd8fe247e479aad95650773c607e4cf3f1edf5d052a` |
| `ppi-advanced-390.png`        | `b0174d7399ed8df254b021391c077f87f9532ff4b35b921d2ec75c4bc333a95b` |
| `notifications-390.png`       | `dd63145f8dd863fb2539190df734bb04d201bf03db903786eb5f10d575dbbc89` |
| `profile-390.png`             | `d99e9e1a78f8decedd32157ab936330b128876334d3aaeb8e28f8685b3e782e9` |
| `group-team-indigo-390.png`   | `b978694dcecbe349ee58439ff9bd7f7949690ec0b5c795bc4f6b59f279406f45` |

## Boundaries not relabelled as passes

- The in-app browser control cannot apply a true 200% page zoom; 320 px is not claimed as a zoom
  substitute.
- No real Android/iOS microphone, speaker, file picker, soft keyboard, OS background/resume, or
  installed-PWA process-eviction run was performed.
- No real PDF/TeX conversion worker or slow/failed upload was driven from the browser. The finite
  unavailable/retry states and API/job tests are evidence, not a production worker pass.
- No external SMTP relay exists in this environment, so no external arrival is claimed.
