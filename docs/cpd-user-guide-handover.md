# Cross-Project Dashboard: User Guide & Contributor Handover

This document serves as the primary user guide for students interacting with the Cross-Project Dashboard and a handover reference for future developers maintaining the `feature/cross-unit` branch.

---

## Part 1: Student User Guide

### 1. Unit Scopes
The dashboard allows students to filter visible projects using the **Unit scope** dropdown. 
* **Active units:** Displays currently enrolled and active projects[cite: 2].
* **Previous units:** Displays completed or archived projects from past teaching periods. If no historical data exists, a "No previous units are available" message is displayed[cite: 2].
* **All units:** Combines both active and previous units into a single consolidated view.

![Unit Scope Dropdown](assets/unit-scope-dropdown.png)

### 2. Searching and Filtering
The dashboard features a global toolbar to filter tasks across all visible units.
* **Global Search:** Filters tasks across all units by matching text in the task name or description. 
* **Task Statuses:** A dropdown to filter tasks by current state (e.g., Redo, Resubmit, Complete).
* **Target Grades:** A dropdown to filter tasks by their target grade tier (e.g., Pass, Credit, Distinction, High Distinction).
* **Date Filters:** Start and End date pickers to isolate tasks due within a specific timeframe.
* **Clear Controls:** The "Clear all" button resets global search, status, and grade filters, while "Clear dates" specifically resets the date range boundaries.
* **Empty States:** If filter combinations yield no results, the interface cleanly displays "No tasks match the current global search and filters." or "No tasks are available.".

![Global Search and Filters](assets/global-filters.png)

### 3. Grade Completion Summaries
Each unit card displays a **Grade task completion** summary, outlining progress per target grade tier. 
* It displays counts and percentages, such as "Pass: 1 of 3 complete (33%)".
* **Important Note:** These percentages strictly represent *task completion counts* against the total tasks in that grade tier. They are **not** predicted final grades or official academic marks.

### 4. Due Date Warnings & Limitations
The dashboard provides visual urgency indicators for approaching task deadlines.
* **Overdue:** Displayed in red.
* **Within 24 Hours:** Displayed in orange.
* **Within 3 Days:** Displayed in yellow.
* **Within 7 Days:** Displayed in blue.

**Confirmed Limitation (Extension Dates):** The current warning logic calculates due dates based solely on the base unit task target date. It does *not* currently factor in individual student granted extension dates. Consequently, tasks with an approved future extension date may incorrectly display an "Overdue" or urgent warning badge.

### 5. Accessibility
* **Keyboard Navigation:** Interactive chart elements and filter controls feature high-visibility focus indicators (`:focus-visible` with a solid blue outline) for keyboard-only users.
* **Screen Readers:** Dynamic `aria-label` attributes clearly announce warning states (overdue, within 3 days) and toggle states (Expand/Collapse task list). Purely visual elements like chart color swatches are hidden using `aria-hidden="true"`.
* **Non-Colour Meaning:** Warning states and legends utilize distinct text labels and interactive grouping (`role="group"`) to ensure meaning is not conveyed by color alone.

### 6. Authorized Data Boundary (Privacy)
The Cross-Project Dashboard adheres to strict data visibility boundaries. 
* It **only** displays task statuses, target dates, and definitions for units the authenticated student is explicitly enrolled in.
* It **does not** introduce or display official numerical marks, staff feedback comments, peer assessment information, or data from unauthorized units. 

---

## Part 2: Contributor Handover

### 1. Architecture & Key Files
* **Target Branch:** `feature/cross-unit`
* **Main Component:** `f-cross-dashboard.component.ts` handles global toolbar filtering, grade completion summarization, and unit scope state management.
* **Test Suite:** `f-cross-dashboard.component.spec.ts` verifies the two-tier task filtering logic, unit visibility based on active filters, and grade completion calculations. 

### 2. Linked Tickets & Context
* **CPD-F04:** Implemented a local frontend date-range filter working alongside unit scopes and existing task data.
* **CPD-F05:** Added accessible global toolbar date-range controls with targeted testing.
* **CPD-Q03:** Integrated accessible due-date warning badges into the dashboard task presentation.
* **CPD-Q04:** Resolved responsive-sizing issues with regression tests and visual evidence.
* **CPD-Q05:** Validated the UI via a wireframe-to-implementation comparison matrix.

### 3. Known Gaps & Post-MVP Work
The following items are documented limitations and represent planned post-MVP work. They are **not** currently complete:
1. **Extension Date Override:** The `getDueDateWarning()` method needs updating to evaluate individual student `granted_extension` records before falling back to the base target date to prevent false Overdue warnings.
2. **Visualisation Scale:** With fixed maximum heights removed in PR #61 to prevent clipping, high volumes of tasks can cause excessive vertical scrolling. Future work should introduce adaptive scale controls or compact toggles.
3. **Filter Persistency:** Global toolbar filter states currently reset upon session refresh. Future work should persist user preferences via local storage or account settings.