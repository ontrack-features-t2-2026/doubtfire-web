**Cross-unit Dashboard (CPD): Data Sources & Ownership Rules**

**Branch:** docs/cpd-data-source-map

**Purpose:** Provide frontend, backend, and security contributors with a
single source of truth regarding dashboard data sources, role
permissions, cross-unit visibility rules.

**Field-to-Source Mapping Table**

This table maps user-facing fields on the Cross-unit Dashboard to their
underlying backend services and models:

  -------------------------------------------------------------------------------------------------------------------------------
  **Dashboard   **API Endpoint & Method**         **Frontend Component**      **Backend Model / Entity**        **Access Scope &
  Field /                                                                                                       Permissions**
  Data**                                                                                                        
  ------------- --------------------------------- --------------------------- --------------------------------- -----------------
  Unit Code &   GET /projects                     DashboardUnit.code,         Unit#code, Unit#name via          Authenticated
  Name                                            DashboardUnit.name          Project.eager_load(:unit)         Student (for_user
                                                                                                                current_user)

  Task Title &  GET /projects                     DashboardTask.title,        TaskDefinition#name,              Authenticated
  Subtitle      (include_task_definitions=true)   DashboardTask.subtitle      TaskDefinition#abbreviation,      Student
                                                                              TaskDefinition#targetGradeText    (current_user)

  Task          GET /projects                     DashboardTask.description   TaskDefinition#description        Authenticated
  Description   (include_task_definitions=true)                                                                 Student
                                                                                                                (current_user)

  Task Status & GET /projects                     DashboardTask.status,       Task#status, mapped via           Authenticated
  Color                                           statusLabel, color          TaskStatus.STATUS_LABELS/COLORS   Student
                                                                                                                (current_user)

  New Comments  GET /projects                     DashboardTask.comments      Task#numNewComments               Authenticated
  Count                                                                                                         Student
                                                                                                                (current_user).

  Due Date      GET /projects                     DashboardTask.dueDate       TaskDefinition#targetDate         Authenticated
                                                                                                                Student
                                                                                                                (current_user)

  Task Weight / GET /projects                     DashboardTask.weight        Task#topWeight (calculated via    Authenticated
  Priority                                                                    project.calcTopTasks())           Student
                                                                                                                (current_user)

  Project ID /  GET /projects                     DashboardUnit.projectId     Project#id                        Authenticated
  Unit Key                                                                                                      Student
                                                                                                                (current_user)
  -------------------------------------------------------------------------------------------------------------------------------

**Data Ownership, Enrolment & Visibility Rules**

**Active vs. Inactive Enrolment Filtering**

-   **Backend Inactive Toggle:** GET /projects accepts an optional query
    parameter. By default (false), only active unit projects for
    current_user are fetched.

-   **Frontend Active Task Scope:** CrossDashboardComponent populates
    unit tasks via project.activeTasks(), ensuring archived or inactive
    tasks are excluded from the default view.

**Client-Side State, Filtering & Sorting Rules**

-   **Hide Completed Filter (Filter.HideCompleted):** Managed via
    private filters: Map\<number, Filter\[\]\>. When active, tasks with
    task.status == \'complete\' (completedTypes) are removed from
    unitsProcessed.

-   **Default Task Ordering:** In all sort modes, completed tasks are
    pushed to the bottom of the list (completedTypes.includes(a.status)
    evaluation).

-   **Due Date Sort (SortMode.SubmissionDate):** Orders active tasks
    chronologically using a.dueDate.getTime() - b.dueDate.getTime()
    (TaskDefinition#targetDate).

-   **Default Weight Sort (SortMode.Default):** Orders tasks by
    calculated priority weight using a.weight - b.weight
    (Task#topWeight).

**Role-Based Access Control & Data Isolation**

-   **Student Access:** All dashboard data subscriptions execute through
    GlobalStateService.currentUserProjects, which calls ProjectsApi
    endpoints protected by authenticated?. Queries are strictly scoped
    to the authenticated session (for_user current_user).

-   **Write Safeguards:** Modifying target grades or submitted grades
    via PUT /projects/:id is restricted once portfolio_exists? evaluates
    to true (returns HTTP 403 Forbidden).

**Technical Gaps**

During this documentation audit, the following technical gaps were
identified directly in the source code:

1.  **SortMode.Recommended Stub:** In
    CrossDashboardComponent.processTasks(), the recommended sort mode is
    stubbed out with // TODO: Connect to recommender\'s points and
    returns 0. Recommended sorting currently falls back to default
    ordering and is not connected to the backend Task Prioritisation
    Recommender Service.

2.  **In-Memory Filtering & Performance:** Task filtering (Hide
    Completed) and sorting are processed entirely client-side on the
    Angular main thread (this.unitsProcessed = this.units.map(\...)).
    Heavy task volumes across multiple units may impact frontend
    rendering performance.

3.  **Missing Inactive Unit Filter Toggle in UI:** While ProjectsApi
    supports include_inactive: Boolean, CrossDashboardComponent does not
    currently expose an interface control to pass this query parameter
    to GlobalStateService.

**Data-Flow Diagram**

```text
            [  CrossDashboardComponent  ]
                          |
                          | (1) Subscribes to currentUserProjects
                          v
        [ Frontend: GlobalStateService ]
                          |
                          | (2) GET /projects?include_task_definitions=true
                          v
         [ Backend API: ProjectsApi  ]
                          |
                          | (3) Project.eager_load(:unit, :user).for_user(current_user)
                          v
              [ PostgreSQL Database ]
                          |
                          | (4) Represents array via Entities::ProjectEntity
                          v
   [ CrossDashboardComponent: mapProjects() & mapTasks() ]
                          |
                          | (5) In-Memory Filter/Sort via processTasks()
                          v
            [ Rendered Dashboard Unit Cards ]
```

**Recommended Follow-Up Tickets**

-   **Integrate Task Prioritisation Recommender with
    SortMode.Recommended:** Connect SortMode.Recommended in
    CrossDashboardComponent to the backend recommender service priority
    scores, replacing the current return 0 stub.

-   **Add UI Toggle for Inactive/Archived Units:** Add a filter option
    to pass include_inactive=true to GlobalStateService, allowing
    students to view historical unit projects.

-   **Batch Priority Points in ProjectEntity:** Extend
    Entities::ProjectEntity to include pre-calculated recommender
    weights per task definition to streamline frontend sorting.

-   **Unit Test Coverage for CrossDashboardComponent:** Write Angular
    unit tests for toggleFilter(), setSort(), and processTasks() to
    prevent sorting regressions.
