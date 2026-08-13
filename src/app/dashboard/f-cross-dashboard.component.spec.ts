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

  const makeDate = (day: number, hour = 12): Date => new Date(2026, 7, day, hour, 0, 0);

  const makeTask = (
    abbreviation: string,
    dueDate: Date | null | undefined,
    status: TaskStatusEnum = 'not_started',
    weight = 1,
  ): Task =>
    ({
      status,
      numNewComments: 0,
      topWeight: weight,
      definition: {
        name: `${abbreviation} Task`,
        abbreviation,
        targetGradeText: 'Pass',
        description: `${abbreviation} description`,
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

  it('includes tasks exactly on the start and end boundaries', () => {
    const project = makeProject(1, 'COS10001', true, [
      makeTask('BEFORE', makeDate(9)),
      makeTask('START', makeDate(10, 23)),
      makeTask('END', makeDate(20, 1)),
      makeTask('AFTER', makeDate(21)),
    ]);

    projectsSubject.next([project]);

    component.setStartDate('2026-08-10');
    component.setEndDate('2026-08-20');

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'START',
      'END',
    ]);
  });

  it('supports start-date-only filtering', () => {
    const project = makeProject(1, 'COS10001', true, [
      makeTask('BEFORE', makeDate(9)),
      makeTask('BOUNDARY', makeDate(10)),
      makeTask('AFTER', makeDate(11)),
    ]);

    projectsSubject.next([project]);

    component.setStartDate('2026-08-10');

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'BOUNDARY',
      'AFTER',
    ]);
  });

  it('supports end-date-only filtering', () => {
    const project = makeProject(1, 'COS10001', true, [
      makeTask('BEFORE', makeDate(9)),
      makeTask('BOUNDARY', makeDate(10)),
      makeTask('AFTER', makeDate(11)),
    ]);

    projectsSubject.next([project]);

    component.setEndDate('2026-08-10');

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'BEFORE',
      'BOUNDARY',
    ]);
  });

  it('detects a reversed date range and does not apply it', () => {
    const project = makeProject(1, 'COS10001', true, [
      makeTask('TASK1', makeDate(10)),
      makeTask('TASK2', makeDate(20)),
    ]);

    projectsSubject.next([project]);

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
    const project = makeProject(1, 'COS10001', true, [
      makeTask('VALID', makeDate(15)),
      makeTask('MISSING', undefined),
      makeTask('INVALID', new Date('invalid')),
    ]);

    projectsSubject.next([project]);

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'VALID',
      'MISSING',
      'INVALID',
    ]);

    component.setStartDate('2026-08-10');

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual(['VALID']);
  });

  it('clears both dates and restores the unfiltered task list', () => {
    const project = makeProject(1, 'COS10001', true, [
      makeTask('EARLY', makeDate(5)),
      makeTask('LATE', makeDate(20)),
    ]);

    projectsSubject.next([project]);

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
    const project = makeProject(1, 'COS10001', true, [makeTask('TASK1', makeDate(5))]);

    projectsSubject.next([project]);

    component.setStartDate('2026-08-20');

    expect(component.isDateFilterActive).toBe(true);
    expect(component.displayedUnits).toHaveLength(1);
    expect(component.displayedUnits[0].code).toBe('COS10001');
    expect(component.displayedUnits[0].tasks).toHaveLength(0);
  });

  it('works together with Hide Completed and Due Date sorting', () => {
    const project = makeProject(1, 'COS10001', true, [
      makeTask('LATER', makeDate(18), 'not_started', 3),
      makeTask('COMPLETE', makeDate(12), 'complete', 1),
      makeTask('EARLIER', makeDate(15), 'not_started', 2),
      makeTask('OUTSIDE', makeDate(25), 'not_started', 4),
    ]);

    projectsSubject.next([project]);

    component.setStartDate('2026-08-10');
    component.setEndDate('2026-08-20');

    component.toggleFilter(1, component.filterOptions[0]);

    const dueDateSort = component.sortOptions.find((mode) => mode === 'Due Date');
    expect(dueDateSort).toBeDefined();

    component.setSort(1, dueDateSort!);

    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'EARLIER',
      'LATER',
    ]);
  });

  it('applies the same date range in Active, Previous, and All unit views', () => {
    const activeProject = makeProject(1, 'COS10001', true, [
      makeTask('ACTIVE-EARLY', makeDate(10)),
    ]);

    const previousProject = makeProject(2, 'COS30046', false, [
      makeTask('PREVIOUS-LATE', makeDate(20)),
    ]);

    projectsSubject.next([activeProject]);

    projectServiceQuery.mockReturnValue(of([activeProject, previousProject]));

    component.setStartDate('2026-08-15');

    expect(component.displayedUnits.map((unit) => unit.code)).toEqual(['COS10001']);
    expect(component.displayedUnits[0].tasks).toHaveLength(0);

    component.setUnitScope('previous');

    expect(component.displayedUnits.map((unit) => unit.code)).toEqual(['COS30046']);
    expect(component.displayedUnits[0].tasks.map((task) => task.abbreviation)).toEqual([
      'PREVIOUS-LATE',
    ]);

    component.setUnitScope('all');

    expect(component.displayedUnits.map((unit) => unit.code)).toEqual(['COS10001', 'COS30046']);
    expect(component.displayedUnits[0].tasks).toHaveLength(0);
    expect(component.displayedUnits[1].tasks.map((task) => task.abbreviation)).toEqual([
      'PREVIOUS-LATE',
    ]);
  });
});
