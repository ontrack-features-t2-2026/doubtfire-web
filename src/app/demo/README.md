# Guarded local demo walkthrough

`DemoScenarioRegistryService` is the only runtime adapter for the combined local walkthrough.
It loads `GET /api/demo/scenario` after authentication and keeps the returned contract in its own
in-memory subject. It does not write units, projects, tasks, notifications, groups, or dynamic IDs
into any normal entity cache.

Two independent guards are required: the build must set `environment.enableDemoTools` in a
non-production build, and the API contract must succeed for the guarded synthetic account. An
ordinary development API, another account, or production returns a generic 404, leaving the tools
unavailable.

Demo OFF is a true pass-through. There is no HTTP masking interceptor and no PPI substitution.
Demo ON only allows feature surfaces to consume the stable adapters in the contract. The enabled
bit is stored in `sessionStorage` under both the scenario ID and authenticated user ID, is reset on
sign out/account change, and never travels to the API. Toggling does not reload the application or
mutate server data.

The canonical semantics and seed live in the API's
`lib/demo_data/mobile_feedback_scenario.rb`. Client-side preview fixture files may remain for unit
tests or later component work, but they are not the runtime scenario registry.

## Removal

1. Remove `DemoToolsModule` from `doubtfire-angular.module.ts` and delete this folder.
2. Remove `/demo-controls` and its imports from `app.routes.ts`.
3. Remove the Demo controls item/store injection from `common/header/header.component.*`.
4. Remove `<f-demo-mode-banner>` from `app.component.html`.
5. Remove `enableDemoTools` from both environment files.
6. Remove the registry load/clear and `DemoModeStore.reset()` sign-out hooks from
   `authentication.service.ts`.
7. Remove demo gating/imports from the progress dashboard, burndown chart, and any later feature
   adapters that consume `DemoScenarioRegistryService`.
8. Either delete the demo-only unit summary and peer-median UI or replace them with authorised live
   API adapters before retaining those surfaces.
