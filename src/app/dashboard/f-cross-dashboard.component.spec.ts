import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatMenuModule} from '@angular/material/menu';
import {BehaviorSubject, of, throwError} from 'rxjs';
import {Project} from '../api/models/project';
import {Task} from '../api/models/task';
import {TaskStatusEnum} from '../api/models/task-status';
import {ProjectService} from '../api/services/project.service';
import {GlobalStateService} from '../projects/states/index/global-state.service';
import {CrossDashboardComponent} from './f-cross-dashboard.component';

describe('CrossDashboardComponent', () => {
  let component: CrossDashboardComponent;
  let fixture: ComponentFixture<CrossDashboardComponent>;
  let projectsSubject: BehaviorSubject<Project[]>;
  let projectServiceQuery: ReturnType<typeof vi.fn>;

  const syncView = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const makeDate = (day: number, hour = 12): Date => new Date(2026, 7, day, hour, 0, 0);

  const makeTask = (
    name: string,
    abbreviation: string,
    status: TaskStatusEnum,
    dueDate: Date | null | undefined,
    topWeight: number = 0,
  ): Task =>
    ({
      status,
      topWeight,
      numNewComments: 0,
      definition: {
        name,
        abbreviation,
        targetGradeText: 'Pass',
        description: `${name} description`,
        targetDate: dueDate,
      },
    }) as unknown as Task;

  const makeProject = (id: number, code: string, isActive: boolean, tasks: Task[] = []): Project =>
    ({
      id,
      tasks,
      unit: {
        code,
        name: `${code} Unit`,
        isActive,
        taskDefinitions: [],
      },
      calcTopTasks: vi.fn(),
      activeTasks: vi.fn().mockReturnValue(tasks),
    }) as unknown as Project;

  beforeEach(async () => {
    projectsSubject = new BehaviorSubject<Project[]>([]);
    projectServiceQuery = vi.fn().mockReturnValue(of([]));

    const globalStateServiceStub = {
      onLoad: (callback: () => void): void => callback(),
      currentUserProjects: {
        values: projectsSubject.asObservable(),
      },
    };

    const projectServiceStub = {
      query: projectServiceQuery,
    };

    await TestBed.configureTestingModule({
      declarations: [CrossDashboardComponent],
      imports: [MatMenuModule],
      providers: [
        {
          provide: GlobalStateService,
          useValue: globalStateServiceStub,
        },
        {
          provide: ProjectService,
          useValue: projectServiceStub,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CrossDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    projectsSubject.complete();
  });

  it('uses Active units as the default scope', () => {
    expect(component.unitScope).toBe('active');
    expect(projectServiceQuery).not.toHaveBeenCalled();
  });

  it('keeps only active projects in the active-unit collection', () => {
    projectsSubject.next([makeProject(1, 'COS10001', true), makeProject(2, 'COS30046', false)]);

    expect(component.activeUnits.map((unit) => unit.code)).toEqual(['COS10001']);
    expect(component.displayedUnits.map((unit) => unit.code)).toEqual(['COS10001']);
  });

  it('loads and displays previous units in Previous units mode', () => {
    projectServiceQuery.mockReturnValue(
      of([makeProject(1, 'COS10001', true), makeProject(2, 'COS30046', false)]),
    );

    component.setUnitScope('previous');

    expect(projectServiceQuery).toHaveBeenCalledTimes(1);
    expect(component.previousUnitsLoaded).toBe(true);
    expect(component.loadingPreviousUnits).toBe(false);
    expect(component.previousUnits.map((unit) => unit.code)).toEqual(['COS30046']);
    expect(component.displayedUnits.map((unit) => unit.code)).toEqual(['COS30046']);
    expect(component.previousUnits[0].isPrevious).toBe(true);
  });

  it('shows active units first and previous units afterward in All units mode', () => {
    projectsSubject.next([makeProject(1, 'COS10001', true), makeProject(2, 'COS20007', true)]);

    projectServiceQuery.mockReturnValue(
      of([
        makeProject(1, 'COS10001', true),
        makeProject(2, 'COS20007', true),
        makeProject(3, 'COS30046', false),
      ]),
    );

    component.setUnitScope('all');

    expect(component.displayedUnits.map((unit) => unit.code)).toEqual([
      'COS10001',
      'COS20007',
      'COS30046',
    ]);
  });

  it('does not request previous units again after they have loaded', () => {
    projectServiceQuery.mockReturnValue(of([makeProject(3, 'COS30046', false)]));

    component.setUnitScope('previous');
    component.setUnitScope('active');
    component.setUnitScope('all');

    expect(projectServiceQuery).toHaveBeenCalledTimes(1);
  });

  it('renders the no-previous-units empty state', () => {
    projectServiceQuery.mockReturnValue(of([]));

    component.setUnitScope('previous');
    fixture.detectChanges();

    expect(component.previousUnitsLoaded).toBe(true);
    expect(component.loadingPreviousUnits).toBe(false);
    expect(component.previousUnits).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Previous units');
    expect(fixture.nativeElement.textContent).toContain('No previous units are available.');
  });

  it('shows an error state when previous units cannot be loaded', () => {
    projectServiceQuery.mockReturnValue(
      throwError(() => new Error('Unable to load previous units')),
    );

    component.setUnitScope('previous');
    fixture.detectChanges();

    expect(component.previousUnitsLoadError).toBe(true);
    expect(component.loadingPreviousUnits).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Previous units could not be loaded.');
  });

  it('filters only the selected unit and ignores case and outer whitespace', async () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Individual Retrospective', '5.1P', 'not_started', new Date(2026, 7, 12)),
        makeTask('Leadership Report', '5.3D', 'not_started', new Date(2026, 7, 18)),
      ]),
      makeProject(2, 'SIT782', true, [
        makeTask('Security Report', '2.1P', 'not_started', new Date(2026, 7, 15)),
      ]),
    ]);

    await syncView();

    expect(component.displayedUnits).toHaveLength(2);

    const searchInputs = fixture.nativeElement.querySelectorAll(
      'input[type="search"]',
    ) as NodeListOf<HTMLInputElement>;

    expect(searchInputs).toHaveLength(2);

    searchInputs[0].value = '  RETROSPECTIVE  ';
    searchInputs[0].dispatchEvent(new Event('input', {bubbles: true}));

    await syncView();

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual(['5.1P']);

    expect(component.displayedUnits[1].tasks.map((task) => task.abbreviation)).toEqual(['2.1P']);
  });

  it('matches abbreviation, status, unit code and displayed due date', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Individual Retrospective', '5.1P', 'ready_for_feedback', new Date(2026, 7, 12)),
      ]),
    ]);

    const matchingQueries = [
      '5.1p',
      'Awaiting Feedback',
      'sit764',
      'Wednesday 12 August',
      '12/08/2026',
      '2026-08-12',
    ];

    for (const query of matchingQueries) {
      component.setSearch(1, query);

      expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual(['5.1P']);
    }
  });

  it('does not confuse Australian dates that contain the same numbers in another order', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('December Task', 'DEC', 'not_started', new Date(2026, 11, 8)),
      ]),
    ]);

    component.setSearch(1, '12/08/2026');
    expect(component.displayedUnits[0].tasks).toEqual([]);

    component.setSearch(1, '08/12/2026');
    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual(['DEC']);
  });

  it('matches subtitle and description text shown on the task card', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Individual Retrospective', '5.1P', 'not_started', new Date(2026, 7, 12)),
      ]),
    ]);

    component.setSearch(1, 'Pass');
    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual(['5.1P']);

    component.setSearch(1, 'description');
    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual(['5.1P']);

    component.setSearch(1, 'not shown anywhere');
    expect(component.displayedUnits[0].tasks).toEqual([]);
  });

  it('keeps punctuation-only input visible without filtering tasks', async () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Individual Retrospective', '5.1P', 'not_started', new Date(2026, 7, 12)),
        makeTask('Leadership Report', '5.3D', 'not_started', new Date(2026, 7, 18)),
      ]),
    ]);

    await syncView();

    const searchInput = fixture.nativeElement.querySelector(
      'input[type="search"]',
    ) as HTMLInputElement;

    searchInput.value = 'retro';
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));
    await syncView();

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual(['5.1P']);

    searchInput.value = '-';
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));
    await syncView();

    expect(component.getSearchTerm(1)).toBe('-');
    expect(component.hasSearchTerm(1)).toBe(false);
    expect(searchInput.value).toBe('-');
    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      '5.1P',
      '5.3D',
    ]);
  });

  it('clears the search and restores the original task list', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Individual Retrospective', '5.1P', 'not_started', new Date(2026, 7, 12)),
        makeTask('Leadership Report', '5.3D', 'not_started', new Date(2026, 7, 18)),
      ]),
    ]);

    component.setSearch(1, 'does not exist');

    expect(component.displayedUnits[0].tasks).toEqual([]);

    component.setSearch(1, '   ');

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      '5.1P',
      '5.3D',
    ]);
  });

  it('combines search with the Hide Completed filter', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Completed Security Review', '1.1P', 'complete', new Date(2026, 7, 10)),
        makeTask('Open Security Review', '1.2P', 'not_started', new Date(2026, 7, 12)),
        makeTask('Open Calendar Review', '1.3P', 'not_started', new Date(2026, 7, 14)),
      ]),
    ]);

    component.setSearch(1, 'security');
    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      '1.2P',
      '1.1P',
    ]);

    component.toggleFilter(1, component.filterOptions[0]);
    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual(['1.2P']);

    component.setSearch(1, '');
    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      '1.2P',
      '1.3P',
    ]);
  });

  it('preserves Due Date sorting after search is applied', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Later Security Review', 'LATE', 'not_started', new Date(2026, 7, 20)),
        makeTask('Calendar Setup', 'OTHER', 'not_started', new Date(2026, 7, 5)),
        makeTask('Earlier Security Review', 'EARLY', 'not_started', new Date(2026, 7, 10)),
      ]),
    ]);

    const dueDateSort = component.sortOptions.find((mode) => mode === 'Due Date');

    if (!dueDateSort) {
      throw new Error('Due Date sort option is missing');
    }

    component.setSort(1, dueDateSort);
    component.setSearch(1, 'security');

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'EARLY',
      'LATE',
    ]);
  });

  it('keeps completed tasks below open tasks in every sort mode', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Completed First', 'DONE-FIRST', 'complete', makeDate(3), 0),
        makeTask('Open Later', 'OPEN-LATE', 'not_started', makeDate(20), 4),
        makeTask('Completed Later', 'DONE-LATE', 'complete', makeDate(25), 5),
        makeTask('Open Earlier', 'OPEN-EARLY', 'working_on_it', makeDate(10), 1),
      ]),
    ]);

    const expectedByMode: Record<string, string[]> = {
      Recommended: ['OPEN-LATE', 'OPEN-EARLY', 'DONE-FIRST', 'DONE-LATE'],
      'Due Date': ['OPEN-EARLY', 'OPEN-LATE', 'DONE-FIRST', 'DONE-LATE'],
      Default: ['OPEN-EARLY', 'OPEN-LATE', 'DONE-FIRST', 'DONE-LATE'],
    };

    component.sortOptions.forEach((mode) => {
      component.setSort(1, mode);

      expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual(
        expectedByMode[mode],
      );
    });
  });

  it('applies separate search state in All and Previous unit scopes', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Current Task', 'CUR', 'not_started', new Date(2026, 7, 12)),
      ]),
    ]);

    projectServiceQuery.mockReturnValue(
      of([
        makeProject(2, 'SIT704', false, [
          makeTask('Archived Security Task', 'OLD1', 'complete', new Date(2025, 7, 12)),
          makeTask('Archived Project Task', 'OLD2', 'complete', new Date(2025, 7, 15)),
        ]),
      ]),
    );

    component.setUnitScope('all');
    component.setSearch(2, 'security');

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual(['CUR']);

    expect(component.displayedUnits[1].tasks.map((task) => task.abbreviation)).toEqual(['OLD1']);

    component.setUnitScope('previous');

    expect(component.displayedUnits.map((unit) => unit.code)).toEqual(['SIT704']);
    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual(['OLD1']);
  });

  it('shows a no-results message without hiding the unit', async () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Individual Retrospective', '5.1P', 'not_started', new Date(2026, 7, 12)),
      ]),
    ]);

    await syncView();

    expect(fixture.nativeElement.textContent).toContain('SIT764');
    expect(fixture.nativeElement.querySelectorAll('f-dashboard-list-item')).toHaveLength(1);

    component.setSearch(1, 'not a matching task');

    await syncView();

    expect(component.displayedUnits[0].tasks).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('SIT764');
    expect(fixture.nativeElement.textContent).toContain(
      'No tasks match the current search and filters.',
    );
    expect(fixture.nativeElement.querySelectorAll('f-dashboard-list-item')).toHaveLength(0);

    component.setSearch(1, '');

    await syncView();

    expect(component.displayedUnits[0].tasks).toHaveLength(1);
    expect(component.displayedUnits[0].tasks[0].title).toBe('Individual Retrospective');
    expect(fixture.nativeElement.querySelectorAll('f-dashboard-list-item')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).not.toContain(
      'No tasks match the current search and filters.',
    );
  });

  it('includes tasks exactly on the start and end boundaries', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Before Task', 'BEFORE', 'not_started', makeDate(9)),
        makeTask('Start Task', 'START', 'not_started', makeDate(10, 23)),
        makeTask('End Task', 'END', 'not_started', makeDate(20, 1)),
        makeTask('After Task', 'AFTER', 'not_started', makeDate(21)),
      ]),
    ]);

    component.setStartDate('2026-08-10');
    component.setEndDate('2026-08-20');

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'START',
      'END',
    ]);
  });

  it('supports start-date-only filtering', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Before Task', 'BEFORE', 'not_started', makeDate(9)),
        makeTask('Boundary Task', 'BOUNDARY', 'not_started', makeDate(10)),
        makeTask('After Task', 'AFTER', 'not_started', makeDate(11)),
      ]),
    ]);

    component.setStartDate('2026-08-10');

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'BOUNDARY',
      'AFTER',
    ]);
  });

  it('supports end-date-only filtering', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Before Task', 'BEFORE', 'not_started', makeDate(9)),
        makeTask('Boundary Task', 'BOUNDARY', 'not_started', makeDate(10)),
        makeTask('After Task', 'AFTER', 'not_started', makeDate(11)),
      ]),
    ]);

    component.setEndDate('2026-08-10');

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'BEFORE',
      'BOUNDARY',
    ]);
  });

  it('detects a reversed date range and does not apply it', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('First Task', 'TASK1', 'not_started', makeDate(10)),
        makeTask('Second Task', 'TASK2', 'not_started', makeDate(20)),
      ]),
    ]);

    component.setStartDate('2026-08-20');
    component.setEndDate('2026-08-10');

    expect(component.startDate).toBe('2026-08-20');
    expect(component.endDate).toBe('2026-08-10');
    expect(component.isDateRangeInvalid).toBe(true);
    expect(component.isDateFilterActive).toBe(false);
    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'TASK1',
      'TASK2',
    ]);
  });

  it('keeps undated tasks without a filter and excludes them while filtering', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Valid Task', 'VALID', 'not_started', makeDate(15)),
        makeTask('Missing Date Task', 'MISSING', 'not_started', undefined),
        makeTask('Invalid Date Task', 'INVALID', 'not_started', new Date('invalid')),
      ]),
    ]);

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'VALID',
      'MISSING',
      'INVALID',
    ]);

    component.setStartDate('2026-08-10');

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual(['VALID']);
  });

  it('clears both dates and restores the unfiltered task list', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Early Task', 'EARLY', 'not_started', makeDate(5)),
        makeTask('Late Task', 'LATE', 'not_started', makeDate(20)),
      ]),
    ]);

    component.setStartDate('2026-08-10');
    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual(['LATE']);

    component.clearDateRange();

    expect(component.startDate).toBe('');
    expect(component.endDate).toBe('');
    expect(component.isDateFilterActive).toBe(false);
    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'EARLY',
      'LATE',
    ]);
  });

  it('keeps a unit visible when no tasks match the selected date range', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [makeTask('Early Task', 'TASK1', 'not_started', makeDate(5))]),
    ]);

    component.setStartDate('2026-08-20');

    expect(component.isDateFilterActive).toBe(true);
    expect(component.displayedUnits).toHaveLength(1);
    expect(component.displayedUnits[0].code).toBe('SIT764');
    expect(component.displayedUnits[0].tasks).toHaveLength(0);
  });

  it('combines date filtering with Hide Completed and Due Date sorting', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Later Review', 'LATER', 'not_started', makeDate(18), 3),
        makeTask('Completed Review', 'COMPLETE', 'complete', makeDate(12), 1),
        makeTask('Earlier Review', 'EARLIER', 'not_started', makeDate(15), 2),
        makeTask('Outside Review', 'OUTSIDE', 'not_started', makeDate(25), 4),
      ]),
    ]);

    component.setStartDate('2026-08-10');
    component.setEndDate('2026-08-20');

    const hideCompleted = component.filterOptions.find((mode) => mode === 'Hide Completed');
    if (!hideCompleted) {
      throw new Error('Hide Completed filter option is missing');
    }
    component.toggleFilter(1, hideCompleted);

    const dueDateSort = component.sortOptions.find((mode) => mode === 'Due Date');
    if (!dueDateSort) {
      throw new Error('Due Date sort option is missing');
    }
    component.setSort(1, dueDateSort);

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'EARLIER',
      'LATER',
    ]);
  });

  it('applies the same date range in Active, Previous and All unit views', () => {
    const activeProject = makeProject(1, 'SIT764', true, [
      makeTask('Active Early Task', 'ACTIVE-EARLY', 'not_started', makeDate(10)),
    ]);
    const previousProject = makeProject(2, 'SIT704', false, [
      makeTask('Previous Late Task', 'PREVIOUS-LATE', 'not_started', makeDate(20)),
    ]);

    projectsSubject.next([activeProject]);
    projectServiceQuery.mockReturnValue(of([activeProject, previousProject]));

    component.setStartDate('2026-08-15');
    expect(component.displayedUnits.map((unit) => unit.code)).toEqual(['SIT764']);
    expect(component.displayedUnits[0].tasks).toHaveLength(0);

    component.setUnitScope('previous');
    expect(component.displayedUnits.map((unit) => unit.code)).toEqual(['SIT704']);
    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'PREVIOUS-LATE',
    ]);

    component.setUnitScope('all');
    expect(component.displayedUnits.map((unit) => unit.code)).toEqual(['SIT764', 'SIT704']);
    expect(component.displayedUnits[0].tasks).toHaveLength(0);
    expect(component.displayedUnits[1].tasks.map((task) => task.abbreviation)).toEqual([
      'PREVIOUS-LATE',
    ]);
  });

  it('combines per-unit search with dashboard date filtering', () => {
    projectsSubject.next([
      makeProject(1, 'SIT764', true, [
        makeTask('Early Security Review', 'EARLY', 'not_started', makeDate(8)),
        makeTask('In-range Security Review', 'MATCH', 'not_started', makeDate(15)),
        makeTask('In-range Calendar Setup', 'OTHER', 'not_started', makeDate(16)),
      ]),
    ]);

    component.setSearch(1, 'security');
    component.setStartDate('2026-08-10');
    component.setEndDate('2026-08-20');

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual(['MATCH']);
  });
});
