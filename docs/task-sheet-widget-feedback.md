# PPI-DO3: Proof Of Concept, Feedback and Design Evaluation

**Ticket:** PPI-D03 - Gather feedback and document the task-sheet PPI design decisions
**Branch:** `docs/ppi-task-sheet-widget-feedback`
**Group:** Feature/Peer Progress Indicator
**Resource:** `PPI-task-sheet-widget-v1.png`
**Resource Attribution:** Eloise Ridder-Strickland

![[images/PPI-task-sheet-widget-v1.png]]

**Purpose**
> To Identify design recommendations for the development of the Peer Progress Indicator widget, in line with user, stakeholder and project scope/expectations and accessibility, usability and style guidelines. 

### Implementation status
*Proof of concept* - Does not claim a live unit-level component or API is implemented or pre-exists.

### Acceptance Criteria Coverage

|       | Requirement                                                                                                                          | Result | Evidence                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------- |
| `1.`  | The original ticket, mock-up and author are clearly identified.                                                                      | *Met*  | Header (Above)                                                             |
| `2.`  | At least two people review the design. A third reviewer is encouraged but not required.                                              | *Met*  | Maple Fox, Timothy Mifsud, David Tenni                                     |
| `3.`  | One reviewer represents implementation or technical knowledge and one represents likely users, tutors, UX or documentation.          | *Met*  | Section 2                                                                  |
| `4.`  | The same core questions are used for each review.                                                                                    | *Met*  | Section 1.2                                                                |
| `5.`  | The Markdown file clearly separates reviewer feedback from Eloise's conclusions.                                                     | *Met*  | Labelled according to section requirements                                 |
| `6.`  | The evidence does not expose student IDs, marks, feedback, progress records or other unnecessary personal information.               | *Met*  | Deidentified data collected through anonymous surveying. (Section 1.2-1.3) |
| `7.`  | The review covers clarity, placement, usefulness, anonymity, accessibility, possible stress or competition, and the user preference. | *Met*  | Section 4                                                                  |
| `8.`  | Each suggested change is marked as accepted, deferred or not adopted, with a short reason.                                           | *Met*  | Section 3                                                                  |
| `9.`  | Any revised design is optional and does not block completion.                                                                        | *Met*  | Section 6                                                                  |
| `10.` | If a revision is made, the original image remains in the repository so the design history is preserved.                              | *Met*  | Refer to `PPI-task-sheet-widget-v1.png` under `/images'                    |
| `11.` | The documentation does not claim that the design has been implemented or connected to live data.                                     |        | Refer to 'Implementation status' (Above)                                   |
| `12.` | The pull request links the original Planner ticket, this follow-up ticket and the supporting evidence.                               | *Met*  | Section 7                                                                  |
## 1. Methodology
---
### 1.2 Techniques

Three evaluation techniques were used to evaluate the proposed design
1. **Verbal discussion** within group meetings prior to the development of Mock-ups (With Project Director and Mentors): [Ontrack - Sprint Planning (Fortnightly)](https://deakin365.sharepoint.com/:v:/r/sites/ThothTech2/Shared%20Documents/Product%20-%20OnTrack/Recordings/Ontrack%20-%20Sprint%20Planning%20\(Fortnightly\)-20260720_180013-Meeting%20Recording.mp4?d=w0b96f239856c4927b309d448a06b7e8c&csf=1&web=1&e=e0uYqS&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D)
2. **Open group discussion** after the initial Mock-up designs (Teams).

![[images/teams-review-doc.png]]

3. **A survey** with the following evaluation questions: [Peer Progress Indicator Mock-up Evaluation](https://docs.google.com/forms/d/e/1FAIpQLSeXGCQzNpgdOlEv686l91L1ko58_SnHXD6obsdpx---WXpTzA/viewform?usp=dialog)
### 1.3 Evaluation Questions

##### Feedback Profile
1. From which Features Group are you apart of?
2. Do you have previous UI or General design experience? (Yes/No)
##### Context & Design
3. (Indicator) Without context what do you think the primary purpose of the Peer Progress indicator is showing?
4. (Indicator) Which Indicator design option is more useful/comfortable to view, and why?
5. ~~(Placement) Which placement option is more useful/comfortable to view, and why?~~ - *Redundant Question*
6. (Placement) Which placement is easiest to notice and understand without cluttering the sheet?
##### Accessibility & Privacy
7. Is it clear that this is an anonymous cohort value (not a ranking)?
8. Is the preference option clear for users who don't want to see peer progress?
9. (Optional) If this feature were available, would you choose to opt-in or opt-out?
10. (Short answer) (Optional) For what reason would you opt-in or opt-out?
##### General Considerations
11. Are there any accessibility concerns not addressed in the Mock-ups?
12. Is the inclusion of an On/Off toggle within the profile's menu appropriate, could you suggest an alternative?
13. ~~(Unused) What is the single most useful improvement you would make?~~ - *Was overlooked*

## 2. Aggregated Feedback Summary
---
The following are extracts of de-identified responses taken from the survey & team communications on the *PPI-task-sheet-widget-v1.png*. These consisted of reviewers in three categories.

- A **PPI contributor**.
- A **technical reviewer** familiar with *design principles*.
- An **anonymous** individual representing the *end-user*.

![[images/survey-distribution-chart.png]]

| Strength                                                                           | Concerns                                                                                                                                                     | Suggestion                                                                                                                         |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Option B - it gives a clearer outline.                                             | Option B - gives a lot more information but could scare people who aren't ready to see a lot of information.                                                 | Option A - with a toggle for Option B called 'Advanced'. for people who would like to see an advanced view (Option B).             |
| Option B - the data is helpful for me.                                             | Option B - could cause issues for subjects that have tutors that mark stuff really quickly and others that don't so it might cause undue stress on students. | An overall dark mode would be very interesting / helpful                                                                           |
| Placement 1 - the information is where you want it when scanning over a page.      | 'InProgress' aren't used by many students so it's not useful data.                                                                                           | Having the Opt-In/Opt-out in the same area as the 'placement' would likely be easier for most/all students as it's simple to find. |
| Placement 1 - does not over cutter the reading space.                              | Option B - I don't think it would be practical to share that much information with students.                                                                 | As far as placement goes I think 1 or 3.                                                                                           |
| Opt-in, because it is useful and clear.                                            | Example Toggle - The wording is wrong, we won't have an opt-out for statistics.                                                                              | Option B - looks good but I think that's more of a stretch goal.                                                                   |
| Opt-in, I'd would like see the data & would want others to benefit off it as well. | The indicator itself might give some students anxiety because they feel behind.                                                                              |                                                                                                                                    |
| It is a good feature and is appropriate.                                           |                                                                                                                                                              |                                                                                                                                    |
| I'm a big fan of Option B, Mock-up 2 placement and the toggle.                     |                                                                                                                                                              |                                                                                                                                    |
| If people don't like it they can just turn it off.                                 |                                                                                                                                                              |                                                                                                                                    |
## 3. Decision Table 
---
Feedback Status (Including Reasoning)

| Status       | Comment                                                                                                                                                        | Personal Rational                                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Accepted** | *Placement 1 - the information is where you want it when scanning over a page.*                                                                                | Ideal location, central but contextually relevant. Given the widget can be hidden at the user's discretion, there is no point hiding it. |
|              | *Placement 1 - does not over cutter the reading space.*                                                                                                        | Demonstrates that it is not intrusive to look at.                                                                                        |
|              | *If people don't like it they can just turn it off.*                                                                                                           | Implementation requires a toggle for student wellbeing and stress management.                                                            |
|              | *Option B - it gives a clearer outline.*                                                                                                                       | Clarity of design.                                                                                                                       |
|              | *'InProgress' aren't used by many students so it's not useful data.*                                                                                           | 'InProgress' is not a meaningful metric, and should be excluded.                                                                         |
|              | *Having the Opt-In/Opt-out in the same area as the 'placement' would likely be easier for most/all students as it's simple to find.*                           | Clarity, connecting the toggle to the feature makes it simple for students to opt-out of seeing it.                                      |
| **Deferred** | *Option A - with a toggle for Option B called 'Advanced'. for people who would like to see an advanced view (Option B).*                                       | Out of scope - potential stretch goal.                                                                                                   |
|              | *Example Toggle - The wording is wrong, we won't have an opt-out for statistics.*                                                                              | Not relevant, the mock-up was only a proof of concept, however noting that there is no opting out of statistic all together is relevant. |
|              | *I'm a big fan of Option B, Mock-up 2 placement and the toggle.*                                                                                               | Mock-up Placement 2                                                                                                                      |
|              | *An overall dark mode would be very interesting / helpful*                                                                                                     | Out of scope for the proposed feature.                                                                                                   |
|              | *Option B - looks good but I think that's more of a stretch goal.*                                                                                             | Option A provides a template to extend to Option B, this could therefore be a stretch goal.                                              |
| **Rejected** | *Option B - gives a lot more information but could scare people who aren't ready to see a lot of information.*                                                 | A toggle is required to activate or deactivate the panel/component.                                                                      |
|              | *It is a good feature and is appropriate.*                                                                                                                     | Unspecific.                                                                                                                              |
|              | *Option B - the data is helpful for me.*                                                                                                                       | Personal relevance but does not necessarily represent a broader opinion.                                                                 |
|              | *Opt-in, because it is useful and clear.*                                                                                                                      | demonstrates concept clarity and usefulness but is unspecific.                                                                           |
|              | *Option B - could cause issues for subjects that have tutors that mark stuff really quickly and others that don't so it might cause undue stress on students.* | Not relevant, students will be able to toggle off progress metrics, at there discretion.                                                 |
|              | *Option B - I don't think it would be practical to share that much information with students.*                                                                 | Personal preference, some students might value more information over others.                                                             |
|              | *The indicator itself might give some students anxiety because they feel behind.*                                                                              | A valid concern but rejected based on the earlier addressed user exclusion preference.                                                   |
|              | *As far as placement goes I think 1 or 3.*                                                                                                                     | Unspecific.                                                                                                                              |
|              | *Opt-in, I'd would like see the data & would want others to benefit off it as well.*                                                                           | Personal relevance but does not necessarily represent a broader opinion.                                                                 |

## 4. Impact Consideration Summary
---

|                     | Functional Considerations                                                                                                                        | Non-Functional Considerations                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Clarity**         | Simple binary metric (Option A) Vs. detailed breakdown showing stage statuses (Option B).                                                        | Reduce visual clutter and complexity by integrating the widget into an existing panel (Mock-up 03/04).                                                      |
|                     | Tooltips displaying specific percentage breakdowns when hovering over progress segments (Option B).                                              | Colour consistency for instant recognition of breakdown segments taken from existing OnTrack infrastructure (Option B).                                     |
| **Placement**       | Positioning options: Top/Centre layout (Mock-up 01), below the submission panel (Mock-up 02), or integrated into side/top panes (Mock-up 03/04). | Non-disruptive placement to ensure the primary submission workflow remains central.                                                                         |
|                     |                                                                                                                                                  | Contextual relevance - placing progress indicator near related components.                                                                                  |
| **Usefulness**      | Provides accurate, real-time benchmarks comparing individual task progress against an anonymous class average.                                   | Self-motivation and progress reassurance for overall class standing and task difficulty.                                                                    |
|                     | Helps gauge pacing and time management for specific tasks.                                                                                       |                                                                                                                                                             |
| **Anonymity**       | Aggregated percentage metrics - deidentifying individual students.                                                                               | Psychological safety - ensuring students are not targeted individually, exposed or judged by peers.                                                         |
| **Accessibility**   | High-contrast, alt-text and screen reader support for all text, graphics and metrics.                                                            | Cater for users with ocular disabilities, using distinctive colours, patterns, signatures and tooltips.                                                     |
| **Wellbeing**       | Clear awareness of deadline pace and peer progress millstones.                                                                                   | Possible Stress/Competition - fears of being behind/slower then the cohort when seeing peer completion rates.                                               |
|                     |                                                                                                                                                  | Risk of false sense of security if the rest of the class hasn't 'started' yet.                                                                              |
| **User Preference** | Allow students to 'Opt-in' or 'Opt-out' either within the settings window, or locally on the panel itself.                                       | Encourages autonomy and agency, empowering students to manage there wellbeing and 'Opt-out' if statistics negatively impact mental health, focus or stress. |

## 5. Summary Of Findings
---
Based on the feedback, concepts to adopt include:
- **Placement 1** - the location places information naturally where students scan, it is both central and contextually relevant without overly cluttering the reading space or disrupting the primary submission workflow.
- **Option A** - While *Option B* received a notably positive reception, Option A provides a realistic baseline to either transition to Option B or integrate an 'Advanced View' feature as a stretch goal.
- **Local Opt-In/Opt-Out** - The toggle should be placed within/on the widget itself for clarity and ease of access, protecting aspects of health related to stress and focus and to support student agency. 
- **Exclude unnecessary/uninformative metrics** - Omit statistics such as 'InProgress' as students do not benefit from such information.

Things to avoid;
- **Placement 2** - Where the PPI is below the main submission panel. It makes it redundant given student can opt to hide the pane and rejected in favour of central *Placement 1*.
- **Global Statistical Opt-Out** - Reject any wording that suggests students can opt out of underlying data collection/statistic entirely, the toggle purely controls local widget visibility.
- **Mandatory/Persistent Display** - Reject a static view where no hide option exists, as this could have a negative effect on peer progress and induce stress/anxiety or a false sense of security for some students. 

### Implementation Notes

> **User Agency & Wellbeing:** Ensure a binary toggle is directly accessible on or next to the component so students can instantly opt-out of viewing cohort metrics locally.
    
> **Data Metrics:** Calculate aggregate percentage metrics for cohort completion while filtering out irrelevant statuses.
    
> **Accessibility Standards:** Build high-contrast visual cues, alt-text/screen reader support, and hover tooltips for segment percentages where applicable.

## 6. Hand Over & Recommendations

1. **Implement Option A** as the baseline template, keeping Option B or an "Advanced View" toggle as a potential future stretch goal.
2. **Ensure correct Interface Wording:** - Ensure the implementation text clarifies that the toggling hides the _visual widget_, rather than opting out of statistical cohort data gathering.
3. **Develop the placement 1** layout component containing the local toggle and test its integration alongside existing submission workflows.

## 7. Reference Links 
---
*Links* 
- [Planner - PPI-D03 - Gather feedback and document the task-sheet PPI design decisions](https://teams.microsoft.com/l/entity/com.microsoft.teamspace.tab.planner/planner.v1.df787fb0-1a0b-4bb5-9bc9-9b92a428eb13_p_KuipOoIL0E-7orl64gLd0cgAGv3z?tenantId=d02378ec-1688-46d5-8540-1c28b5f470f6&webUrl=https%3A%2F%2Ftasks.teams.microsoft.com%2Fteamsui%2FpersonalApp%2Falltasklists&context=%7B%22subEntityId%22%3A%22%2Fv1%2Fplan%2FKuipOoIL0E-7orl64gLd0cgAGv3z%2Fview%2Fboard%2Ftask%2FU0BJo6N2Mkq_kw3IYFFWuMgAAM_I%22%2C%22channelId%22%3A%2219%3Abd20175d09414f079490a2403f7fca74%40thread.tacv2%22%7D)
- [Planner - PPI - Draft a small task-sheet indicator/widget interactions](https://teams.microsoft.com/l/entity/com.microsoft.teamspace.tab.planner/planner.v1.df787fb0-1a0b-4bb5-9bc9-9b92a428eb13_p_KuipOoIL0E-7orl64gLd0cgAGv3z?tenantId=d02378ec-1688-46d5-8540-1c28b5f470f6&webUrl=https%3A%2F%2Ftasks.teams.microsoft.com%2Fteamsui%2FpersonalApp%2Falltasklists&context=%7B%22subEntityId%22%3A%22%2Fv1%2Fplan%2FKuipOoIL0E-7orl64gLd0cgAGv3z%2Fview%2Fboard%2Ftask%2FYQjP6F8GfkaDmq5IgUryQcgAL9Ay%22%2C%22channelId%22%3A%2219%3Abd20175d09414f079490a2403f7fca74%40thread.tacv2%22%7D)
