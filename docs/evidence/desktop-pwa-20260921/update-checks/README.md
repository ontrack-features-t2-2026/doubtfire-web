# Desktop PWA update and rollback regression

`update-rollback.cjs` tests the real production Angular service worker and the
application's Reload action. It serves copies of a production build on loopback
with a disposable Chrome profile. The repository, supplied build and checked-in
evidence are never modified by the harness.

## Reproduce

Use the repository's supported Node.js version, an existing production build
containing `ngsw.json`, Playwright 1.62.1, and installed Google Chrome. Playwright
is a harness dependency; adding it to the application package is unnecessary.
For example, from the repository root on macOS/Linux:

```sh
# If needed, create the production build using the project's normal build setup.
npm run build -- --configuration production

# Install the harness dependency separately from the repository.
pwa_browser_deps="$(mktemp -d)"
npm install --prefix "$pwa_browser_deps" --ignore-scripts --no-audit --no-fund playwright@1.62.1
NODE_PATH="$pwa_browser_deps/node_modules" node docs/evidence/desktop-pwa-20260921/update-checks/update-rollback.cjs
```

The build defaults to `dist/browser` relative to the repository containing the
script, regardless of the current working directory. An alternative build can
be passed as the first argument:

```sh
NODE_PATH="$pwa_browser_deps/node_modules" node docs/evidence/desktop-pwa-20260921/update-checks/update-rollback.cjs /absolute/path/to/dist/browser
```

The harness discovers installed Google Chrome at standard macOS, Linux and
Windows locations, then searches `PATH`. Set `CHROME_EXECUTABLE` to an absolute
executable path to override discovery. It does not install or download a
browser. On Windows, set `NODE_PATH` to the separately installed dependency's
`node_modules` directory before invoking the same script with Node.js.

Every run prints its unique evidence directory under the operating system's
temporary directory. Set `PWA_OUTPUT_ROOT` to an existing directory outside the
repository and build to choose another output parent. Results and up to two
screenshots remain there; build copies and the browser profile are removed on
completion. The script exits nonzero on failure and records the assertion and
worker state when available. An unsuccessful run can additionally leave
`failure.png` in its output directory.

## Checked-in evidence

`results.json` records a successful run of this packaged harness against the
desktop PWA production build. It includes the browser version, real worker
messages, worker debug states, manifest identity, eight check groups, and the
outcome. `update-ready-preserves-document.png` shows the production Reload
prompt while the synthetic unsaved value remains in the existing document.

1. Release A is fully prefetched by the production worker, which reaches
   `NORMAL`.
2. Coherent release B produces a real `VERSION_READY` and the production Reload
   prompt. Document identity and a synthetic unsaved textarea value persist for
   ten seconds without automatic navigation.
3. Clicking the actual Reload action activates and loads B; the worker remains
   `NORMAL`.
4. Restoring A's identical original worker manifest yields
   `NO_NEW_VERSION_DETECTED`; B remains the worker's latest version.
5. A newly opened client in the same profile still receives B from the worker
   after that identical-manifest restore.
6. Republishing A's identical asset bytes with a fresh Angular manifest
   timestamp creates a distinct recovery version. The real update prompt and
   user-requested Reload return to A with unchanged web app identity and worker
   scope. Hashes of the full A/recovery asset tables are asserted equal.
7. Recovered A reloads from the worker cache offline and shows the application's
   offline warning. API-backed sign-in is unavailable offline.
8. Reconnecting succeeds, and another check reports no new version.

## Recovery implication and limits

An old manifest hash already known by the worker is not accepted as a new
version. Recovery therefore requires a fresh coherent build of the prior source
with a newly generated Angular manifest, preserving the app origin and
`/index.html` identity. Verify the update prompt and resulting version on an
existing client before accepting recovery. Restoring a previous image alone
does not establish that browser clients have rolled back.

Release variants are synthetic: only an inert HTML meta tag and generated
Angular manifest metadata/hashes change in temporary copies. API responses are
signed-out fixtures. The unsaved textarea tests document/DOM preservation, not
an authenticated course editor. This headless browser check does not test OS
installation, institutional SSO, real notification delivery, uploads, or live
deployment. Standard Chrome path discovery is portable code; the checked-in
result documents only the platform and browser actually exercised.
