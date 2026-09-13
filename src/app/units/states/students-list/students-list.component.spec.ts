import {beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatOptionSelectionChange} from '@angular/material/core';
import {MatPaginator} from '@angular/material/paginator';
import {ActivatedRoute, Router} from '@angular/router';
import {BehaviorSubject, Observable, of, throwError} from 'rxjs';
import {Project} from 'src/app/api/models/project';
import {Tutorial} from 'src/app/api/models/tutorial/tutorial';
import {Unit} from 'src/app/api/models/unit';
import {CampusService} from 'src/app/api/services/campus.service';
import {ProjectService} from 'src/app/api/services/project.service';
import {UserService} from 'src/app/api/services/user.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {UnitStudentEnrolmentModalService} from '../../modals/unit-student-enrolment-modal/unit-student-enrolment-modal.service';
import {UnitRootStateComponent} from '../../unit-root-state.component';
import {StudentsListComponent} from './students-list.component';

function studentStub(name: string, inMyTutorial = true): Project {
  return {
    student: {name, username: name.toLowerCase()},
    hasTutor: () => inMyTutorial,
    matches: (text: string) => name.toLowerCase().includes(text),
  } as unknown as Project;
}

function unitStub(id: number, students: Project[], myRole = 'Convenor'): Unit {
  return {
    id,
    myRole,
    students,
    studentFilterTypeAheadData: students.map((project) => project.student.name),
    studentCache: {values: of(students)},
  } as unknown as Unit;
}

function namedUnit(id: number, studentNames: string[]): Unit {
  return unitStub(
    id,
    studentNames.map((name) => studentStub(name)),
  );
}

describe('StudentsListComponent', () => {
  const unitA = namedUnit(1, ['Ana Amos']);
  const unitB = namedUnit(2, ['Bo Barnes']);
  let routeData: BehaviorSubject<{unit: Unit}>;
  let loadStudents: ReturnType<typeof vi.fn<(unit: Unit) => Observable<Project[]>>>;

  beforeEach(async () => {
    routeData = new BehaviorSubject<{unit: Unit}>({unit: unitA});
    loadStudents = vi.fn<(unit: Unit) => Observable<Project[]>>(() => of([]));

    await TestBed.configureTestingModule({
      declarations: [UnitRootStateComponent, StudentsListComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {data: routeData, parent: {snapshot: {data: {}}}},
        },
        {provide: Router, useValue: {}},
        {provide: UserService, useValue: {currentUser: {id: 1}}},
        {provide: ProjectService, useValue: {loadStudents}},
        {provide: CampusService, useValue: {query: () => of([])}},
        {provide: AlertService, useValue: {success: () => {}, error: () => {}}},
        {provide: UnitStudentEnrolmentModalService, useValue: {}},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(UnitRootStateComponent, {set: {template: ''}})
      .overrideComponent(StudentsListComponent, {set: {template: ''}})
      .compileComponents();
  });

  function createList(unit$?: Observable<Unit>): StudentsListComponent {
    const component = TestBed.createComponent(StudentsListComponent).componentInstance;
    component.paginator = {firstPage: () => {}} as unknown as MatPaginator;

    if (unit$) {
      component.unit$ = unit$;
    }

    component.ngOnInit();
    return component;
  }

  it('shows the students of the unit the route resolved, and follows it to another unit', () => {
    const root = TestBed.createComponent(UnitRootStateComponent).componentInstance;
    root.ngOnInit();

    const component = TestBed.createComponent(StudentsListComponent).componentInstance;
    component.paginator = {firstPage: () => {}} as unknown as MatPaginator;

    // The outlet hands the child its stream before the child runs ngOnInit.
    root.onActivate(component);
    component.ngOnInit();

    expect(component.unit.id).toBe(unitA.id);
    expect(component.dataSource.data.map((project) => project.student.name)).toEqual(['Ana Amos']);

    routeData.next({unit: unitB});

    expect(component.unit.id).toBe(unitB.id);
    expect(component.dataSource.data.map((project) => project.student.name)).toEqual(['Bo Barnes']);
  });

  it('does not rebuild the list when the route resolves the same unit again', () => {
    const root = TestBed.createComponent(UnitRootStateComponent).componentInstance;
    root.ngOnInit();

    const component = TestBed.createComponent(StudentsListComponent).componentInstance;
    component.paginator = {firstPage: () => {}} as unknown as MatPaginator;

    root.onActivate(component);
    component.ngOnInit();

    const firstData = component.dataSource.data;

    routeData.next({unit: namedUnit(unitA.id, ['Ana Amos'])});

    expect(component.unit.id).toBe(unitA.id);
    expect(component.dataSource.data).toBe(firstData);
  });

  it('shows a finished student as complete, not as all grey', () => {
    const component = createList(of(unitA));
    // The project mapping reads a grey share of 0 as 100, so a student with every
    // task complete arrives with both bars at 100.
    const finished = {
      taskStats: [
        {key: 'fail', value: 0},
        {key: 'not_started', value: 100},
        {key: 'working_on_it', value: 0},
        {key: 'ready_for_feedback', value: 0},
        {key: 'complete', value: 100},
      ],
    } as unknown as Project;

    const progress = component.progressFor(finished);

    expect(progress.complete).toBe(100);
    expect(progress.segments.map((segment) => [segment.key, segment.value])).toEqual([
      ['complete', 100],
    ]);
  });

  it('works out the grey share from what is left over', () => {
    const component = createList(of(unitA));
    const partway = {
      taskStats: [
        {key: 'fail', value: 5},
        {key: 'not_started', value: 100},
        {key: 'working_on_it', value: 10},
        {key: 'ready_for_feedback', value: 15},
        {key: 'complete', value: 40},
      ],
    } as unknown as Project;

    const progress = component.progressFor(partway);

    expect(progress.segments.map((segment) => [segment.key, segment.value])).toEqual([
      ['complete', 40],
      ['ready_for_feedback', 15],
      ['working_on_it', 10],
      ['fail', 5],
      ['not_started', 30],
    ]);
    expect(progress.segments[0].color).toBe('var(--ot-status-complete-graphic)');
    expect(progress.label).toContain('Complete 40%');
  });

  it('treats a student with no stats yet as not started instead of throwing', () => {
    const component = createList(of(unitA));

    const progress = component.progressFor({} as Project);

    expect(progress.complete).toBe(0);
    expect(progress.segments.map((segment) => segment.key)).toEqual(['not_started']);
  });

  it('records a failed load so the page can offer a retry', () => {
    loadStudents.mockReturnValueOnce(throwError(() => new Error('offline')));

    const component = createList(of(unitA));

    expect(component.loadingStudents).toBe(false);
    expect(component.loadError).toBe(true);

    component.loadStudents();

    expect(loadStudents).toHaveBeenCalledTimes(2);
    expect(component.loadError).toBe(false);
    expect(component.loadingStudents).toBe(false);
  });

  it('says when a tutor has no students in their tutorials, and when a search finds nobody', () => {
    const unit = unitStub(3, [studentStub('Cy Cole', false)], 'Tutor');
    const component = createList(of(unit));

    expect(component.staffFilter).toBe('mine');
    expect(component.emptyState).toBe('no-mine');

    component.setStaffFilter('all');
    expect(component.emptyState).toBe('none');

    component.searchText = 'zz';
    component.onSearchChange();
    expect(component.emptyState).toBe('no-match');
    expect(component.noMatchMessage).toBe('No students match "zz"');

    component.clearSearch();
    expect(component.emptyState).toBe('none');
  });

  it('skips blank suggestions instead of throwing on them', () => {
    const unit = {
      ...namedUnit(4, ['Di Dean']),
      studentFilterTypeAheadData: ['Di Dean', undefined, ''],
    } as unknown as Unit;
    const component = createList(of(unit));

    component.searchText = 'd';
    expect(() => component.onSearchChange()).not.toThrow();
    expect(component.filteredSuggestions).toEqual(['Di Dean']);
  });

  it('changes a tutorial only for a pick the user made, from the mouse or the keyboard', () => {
    const component = createList(of(unitA));
    const switchToTutorial = vi.fn();
    const project = {switchToTutorial} as unknown as Project;
    const tutorial = {id: 7} as Tutorial;

    component.onTutorialOptionChange(
      {isUserInput: false} as MatOptionSelectionChange,
      project,
      tutorial,
    );
    expect(switchToTutorial).not.toHaveBeenCalled();

    component.onTutorialOptionChange(
      {isUserInput: true} as MatOptionSelectionChange,
      project,
      tutorial,
    );
    expect(switchToTutorial).toHaveBeenCalledWith(tutorial);
  });

  it('puts the campus back when the change is refused', () => {
    const component = createList(of(unitA));
    const original = {id: 1, name: 'Burwood'};
    const project = {
      campus: original,
      switchToCampus(campus: unknown) {
        this.campus = campus;
        return throwError(() => 'Not allowed');
      },
    } as unknown as Project;

    component.changeCampus(project, {id: 2, name: 'Geelong'} as never);

    expect(project.campus).toBe(original);
  });
});
