# Full application tutorial evidence — 21 September 2026

[Watch the 29-second silent annotated walkthrough](tutorial-v1-20260921-full-app.webm).
It shows tutorial version 1 in the **full application**, with real authenticated
API responses and isolated synthetic student/unit data. Only explanatory captions
are added to the recording. [Reproduction and exact source-tree provenance](../README.md)
identify the two published parent commits behind the local combined tree.

This is a draft fallback guide pending a second human review. It does not claim
pilot participation, reviewer approval or complete release acceptance.

## Performed checks

| Environment | Performed result | Evidence |
| --- | --- | --- |
| Native Chrome on macOS, running version not queried before lock | Actual sign-in → existing profile form → Confirm Account → home → automatic offer; focused welcome heading; native browser UI explicitly 200%; all welcome controls/link readable | [Inspection record](native-inspection.txt), [page screenshot](tutorial-v1-20260921-native-200.png) |
| Chrome 153.0.8010.48, headless, 1280×800 | Real unit selector navigated to enrolled dashboard; four tutorial steps/targets and completion worked; replay Close returned focus to account trigger; no pageerror events | [Recorded result](walkthrough-result.json), [video](tutorial-v1-20260921-full-app.webm) |
| Edge 153.0.4234.32, headless, 1280×800 | Same targeted full-app flow passed with no pageerror events | [Result](edge-full-app-result.json) |
| Firefox 155.0, headless, 1280×800 | Same targeted full-app flow passed with no pageerror events | [Result](firefox-full-app-result.json) |

The native view used the fresh Student with zero project history. The recordings
and headless checks use the enrolled Student's permanent **Tutorial and Help**
entry. The actual unit/dropdown/dashboard/target-grade/Calendar controls are used,
not synthetic surrounding buttons. Credentials were supplied to the local API
before the recorded page existed; passwords/tokens were not filmed or committed.
The unit's learning outcomes and task data are synthetic; the shown task filter
has no visible tasks in the selected state.

Welcome and step accessibility-tree snapshots are included for each automated
engine. They record names, roles, step title/count and controls through the browser
accessibility API; they are not a human screen-reader session. The representative
[welcome](full-app-welcome.png), [tasks](full-app-tasks.png),
[target grade](full-app-target-grade.png) and [Calendar](full-app-calendar.png)
images were checked for real personal or assessment information; they contain
only the isolated fixture's synthetic content.

## Walkthrough transcript

1. Open the account menu and choose **Tutorial and Help** to replay.
2. Welcome offers **Start tutorial**, **Skip for now**, **Close** and the written guide.
3. **Choose Your Unit**: select the current synthetic unit yourself. The tutorial
   does not navigate or choose a unit automatically.
4. **Find Your Tasks**: find the dashboard navigation control.
5. **Check Your Target Grade**: **Find target grade** locates the existing selector;
   the guide does not change its value.
6. **Use the Calendar**: **Find Calendar** locates the existing Calendar control.
   The guide creates no subscription.
7. Finish the guide, then open **Tutorial and Help** again and close it. Focus
   returns to the real account-menu trigger.
8. The final annotation states synthetic data and pending human review.

The [automation timeline](walkthrough-automation-timeline.json) is measured from
script start, including authentication before recording. Its times are diagnostics,
not exact video seek positions.

## Exact limits and remaining acceptance

- The app artifact is a default/development build of local combined
  `a9e7af46f3eb17c4fefbac168a46688c73496286`, tree
  `bfa13f35d5e3da731cd7b3b4492c30b542ec2f9d`, paired with API
  `d7f7a5b9c2d34ef279ac3a70bc58823def64005c`. It is not a deployed production build
  or a claim that every later merged web change was exercised.
- The Mac locked after the native 200% capture. Closing DevTools/restoring native
  zoom was not completed; [the inspection record](native-inspection.txt) gives the
  cleanup steps. The recording used separate headless contexts.
- Complete the [manual acceptance sequence](../README.md#exact-acceptance-sequence)
  for keyboard-only Back/Skip/Escape, native focus/route Back, integrated reload/
  dismissal/failure/staff/flag-off, narrow sizes and reduced motion if full-app
  acceptance is required. The existing [four-engine component fixture](../../browser-qa/evidence/README.md)
  already covers those corresponding state/failure/layout cases in isolation.
- Native Safari was not exposed in the supported computer-use environment.
  Earlier WebKit engine evidence is labelled separately and is not Safari.
- A second person must review this recording and follow the contributor update
  procedure. Three representative humans must perform the pilot before pilot
  findings, fixes or approvals can be claimed. No agents count as participants.
