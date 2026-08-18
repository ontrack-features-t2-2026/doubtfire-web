# PPI-D01: Task-Level Help Text and Privacy Copy

**Ticket:** PPI-D01 — Write the peer-comparison explanation, privacy limits and help text
**Branch:** `docs/ppi-help-privacy`, based on `feature/peer-progress-indicator` *(recommended base branch, not independently confirmed with the team — confirm before merge)*
**Scope:** content/copy only. No widget logic, states, or data flow were changed to produce this doc.

---

## Acceptance criteria coverage

| # | Criterion | Status |
|---|---|---|
| 1 | Label, tooltip, and expanded explanation for task-level and unit-level views | Task-level: met (§3). Unit-level: not applicable — confirmed no unit-level view exists in the codebase (§0) |
| 2 | Explain the value is an anonymous aggregate, not an individual ranking | Met — shared framing in §1, echoed in state-specific copy |
| 3 | Wording for small-cohort suppression, unavailable data, and delayed/stale data | Met (§3.3, §3.4, §3.5) |
| 4 | Plain language, no wording that could shame or pressure students | Met — reassurance framing present across label/tooltip/explanation for every state where a null, zero, or hidden result could otherwise read as evaluative |
| 5 | Map each text block to an exact UI location, plus one annotated screenshot | Location map: met (§2). Annotated screenshot: pending — manual step, not part of this document |

---

## 0. Scope: Task-Level Only — No Unit-Level PPI View Exists

**Confirmed by repo search, not assumed.**

Searched `src/app` for `PeerProgressIndicator`, `peer-progress`, `PpiWidget`, and `ppi-widget` (case-sensitive, to avoid false hits like "mapping" or "shipping" matching a naive case-insensitive `ppi` search). 12 files matched, all of them belonging to the single task-level widget and its supporting service/model/mock:

```
src/app/projects/.../task-description-card/ppi-widget/ppi-widget.component.ts
src/app/projects/.../task-description-card/ppi-widget/ppi-widget.component.html
src/app/projects/.../task-description-card/ppi-widget/ppi-widget.component.spec.ts
src/app/projects/.../task-description-card/task-description-card.component.html
src/app/api/services/peer-progress-indicator.service.ts
src/app/api/services/spec/peer-progress-indicator.service.spec.ts
src/app/api/services/mock/peer-progress-indicator.mock.ts
src/app/api/services/mock/index.ts
src/app/api/models/peer-progress-indicator.ts
src/app/api/models/peer-progress-indicator-state.ts
src/app/api/models/peer-progress-indicator-state.spec.ts
src/app/doubtfire-angular.module.ts
```

A separate search of `src/app/units` (where a unit-level dashboard surface would live) for "peer" returned nothing.

**Conclusion:** there is no unit-level PPI screen in this codebase yet. Acceptance criterion 1 asks for copy covering "both task-level and unit-level views" — the unit-level half is not achievable right now. This doc covers task-level only. **Recommend flagging back to whoever assigned the ticket** rather than inventing copy for a screen that doesn't exist — that would run against the ticket's own "do not redesign the PPI" instruction in spirit.

---

## 0.1 Implementation Note: Tooltip and Expanded-Explanation Text Have No UI Home Yet

The ticket asks for a **label, tooltip, and expanded explanation** per state (three tiers of copy). The widget as it exists today (`ppi-widget.component.html`) only has **one visible text slot per state** — a single `<span>{{ view.message }}</span>` next to an icon. There is no `matTooltip` (or any tooltip mechanism) anywhere in this widget or its parent card, and no expandable/"learn more" panel.

So the drafts below give you all three tiers of copy as requested, but only the "label" tier maps to something that renders today. The tooltip and expanded-explanation tiers are **content ready for a future implementation ticket** to wire up (e.g. `matTooltip` on the icon, and something like a `mat-expansion-panel` or info popover for the long-form text) — not something this documentation-only ticket should build. Flagging this now so it isn't a surprise later.

**Recommendation, applied throughout this doc:** treat Label as new UI — a small heading or icon label — added alongside the existing `{{ view.message }}` text, not a replacement for it. The message text is the data payload (the percentage, or the reason it's hidden); the Label names what the widget is, a separate concern. If a reviewer wants it to replace the current text instead, that's a one-line change at implementation time, not a reason to redo this doc.

---

## 1. Shared framing (applies across every state)

Per acceptance criterion 2 — every state's expanded explanation should reinforce, directly or by implication, that:

> This number is a combined total across a group of students aiming for the same grade. It is never a list of names, never an individual comparison, and never a ranking.

This sentence (or a close variant) is repeated in the states where a percentage is actually shown (Normal, Zero), since that's where a misreading-as-ranking risk is highest.

---

## 2. Location map

| # | State (mock key) | Widget template case | File : line | Trigger condition |
|---|---|---|---|---|
| 1 | Normal (`normal`) | `@case ('success')` | `ppi-widget.component.html:46-52` | `submittedPercentage` is a number > 0 |
| 2 | Zero (`zero`) | `@case ('no-data')` | `ppi-widget.component.html:33-38` | `submittedPercentage === 0` |
| 3 | Suppressed (`suppressed`) | `@case ('hidden')` | `ppi-widget.component.html:27-32` | `isSuppressed === true` |
| 4 | Unavailable (`unavailable`) | `@case ('unavailable')` | `ppi-widget.component.html:15-19` | `submittedPercentage === null` (and not suppressed/stale) |
| 5 | Stale (`stale`) | `@case ('stale')` | `ppi-widget.component.html:39-45` | `isStale === true` |
| 6 | Disabled (`disabled`) | `@case ('disabled')` | `ppi-widget.component.html:21-25` | `isFeatureEnabled === false` |

*Line numbers reflect the file's state at time of writing and will drift if the widget is edited again — treat the `@case` name as the durable reference, line numbers as a point-in-time aid only.*

Widget mount point: `f-ppi-widget` is rendered inside `f-task-description-card`, immediately after `f-task-date-slider`, gated by `showPeerProgress` —
`task-description-card.component.html:16-18`.

Not covered by the six acceptance-criterion states, but present in the actual state machine (`peer-progress-indicator-state.ts`) — flagging for completeness, no copy drafted since they're outside the ticket's named scope:
- `loading` — `ppi-widget.component.html:2-7`, static text "Loading peer progress…"
- `error` — `ppi-widget.component.html:8-14`, generic text "Could not load peer progress. Please try again." plus a Retry button

---

## 3. Copy, state by state

### 3.1 Normal — peers have submitted

**Current copy source:** built from `submittedPercentage` — `"{X}% of peers at your target grade have submitted"`

- **Label:** Peer progress
- **Tooltip:** How many peers aiming for your target grade have submitted this task so far.
- **Expanded explanation:** This shows the combined share of students aiming for the same grade as you who have submitted this task. It's a single group number, not a list of names or a ranking — you can't see who specifically has or hasn't submitted.

*Rationale:* states the number as a fact ("X% have submitted"), not a comparison ("you're behind X%"). No ahead/behind language.

---

### 3.2 Zero — no peers have submitted yet

**Current copy source:** hardcoded client-side string, `"No peer submissions yet"` (`ZERO_PERCENT_STATE.unavailableMessage` is actually an empty string — the component ignores it and shows its own fallback text instead; flagged as an open design question during PPI-F03, still unresolved)

- **Label:** Peer progress
- **Tooltip:** No peers have submitted yet — not a reflection of your own progress.
- **Expanded explanation:** No one aiming for the same grade as you has submitted this task yet. This isn't feedback on your own progress — it just means the group total is currently zero, and it may change as others submit.

*Rationale:* explicitly disclaims that a zero reads as evaluative, now in both the tooltip and the expanded explanation rather than the expanded explanation alone.

**Flag:** worth deciding, separately from this ticket, whether this state should read `unavailableMessage` from the API like every other state does (currently it's the only one of the six with copy hardcoded in the template rather than data-driven).

---

### 3.3 Suppressed — cohort too small

**Current copy source:** `unavailableMessage` = `"Not enough students to show progress."`

- **Label:** Peer progress hidden
- **Tooltip:** Hidden to protect student privacy — too few students in this group.
- **Expanded explanation:** This is hidden because too few students are aiming for this grade to show a group percentage without potentially identifying individuals. This is a privacy safeguard, not an error or a sign that something's missing.

*Rationale:* directly implements the "suppression as protection, not absence" principle — names the actual mechanism (small-cohort re-identification risk) rather than leaving it vague.

---

### 3.4 Unavailable — data missing

**Current copy source:** `unavailableMessage` = `"Progress unavailable."`

- **Label:** Peer progress unavailable
- **Tooltip:** Peer progress data isn't available right now — not a reflection of your own progress.
- **Expanded explanation:** Peer progress information isn't available for this task right now. This is a data issue, not a reflection of your own progress — check back later.

*Rationale:* explicit "data issue, not a progress issue" framing per the starting principles, now present in both tiers rather than the expanded explanation alone.

---

### 3.5 Stale — data outdated

**Current copy source:** `unavailableMessage` = `"Peer progress is currently unavailable."` (reused generic wording) plus a separate hardcoded badge, `"Data may be outdated"`

- **Label:** Peer progress — data outdated
- **Tooltip:** Peer progress data hasn't refreshed recently — not a reflection of your own progress.
- **Expanded explanation:** Peer progress data hasn't updated recently, so it isn't being shown right now rather than risk showing an out-of-date figure. This is a data timing issue, not a reflection of your own progress — check back later for a current number.

*Rationale:* Note the current implementation (`ppi-widget.component.html:39-45`, `peer-progress-indicator-state.ts:43-44`) never actually renders a percentage in this state, even if one exists in the underlying data — the stale check happens before the percentage check, so only the message + badge show. Copy above is written to match what actually renders (no number implied). **Flag:** worth asking the team whether that's intentional; if a stale percentage should ever be shown (e.g. "42% (as of 3 days ago)"), the copy would need to change along with the logic — out of scope for this ticket either way.

**Also flag:** the current `unavailableMessage` for this state ("Peer progress is currently unavailable") is nearly identical to the plain Unavailable state's message, even though they're different situations (no data vs. old data) and already get a distinguishing badge. Recommend the API-side message text be differentiated too, not just the badge — draft expanded explanation above already treats them distinctly, but the actual `message` span will keep showing the old generic string until that's changed.

---

### 3.6 Disabled — feature off for this unit

**Current copy source:** `unavailableMessage` = `"Peer Progress Indicator is disabled for this unit."`

- **Label:** Peer progress off
- **Tooltip:** Your unit coordinator has turned this feature off for this unit.
- **Expanded explanation:** This unit doesn't use the Peer Progress Indicator. Your own progress, submissions, and grading are completely unaffected — this setting only controls whether peer comparison information is shown to students in this unit.

*Rationale:* reassures that a coordinator-level toggle isn't a signal about the student personally, and doesn't imply the feature being off is a loss.

---

## 4. Suggested screenshot pairing

Six widget-state screenshots exist from PPI-F03's verification pass (saved locally at capture time, not in this repo — need to be located and re-attached, not recaptured). Suggested pairing for the annotated screenshot required by acceptance criterion 5:

| Screenshot | Pair with |
|---|---|
| Normal / 42% state | §3.1 |
| Zero/no-data state | §3.2 |
| Suppressed state | §3.3 |
| Unavailable state | §3.4 |
| Stale state | §3.5 |
| Disabled state | §3.6 |

Annotation itself (drawing labels onto the image) is manual/outside this session — this table just maps which shot goes with which copy block.

---

## 5. Recommendations for follow-up

These are findings from reading the code while writing this doc, not uncertainty about the copy itself — the copy is complete. Each one is a decision or fix that belongs to someone other than this ticket.

**For Maple / code review:**

1. **Data-contract defect in already-merged PPI-F03 code.** `STALE_STATE` in `peer-progress-indicator.mock.ts` sets `submittedPercentage: null`, but the interface comment on `PeerProgressIndicator.submittedPercentage` documents null as valid only for suppressed/unavailable/disabled — not stale. Currently latent: the stale template branch never interpolates the percentage, so no "null%" reaches the screen today. Becomes a live bug the moment either the stale UI is enhanced to also show a number, or any other code reads `submittedPercentage` trusting that contract. **Recommend:** fix the mock to carry a real percentage alongside `isStale: true`, or update the interface comment to include `isStale` among the valid-null cases.

2. **Zero state's message is hardcoded, not API-driven** — the only one of the six states where this is true. `ZERO_PERCENT_STATE.unavailableMessage` is an empty string; the component shows its own fallback instead. Pre-existing open question from PPI-F03, still unresolved. **Recommend:** decide whether the mock/backend should supply a real message here, matching how the other five states work.

3. **Stale state's percentage is currently unreachable in the UI** — the `isStale` check fires before the percentage check in the resolver, so `view.data?.submittedPercentage` never renders even when present in the underlying data. Copy in §3.5 is written to match current behavior (no number implied). **Recommend:** if a stale-but-real number should ever display (e.g. "42% (as of 3 days ago)"), that's a template change; the copy would need a matching update at that time.

**For whoever implements this doc's copy into the UI:**

4. Tooltip and expanded-explanation UI don't exist yet (§0.1) — this is copy ready for a future implementation ticket, not something wired up today.