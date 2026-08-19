# PPI-F02 Unit Peer Progress Summary Handover

## Delivered scope

PPI-F02 adds a reusable mock-backed unit-level Peer Progress Indicator summary
to the student Progress Dashboard.

The component displays:

- the student's own unit progress;
- a separately labelled anonymous cohort aggregate;
- genuine zero progress;
- small-cohort suppression;
- unavailable data;
- stale data;
- disabled, loading and error states.

The presentational component receives the existing typed
`PeerProgressUnitSummaryViewModel` through an input.

It does not make an HTTP request, create another PPI service, or calculate its
own percentage formula.

## Existing PPI work reused

This implementation reuses:

- `PeerProgressUnitSummary`;
- `PeerProgressUnitSummaryViewModel`;
- `resolvePeerProgressUnitSummaryState`;
- `PeerProgressIndicatorService.getMockUnitSummary`;
- `calculateCompletionPercentage`.

The existing task-sheet PPI widget and Progress Burndown implementation were
not modified.

## Privacy boundary

The component does not display peer names, student IDs, project IDs, individual
task statuses, marks, feedback, rankings, or raw cohort counts.

Suppressed, unavailable and stale states remove the anonymous cohort percentage
before it reaches the component display.

Disabled, loading and error states do not retain percentages that could be
mistaken for current information.

A real 0% remains visibly different from unavailable or suppressed data.

The unit summary is not displayed when staff are viewing another student's
project.

## Remaining live unit-level API requirement

PPI-F02 does not deliver a live backend unit-summary endpoint.

A future backend endpoint and frontend adapter should:

- authenticate the caller;
- derive student identity from the authenticated session;
- authorise access to the requested unit/project;
- enforce minimum-cohort suppression server-side;
- return only the student's own percentage and an anonymous cohort aggregate;
- avoid peer identities and raw cohort counts;
- avoid marks, feedback and individual task-state information;
- expose feature-enabled, suppression, stale/unavailable and timestamp state;
- use appropriate audit logging without recording sensitive student content.

The future frontend adapter can replace the mock call inside
`ProgressDashboardComponent.loadPeerProgressUnitSummary()` without redesigning
the presentational component.

## Validation

Targeted component tests cover:

- normal progress;
- genuine zero;
- small-cohort suppression;
- unavailable data;
- disabled data;
- stale data;
- changed component inputs.

Final validation should include:

- TypeScript typecheck;
- targeted PPI-F02 tests;
- lint;
- full frontend tests;
- build;
- `git diff --check`;
- normal desktop screenshot;
- normal narrow-screen screenshot;
- suppressed or unavailable screenshot.

## Attribution and takeover

PPI-F02 builds on the shared unit-summary foundation merged through PR #31.

Any earlier work from the original assignee should remain credited and preserved.
The takeover message and branch/PR search should be retained as project evidence.
