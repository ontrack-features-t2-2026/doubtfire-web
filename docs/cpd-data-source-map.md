**Cross-unit Dashboard (CPD): Data Sources & Ownership Rules**

**Purpose:** Provide frontend, backend, and security contributors with a
single source of truth regarding dashboard data sources, role
permissions, and cross-unit visibility rules.

**Field-to-Source Mapping Table**

This table maps user-facing fields on the Cross-unit Dashboard to their
underlying backend services and models:
| Dashboard Field / Element | Angular Component / Data Binding | API Endpoint & Method | Backend Model / Entity | Access Scope & Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Unit Code & Name** | `DashboardUnit.code`, `DashboardUnit.name` | `GET /projects` | `Unit#code`, `Unit#name` via `Project.eager_load(:unit)` | Authenticated Student (`for_user current_user`) |
| **Task Title & Subtitle** | `DashboardTask.title`, `DashboardTask.subtitle` | `GET /projects` (`include_task_definitions=true`) | `TaskDefinition#name`, `TaskDefinition#abbreviation`, `TaskDefinition#targetGradeText` | Authenticated Student (`current_user`) |
| **Task Description** | `DashboardTask.description` | `GET /projects` (`include_task_definitions=true`) | `TaskDefinition#description` | Authenticated Student (`current_user`) |
| **Task Status & Color** | `DashboardTask.status`, `statusLabel`, `color` | `GET /projects` | `Task#status`, mapped via `TaskStatus.STATUS_LABELS/COLORS` | Authenticated Student (`current_user`) |
| **New Comments Count** | `DashboardTask.comments` | `GET /projects` | `Task#numNewComments` | Authenticated Student (`current_user`) |
| **Due Date** | `DashboardTask.dueDate` | `GET /projects` | `Task#localDueDate()` (personal plan, grade date, or extension-aware fallback) | Authenticated Student (`current_user`) |
| **Task Weight / Priority** | `DashboardTask.weight` | `GET /projects` | `Task#topWeight` (calculated via `project.calcTopTasks()`) | Authenticated Student (`current_user`) |
| **Recommended Priority Score** | `TaskRecommendation.priority_score` | `GET /tasks/recommended` | Effective task due date, task-definition weighting, and active workload | Authenticated Student (`current_user`) |
| **Project ID / Unit Key** | `DashboardUnit.projectId` | `GET /projects` | `Project#id` | Authenticated Student (`current_user`) |

**Data Ownership, Enrolment & Visibility Rules**

**Active vs. Inactive Enrolment Filtering**

- **Backend Inactive Toggle:** GET /projects accepts an optional query
  parameter. By default (false), only active unit projects for
  current_user are fetched.

- **Frontend Active Task Scope:** CrossDashboardComponent populates
  unit tasks via project.activeTasks(). The default Active scope shows
  current units; Previous and All scopes load inactive enrolments on
  demand with `include_inactive=true` and keep per-unit search, filter,
  and sort state.

**Client-Side State, Filtering & Sorting Rules**

- **Hide Completed Filter (Filter.HideCompleted):** Managed via
  private filters: Map\<number, Filter\[\]\>. When active, tasks with
  task.status == \'complete\' (completedTypes) are removed from
  unitsProcessed.

- **Default Task Ordering:** In all sort modes, tasks in a final state
  are pushed below work that still needs action.

- **Due Date Sort (SortMode.SubmissionDate):** Orders active tasks
  chronologically using a.dueDate.getTime() - b.dueDate.getTime()
  (`Task#localDueDate()`).

- **Required API Date Contract:** [API PR #59](https://github.com/ontrack-features-t2-2026/doubtfire-api/pull/59)
  must land before [API PR #61](https://github.com/ontrack-features-t2-2026/doubtfire-api/pull/61).
  Together they provide the student-safe task-definition payload plus
  `allow_flexible_dates` and `grade_due_dates`; the dashboard needs those
  fields for virtual tasks to calculate the same effective local due date
  as the recommendation endpoint.

- **Default Weight Sort (SortMode.Default):** Orders tasks by
  calculated priority weight using a.weight - b.weight
  (Task#topWeight).

- **Recommended Sort (SortMode.Recommended):** Loads every page of the
  authenticated student's recommendation set and orders tasks by descending
  priority score. Scores are keyed by project and task
  definition so assigned tasks that have not yet created a Task row are
  still recommended. The score combines effective-deadline urgency (60%),
  task-specific workload due by that deadline (25%), mapped on a fixed
  curve where five full-project percentage points per day scores 50, and
  task weighting as a share of all assigned project work (15%). Final,
  waiting-for-feedback, and prerequisite-blocked tasks are not scored.
  Tasks without a score use the existing
  Task#topWeight order as a deterministic fallback.

**Role-Based Access Control & Data Isolation**

- **Student Access:** All dashboard data subscriptions execute through
  GlobalStateService.currentUserProjects, which calls ProjectsApi
  endpoints protected by authenticated?. Queries are strictly scoped
  to the authenticated session (for_user current_user).

- **Write Safeguards:** Modifying target grades or submitted grades
  via PUT /projects/:id is restricted once portfolio_exists? evaluates
  to true (returns HTTP 403 Forbidden).

**Technical Gaps**

During this documentation audit, the following technical gaps were
identified directly in the source code:

1.  **In-Memory Filtering & Performance:** Task filtering (Hide
    Completed) and sorting are processed entirely client-side on the
    Angular main thread (this.unitsProcessed = this.units.map(\...)).
    Heavy task volumes across multiple units may impact frontend
    rendering performance.

**Data-Flow Diagram**

```text
                   [ CrossDashboardComponent ]
                    /          |           \
                   /           |            \
                  v            v             v
 [ currentUserProjects ] [ Previous/All ] [ taskStatusUpdated$ ]
          |                    |                    |
          | GET /projects     | GET /projects     | refresh current
          | active + task     | include_inactive  | task snapshots
          | definitions       | + definitions     |
          +--------------------+--------------------+
                               |
                               v
               [ mapProjects() and mapTasks() ]
                               |
                               | task.localDueDate()
                               v
                    [ processTasks() ]
                               ^
                               |
          GET /tasks/recommended?page=N&per_page=50
          (all pages combined; latest request wins)
                               |
                               v
             [ project + task-definition scores ]
                               |
                               v
                 [ Rendered Dashboard Unit Cards ]
```

**Recommended Follow-Up Tickets**

- **Monitor Large Cross-Unit Cohorts:** If real student task volumes make
  client-side filtering or sorting measurable, profile the dashboard and
  consider moving only the expensive operations server-side.

- **Maintain the Cross-Repository Contract:** Keep automated coverage for
  paginated recommendation aggregation, student-safe task definitions,
  flexible-date metadata, virtual task keys, and personalised due dates.
