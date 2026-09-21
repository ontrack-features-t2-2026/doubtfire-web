# Migration validation — 21 September 2026

Validated code revision: `ec350a1f3bc70b543a1f6e5cb8275b5d33d2b1af` on
`codex/buckets-migration-20260920`, based on web `11.0.x`
`a35f2826ddff8a816175490c108f1794779c3254`.
[Pull request #259](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/259)
is for review; nothing was merged by this task.

Runtime: macOS arm64, Node `v26.8.1`, npm `11.19.0`, Angular `22.0.3`,
ngx-charts `25.0.2`. The repository's minimum/exact handover Node version remains
22.22.3; this run used the newer available runtime.

| Check                                      | Result                                                                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Full Angular/Vitest suite                  | **149 suites, 1094 tests passed**; final test phase 62.53 seconds, build phase 52.23 seconds.                                          |
| Focused chart and analytics regression run | **7 suites, 32 tests passed**, including SVG rendering for all three new charts and the existing pie, burndown and gauge.              |
| `npm run lint`                             | **Passed**, all files, `--max-warnings 0`.                                                                                             |
| `npm run build`                            | **Passed** with final dependency; 108.92 seconds.                                                                                      |
| Production asset presence                  | `dist/browser/JPlag` contained **7 files** after submodule initialization/build.                                                       |
| Development server                         | `npm run serve -- --port=4399`, with `NODE_ENV` unset, built successfully and returned **HTTP 200**. The temporary server was stopped. |
| Source cleanup                             | **0 tracked `.coffee` files**; obsolete harness files removed, live Angular module/routes retained.                                    |
| Whitespace and document links              | `git diff --check` and relative-link existence check passed.                                                                           |

## Reproduce the full suite with a bounded worker count

The host was running multiple unrelated builds. The following temporary configuration
limits parallelism while preserving Vitest's normal fork-process semantics. It is not
a test-suite exclusion or a repository configuration change.

```sh
cat > /tmp/ontrack-migration-vitest.config.mjs <<'CONFIG'
export default {
  test: {maxWorkers: 1, minWorkers: 1, fileParallelism: false, pool: 'forks'}
};
CONFIG
NG_BUILD_MAX_WORKERS=2 npm test -- --watch=false --runner-config=/tmp/ontrack-migration-vitest.config.mjs
NG_BUILD_MAX_WORKERS=2 npm run build
npm run lint
```

An earlier thread-worker run passed 1093 tests and failed the existing timestamp
mapping test, which mutates `process.env.TZ` at runtime. The same **unchanged** spec
passed 3/3 in fork mode, then the complete fork-mode run passed 1094/1094. No mapping
behaviour, assertions or application timezone were changed to obtain the result.
Warnings about third-party source maps, Node localStorage and the existing nested
PDF mock were non-fatal; they are not lint warnings from this change.

The focused SVG tests initially exposed ngx-charts 20.5's dependency on Angular's
removed `ComponentFactoryResolver`. They pass on 25.0.2 without an injection shim;
the test harness supplies Angular's no-op animation provider. The box test inspects
ngx-charts' computed quartiles and whiskers against the API summary fixture.

## Cross-repository source combination and limits

- Web: `11.0.x` `a35f2826ddff8a816175490c108f1794779c3254`, plus this branch.
- API: `11.0.x` `bb360dfa626f30e22c1382e20ef43c06ce6b38fa`; existing stats methods
  and authorization contract inspected.
- Deploy: `11.0.x` `41e50d9db4d12c0792b353fddf1494b01ad197c0`.

The chart tests use fixtures and mount real SVG components. The server check verifies
frontend startup; it is not an authenticated convenor session. The
[analytics guide](analytics.md#verification) gives the remaining real-data walkthrough
for a reviewer with a seeded/live API. No production data, author feedback, organisation
permission changes or Planner card state is claimed by these checks.
