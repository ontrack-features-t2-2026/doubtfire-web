# Actual CAL101 downloads

These six files were downloaded through the real application's Download options dialog on 21 September 2026 using the [synthetic fixture](../environment.md). They are byte-for-byte copies of the browser downloads, not separately generated examples.

| File | Options | Events | Task membership |
| --- | --- | ---: | --- |
| [CAL101-tasks-P.ics](CAL101-tasks-P.ics) | Pass, up to, exclusion off | 1 | 1P |
| [CAL101-tasks-C.ics](CAL101-tasks-C.ics) | Credit, up to, exclusion off | 2 | 1P, 2C |
| [CAL101-tasks-D.ics](CAL101-tasks-D.ics) | Distinction, up to, exclusion off | 3 | 1P, 2C, 3D |
| [CAL101-tasks-HD.ics](CAL101-tasks-HD.ics) | High Distinction, up to, exclusion off | 4 | 1P, 2C, 3D, 4HD |
| [CAL101-tasks-HD-and-above.ics](CAL101-tasks-HD-and-above.ics) | High Distinction, this grade and above, exclusion off | 1 | 4HD |
| [CAL101-tasks-HD-outstanding.ics](CAL101-tasks-HD-outstanding.ics) | High Distinction, up to, exclusion on | 2 | 3D, 4HD |

All six passed a file-level check of exact task membership, counts, summaries, due dates, exclusive all-day end dates, unique UIDs, metadata, and CRLF line endings. [validation.json](validation.json) records the observed events and SHA-256 checksums. This validates the actual exported bytes; calendar-client import results are recorded separately.

The remaining two tasks in the outstanding-only download are **Redo** and **Fix and Resubmit**. The **Ready for Feedback** and **Complete** tasks are absent. The empty **Pass + exclusion on** case intentionally produces no file because Download is disabled; its evidence is the dialog screenshot.
