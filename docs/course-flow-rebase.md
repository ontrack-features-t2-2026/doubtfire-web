# Course-flow rebase for upstream issue 1304

This branch rebases the 16 non-merge commits from upstream
[`new/course-flow` at `e8fb9b983d10cda40c2ce005727387106e04ca40`](https://github.com/doubtfire-lms/doubtfire-web/tree/e8fb9b983d10cda40c2ce005727387106e04ca40)
onto the fork's `11.0.x` at `a35f2826ddff8a816175490c108f1794779c3254`.
Original commit authors are retained. Follow-up changes adapt the prototype to
the current Angular application. It is a rebase for review, not a completed
course-planning backend or a production release.

## Integration changes

- Use lazy Angular Router routes `/coursemap` and `/coursemap/:courseMapId`,
  with the existing signed-in role guard and a native `routerLink` in the account menu.
- Remove obsolete UI-Router and sign-in dependencies from the component. Use
  the application's HTTP client and interceptors rather than a component-local
  `HttpClientModule`.
- Use Angular control flow and current CDK drop-list IDs. Give icon controls
  accessible names and expose loading and failure messages.
- Load a selected map only from its explicit route ID. A new draft does not
  fetch map 1 or attempt to seed demo courses, definitions, or maps. Cancel old
  requests on navigation and unsubscribe when the component is destroyed.
- Preserve four slots per trimester; resolve saved IDs to catalog records and
  reject unknown, ambiguous, duplicate, occupied, or invalid slots. This
  adapter explicitly expects one-based trimester and unit-slot numbers. The
  inherited model does not document their indexing, so this convention still
  needs confirmation against the eventual backend.
- Keep required/elective classification when units leave their original list.
  Removing a unit, trimester, or year returns units to their catalog lists;
  dragging between occupied slots swaps their units. A list drop cannot
  overwrite an occupied slot.

## Backend boundary

The reviewed API `11.0.x` snapshot is
`bb360dfa626f30e22c1382e20ef43c06ce6b38fa`; deploy is
`41e50d9db4d12c0792b353fddf1494b01ad197c0`. Neither repository is changed by
this rebase. No live API or deployment combination was run.

| Request                                  | Current API status                                             |
| ---------------------------------------- | -------------------------------------------------------------- |
| `GET /api/units/`                        | Existing administrative catalog. Plain students cannot use it. |
| `GET /api/unit_definition`               | Course-flow endpoint is absent from current API.               |
| `GET /api/coursemapunit/courseMapId/:id` | Course-flow endpoint is absent from current API.               |

The interface displays a load error when these dependencies are unavailable.
The browser tests use explicit service fixtures; they do **not** prove a live
student can retrieve course data. Before enabling this feature in a release,
the backend must provide an authorized student catalog, scope required units
to the chosen course, and enforce ownership for each map. The ID contract
must also distinguish teaching-unit IDs from unit-definition IDs; equal
numbers from these catalogs are not necessarily the same unit.

The upstream prototype treats the entire definitions catalog as required and
has a fixed allowance of five electives. It does not apply course-specific
requirement sets or prerequisite rules. The inherited, currently unused write
services are scaffolding, including incomplete parameter and URL handling;
they are not invoked by the planner and are not validated persistence APIs.
Saving changes is outside the upstream rebase ticket. The page explicitly
says that draft edits are not saved when leaving it. Do not present a successful
drag/drop test as evidence that data was saved.

## Regression checks

Run the component suite with the repository's Angular/Vitest runner:

```sh
npm run test:ci -- --include=src/app/courseflow/coursemap/coursemap.component.spec.ts
npm run build
```

The suite renders the real component template. It covers new drafts, deferred
loads, failure recovery, invalid IDs, navigation cancellation and destruction,
saved-slot positions and collisions, ambiguous catalog IDs, add/move/swap/remove
operations, returning units after deleting a trimester or year, and duplicate
or required elective rejection. It uses no suppressed template errors and no
live service credentials. Live course data, persistence, and screen-reader
operation still require the compatible backend and manual review.

The focused component run passed all 12 cases on Node 22. Tests were rerun
after fixing the obsolete `cdkDropListId` binding exposed by rendering the
template. Changed-file ESLint also passed.
