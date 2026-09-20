# Accessibility remediation register and GitHub handover

This is the repository deliverable for A11Y-P01, A11Y-D02 and A11Y-MVP01. It records the GitHub scope and review handover; it does not assert leader approval, external ticket completion, human test results or accessibility certification. Snapshot: `11.0.x` at `d16f6201caff78082e5e83c540320dbee5871404`, 20 September 2026. Workbook statuses are planning inputs; code and merged PRs establish repository status.

The [baseline remains in PR #243](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/243); it is linked rather than copied. [A11Y-V01](../A11Y-V01-validation-notes.md), merged in [#239](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/239), is historical evidence for its recorded baseline, not a fresh result for these fixes. Audit reports not included in the supplied repository/workbook cannot be treated as reviewed evidence.

## Reproduced lint baseline

With all four rules enabled on this SHA, the modern-template scan reports **37 messages in 15 files**: 11 label messages in four files, 12 click messages in ten files, 14 focus messages in twelve files, and zero mouse messages. File sets overlap. These are rule messages, not 37 distinct user defects: one interactive element may fail both click and focus rules. Mouse-event diagnostics can also report ancestors, so use source locations and element ranges when deduplicating future runs. The earlier 78-message August result predates merged mouse/focus work and other template changes; it is not the current baseline. The eight ignored legacy templates are excluded from both this scan and normal lint.

To reproduce, create a temporary `eslint.a11ycheck.cjs` beside `eslint.config.js` with:

```js
const base = require('./eslint.config.js');
module.exports = [
  ...base,
  {
    files: ['**/*.html'],
    rules: {
      '@angular-eslint/template/label-has-associated-control': 'error',
      '@angular-eslint/template/mouse-events-have-key-events': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
    },
  },
];
```

```sh
npx eslint --config ./eslint.a11ycheck.cjs 'src/**/*.html' -f json > a11y.json
```

Exit 1 is expected on the recorded baseline. Keep sanitised output with review evidence, then remove only these two temporary files. After remediation the same four-rule scan should have no messages. Labels are the narrowest fix (mostly captions and associations), mouse parity is already enforced, and click/focus fixes should use the same native elements to avoid conflicting semantic patches. The source-focused register below deduplicates those shared root causes.

## Prioritised Phase 1 register

Severity is provisional until journey testing confirms impact. P0/P1 items must remain visible until fixed and re-tested or explicitly accepted by the responsible reviewers. Effort is relative: S = a narrow template/test change; M = shared behaviour and multiple call sites; L = integrated journeys or independent validation. Owners below are teams, not unconfirmed assignments to individuals.

| Finding / implementation tickets                                         | Priority; scope; effort        | Source evidence and user impact                                                                                                                                                       | Owner / dependencies                                                                           | Delivery and re-test                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Keyboard activation and focus: F03, F04, KB01                            | P1; shared + student/staff; M  | Three template rules remain off in `eslint.config.js`; click-only containers, including home unit cards, impede keyboard journeys. The mouse-events rule is already on.               | Accessibility; native controls before lint enforcement; preserve routing and action semantics. | Proposed `fix/a11y-keyboard-controls-20260920`; K1–K3, ST1, SF1.                                                         |
| Labels and names: F01, FORM02, FORM04, NAME01, NAME03                    | P1; shared + administration; M | Date slider/captions misuse labels; task-status select and admin fields lack proper names; grading/moderation have empty names; four iframe templates lack titles.                    | Accessibility; account for Material-generated controls; coordinate feature-owned content.      | Proposed `a11y/remaining-labels-and-names-20260920` and `fix/a11y-status-motion-menu-20260920`; S1–S2, ST2–ST3, SF4–SF5. |
| Shared feedback/assessment patterns: F05; FORM01, MODAL01 reconciliation | P1; shared + staff/student; M  | At this baseline the comment contenteditable has no textbox role/name, and grade dialog still has prose in `aria-describedby` and an unnamed slider despite completed workbook cards. | Accessibility with feedback/assessment owners; preserve submission and grading rules.          | Requires source correction and rendered regression coverage; ST4–ST5, SF3–SF4, K3, S2–S3.                                |
| Status contrast: COLOUR02                                                | P1; shared status; M           | Task status foreground/background mappings in `task-status.ts` and `task-status-colors.scss` require measured contrast; status interpretation affects both journeys.                  | Shared with Theme; preserve existing semantic token contract and labels.                       | Proposed `fix/a11y-status-motion-menu-20260920`; actual pair measurements and V3.                                        |
| Motion policy: PR-A11Y-12                                                | P2; shared; S                  | `ConfettiService.canon` calls canvas-confetti without a reduced-motion option at the baseline. CSS alone cannot suppress canvas.                                                      | Accessibility; Theme owns palette, not this preference guard.                                  | Proposed `fix/a11y-status-motion-menu-20260920`; V4 and preference regression tests.                                     |
| Notification panel semantics: menu-heading-inside-role-menu              | P2; shared header; M           | Notification dropdown combines a heading and layout/content within menu semantics.                                                                                                    | Shared with Notifications; preserve row navigation and actions.                                | Proposed `fix/a11y-status-motion-menu-20260920`; K2–K3, S1, S3.                                                          |
| Student and staff journey coverage: F06, F07                             | P1; student/staff; L           | They are integrated checks of the shared fixes above, not permission to duplicate feature implementations.                                                                            | Accessibility + FILE/PPI/Notifications/assessment owners; depends on shared fixes.             | Rendered tests plus ST1–ST6 and SF1–SF6; no fresh human pass claimed.                                                    |
| Guardrails: T01; MAINT01 reconciliation                                  | P2; testing/maintenance; M     | Eight legacy `.tpl.html` files and the global lint ignore remain at the baseline; a completed workbook state alone cannot prove removal.                                              | Accessibility + migration owners; verify unused templates before deleting them.                | Actual CI/script change is separate from these docs; retain meaningful component tests and full lint/typecheck/build.    |
| Contributor documentation: P01, T02, D02, MVP01, PR-A11Y-13              | P2; documentation; S           | No accessibility PR checklist or reusable authoring/manual pack exists at the baseline.                                                                                               | Accessibility documentation; developer + tester review; link existing D01.                     | This documentation branch and [five PR checks](../PULL_REQUEST_TEMPLATE.md); no nonexistent helper dependency.           |

## Existing work and exclusions

These links preserve the original contributions and avoid duplicate implementations.

| Ticket(s)          | Repository evidence / disposition                                                                                                                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F02                | Mouse/focus parity and lint enforcement already merged in [#118](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/118); its PR labels this work L01, while the workbook uses F02.                                                                                                         |
| COLOUR01           | Status text alternative merged in [#175](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/175).                                                                                                                                                                                           |
| COLOUR03           | Completed in [#212](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/212), superseding closed [#191](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/191). Fix is on the rendered unit task list, not the unused task-list-item. Workbook "In progress" is stale.          |
| FORM03             | Search naming merged in [#238](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/238). Existing empty-template specs do not by themselves prove the changed HTML.                                                                                                                          |
| FORM06             | Input purposes merged in [#170](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/170), with later profile work preserving identity behaviour.                                                                                                                                             |
| KB05, NAME02, SR04 | PDF controls, viewer names and empty-state text merged in [#177](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/177), [#174](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/174) and [#225](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/225).        |
| LINT01 / MAINT01   | About dialog brought under lint in [#165](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/165); this is distinct from removing the eight remaining legacy templates.                                                                                                                     |
| L01, A02, U01      | Workbook marks leadership/keyboard audit/inclusive-UX review completed; no corresponding fresh approval or independent audit report is asserted by this PR.                                                                                                                                             |
| A01, A03, A04      | Audit evidence only, outside the requested GitHub implementation scope. Source inspection informs this register; it cannot substitute for a screen-reader, device or visual audit. New lint totals must be reported for the actual SHA, never copied from the August count of 78.                       |
| D01, V01           | D01 is already proposed in #243. V01 is merged in #239 but explicitly has outstanding independent UX validation. Do not duplicate either document or erase its limitations.                                                                                                                             |
| PPI / Theme        | [PPI #245](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/245) owns its widget label. [Theme #244](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/244) owns student theme migration and touches task/comment styles. Preserve both changes when reviewing shared files. |

No API or deploy behaviour is required by these confirmed frontend findings. The API template belongs to the cross-repository ON standardisation work; a conditional mirror is not needed to deliver the web checklist. Planner updates, team messages, role assignment, independent participant testing and merge decisions remain outside this GitHub-only handover.

## Dependency and conflict handling

Start all independent changes from the recorded `11.0.x` baseline. Keep label, keyboard, status/motion/menu and documentation changes in separate reviewable commits. Because label and keyboard enforcement share `eslint.config.js`, preserve all four enabled rules when combining the patches; do not overwrite another change with an older file. Shared fixes precede student/staff journey validation, then final CI results and documentation updates.

The closed UI PRs [#230](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/230) and [#232](https://github.com/ontrack-features-t2-2026/doubtfire-web/pull/232) were incorporated into `integration/t2-2026` at `8fcf4135a31e639ef47e652a3834ba0b91d45561`, not merged into this `11.0.x` baseline. That branch is 474 commits ahead and four behind at this snapshot and contains a broad unrelated UI rewrite. Do not import it wholesale or claim its checks validate these PRs. It has overlapping names, home navigation, theme contrast and motion work; keep equivalent fixes when a maintainer eventually integrates the branches.

## Known limitations and future validation

| ID / priority                    | Route / impact                                                                                                         | Evidence                                                                                              | Owner and next action                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| V01-D01 / P2                     | Task Sheet: narrow PDF search visual glitches; search remained usable in the recorded run.                             | [Historical V01 observation](../A11Y-V01-validation-notes.md#d01-mobile-pdf-search-box-visual-issue). | PDF viewer owner unassigned; reproduce against the final fix SHA at the recorded viewport and record result.   |
| V01-UX / unvalidated             | Four core tasks need two independent reviewer runs; no participant results in this handover.                           | V01 section 6.                                                                                        | Accessibility tester; use U1 and attach sanitised observations. This remains an acceptance dependency.         |
| AT-JOURNEYS / unvalidated        | Student/staff screen-reader, mobile assistive technology, zoom and error-recovery behaviour after the new changes.     | New pack supplies procedure, not evidence.                                                            | Independent tester; run ST/SF with named browser/OS/AT versions, record failures and triage P0/P1 immediately. |
| EXTERNAL-CONTENT / feature-owned | Uploaded PDF, SCORM and similarity-report internals may contain accessibility defects despite correctly titled frames. | Host iframe semantics cannot validate document/content internals.                                     | FILE/SCORM/content owners; audit synthetic content and record specific limitations.                            |
| THEME-VISUAL / shared            | Theme migration changes backgrounds and can affect otherwise valid contrast pairs.                                     | Open #244 and historical V01 dashboard observation.                                                   | Theme + Accessibility; remeasure actual state pairs after integration, including focus and disabled states.    |

## Review and evidence index

- **Repository work prepared:** [authoring guide](AUTHORING.md), [regression pack](REGRESSION.md), this register and the PR checklist. Proposed code branches above require their own linked tests and PR review; a branch name is not a merge or a passing result.
- **Existing evidence:** linked merged PRs and V01 notes, each limited to its own code/environment. D01 remains an open PR at this snapshot.
- **Final evidence to attach to implementation PRs:** web/API/deploy SHAs; full lint/typecheck/build/test results; targeted rendered accessibility tests; relevant manual test IDs with Pass/Fail/Not run; measured contrast pairs; sanitised screenshots/recordings; fix-to-finding links.
- **Review still required:** one developer and tester walkthrough of this pack, independent U1 runs, and maintainer review/approval of code and scope. No self-merge or approval is recorded here. Unrun human validation must remain explicit in the final handover.

The GitHub additions can be reviewed without claiming completion of off-repository audit, participant or leadership activities. Update this register with final PR URLs and any additional observed defects during review; only mark a finding fixed-confirmed when its recorded re-test actually passes.
