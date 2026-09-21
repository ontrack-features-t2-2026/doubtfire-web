# CAL-A01: Calendar accessibility verification

## Changes and automated evidence

The download options dialog focuses its first control (Grade) when it opens. Material supplies the focus trap, Escape handling and focus restoration. The result count and empty-result message share a persistent `role="status"` region, so changing a filter can announce whether a download is available. Decorative icons are hidden from the accessibility tree.

The Web calendar switch, loading spinner and reminder save/cancel actions have explicit accessible names. Included units use ordinary chips with named native removal buttons; the add-unit menu has a visible **Add unit** button. These actions retain their saving guards. The subscription link, copy and regenerate controls retain their separate names and behaviors.

`calendar-modal.component.spec.ts` renders the actual Material chips, menu trigger and switch and checks names, removal activation and disabled states. `download-filter-dialog.component.spec.ts` checks the live result region and empty state. `task-planner-card.component.spec.ts` checks the initial-focus configuration along with the grade/status/date download guards.

These are DOM/component checks. They do not establish screen-reader output, rendered contrast, browser Tab order or a completed manual accessibility audit.

## Manual validation still to record

Use synthetic student data. Record browser, OS and screen-reader versions, date, viewport and the commit tested. Do not put real subscription tokens in recordings.

1. Tab to **Download .ics**, press Enter and confirm Grade receives focus. Change each grade with the keyboard, change Grade range and the submission checkbox, and confirm the count is announced once after each change.
2. Select a zero-result combination. Confirm the explanation is announced and Download is disabled. Restore a valid selection and download with Enter/Space.
3. Open again and press Escape. Confirm focus returns to **Download .ics**. Repeat using Cancel.
4. Open Web calendar and toggle it with Space. Confirm the enabled/disabled state is announced. Navigate unit removal, Add unit, reminders, subscription link, Copy, Regenerate, Download a copy and Close without a pointer.
5. Trigger a save and verify disabled controls cannot activate. Check confirmation dialog focus and return focus after cancellation.
6. Repeat at 200% zoom and a phone-width viewport. Check focus visibility, scrolling and no horizontal clipping. Repeat in the supported light/dark themes.

No keyboard-only recording or screen-reader session was performed for this change. Add the recording and observations here after that independent pass; do not mark manual validation complete from automated results alone.
