# Synthetic browser QA fixture

This fixture mounts the production tutorial shell and service with real Angular
Router events, **the application's exact global styles/index/theme/font assets**,
and synthetic account/history responses. Its surrounding controls are explicitly
synthetic; it does not exercise the real application header, profile form, API
authorization or enrolled projects. No credentials, real accounts or new npm
dependencies are required.

From the web repository, after installing its lockfile dependencies:

```sh
node docs/student-onboarding/browser-qa/serve.mjs
```

Open the printed loopback URL (default port 4317). The runner copies the current
source and fixture into a fresh temporary directory without modifying the checkout.
Restart after a production source change to test the updated copy. Stop with
Ctrl+C. The temporary directory is printed and retained for evidence inspection.
Set `TUTORIAL_QA_PORT` to select another port. Use the repository's supported Node
runtime. The compiler uses the real module for declaration scopes but the harness
never bootstraps the real app or authenticates against an API.

Each new browser context uses synthetic user `100001`. Choose **Complete profile
setup** to pass the fake profile/loading boundary, or pre-seed the progress key
`ontrack:student-onboarding:100001` for resume/completed/dismissed scenarios. The
fixture starts with incomplete setup and an `{hasProjects:false}` own-history response. **Reset
demo progress** removes only that synthetic account's tutorial key.

Optional query parameters:

- `?noUnits` for missing current units.
- `?missing` to omit the target-grade control.
- `?history` for an `{hasProjects:true}` history and replay-only behavior.
- `?role=Tutor` for staff-role exclusion.
- `?disabled` for the institution switch off.
- `?storageFailure` for a browser-storage exception.

The synthetic **Disable tutorial** operator control can be reached by focus and
Enter if the tutorial card covers its pointer location on a narrow viewport.
That fixture control does not represent an in-app student feature. On real guided
steps the underlying page remains keyboard reachable; entry/confirmation dialogs
intentionally contain focus.

Record engine/version, viewport, reduced-motion preference, assertions and
screenshots. Label WebKit engine evidence as WebKit, not a native Safari run.
Chrome, Edge and Firefox also require explicit engine/browser versions. CSS zoom
or a smaller CSS viewport is not a substitute for recording an actual browser
200% zoom test. Accessibility-tree snapshots verify semantics, not a human screen
reader session. Keep synthetic browser evidence distinct from pilot participation,
full-application acceptance and reviewer approval.

## Automated browser matrix

The optional `check.mjs` uses Playwright with fresh synthetic browser contexts.
It exercises Chrome, Edge, Firefox and WebKit; install the desired browsers in
your QA environment first. Playwright is external QA tooling and is not added
to the production lockfile. If it is installed outside this checkout, set
`PLAYWRIGHT_MODULE` to that installation's module URL or absolute `index.mjs` path.

With the fixture running:

```sh
node docs/student-onboarding/browser-qa/check.mjs
```

Set `TUTORIAL_QA_URL` when using another host/port. Set `TUTORIAL_QA_BROWSERS` to a
comma-separated selection such as `firefox,webkit` for a bounded rerun; unselected
results already on disk are retained with their recorded versions. A launch
failure is recorded as blocked and remaining engines still run. The command exits
nonzero if any recorded engine result is not passed.

Firefox uses disposable `MOZ_APP_DATA` and `MOZ_LOCAL_APP_DATA` directories to avoid
reading the operating system's protected default app-data directory during engine
startup. They are removed after the run; no OS permissions are changed. At narrow
widths, the check reaches the wrapped guide link by Tab (Option+Tab under WebKit
on macOS) and keyboard End, then
waits for its complete geometry to fit the scrollable panel. This tests user
scrolling rather than assuming automation scroll helpers expose every inline line.

This writes results, screenshots
and accessibility-tree snapshots to `browser-qa/evidence/`. Review generated
artifacts before replacing checked-in evidence. A passing run confirms synthetic
browser behavior only, subject to the limitations above.

The [checked-in evidence](evidence/README.md) records the performed run and its
limits. Regenerate it when production behavior changes.
