import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {BehaviorSubject, of, throwError} from 'rxjs';
import {Project} from 'src/app/api/models/project';
import {Unit} from 'src/app/api/models/unit';
import {ProjectService} from 'src/app/api/services/project.service';
import {TaskService} from 'src/app/api/services/task.service';
import {UserService} from 'src/app/api/services/user.service';
import {EmptyStateComponent} from 'src/app/common/empty-state/empty-state.component';
import {UnitStudentEnrolmentModalService} from '../../modals/unit-student-enrolment-modal/unit-student-enrolment-modal.service';
import {UnitRootStateComponent} from '../../unit-root-state.component';
import {StudentsListComponent} from './students-list.component';

function studentStub(name: string): Project {
  return {
    student: {name, username: name.toLowerCase()},
    hasTutor: () => true,
    matches: () => true,
  } as unknown as Project;
}

function unitStub(id: number, studentNames: string[]): Unit {
  const students = studentNames.map(studentStub);

  return {
    id,
    myRole: 'Convenor',
    students,
    studentFilterTypeAheadData: studentNames,
    studentCache: {values: of(students)},
  } as unknown as Unit;
}

describe('StudentsListComponent', () => {
  const unitA = unitStub(1, ['Ana Amos']);
  const unitB = unitStub(2, ['Bo Barnes']);
  let routeData: BehaviorSubject<{unit: Unit}>;

  beforeEach(async () => {
    routeData = new BehaviorSubject<{unit: Unit}>({unit: unitA});

    await TestBed.configureTestingModule({
      declarations: [UnitRootStateComponent, StudentsListComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {data: routeData, parent: {snapshot: {data: {}}}},
        },
        {provide: Router, useValue: {}},
        {provide: UserService, useValue: {currentUser: {id: 1}}},
        {
          provide: TaskService,
          useValue: {statusColors: new Map(), statusLabels: new Map()},
        },
        {provide: ProjectService, useValue: {loadStudents: () => of([])}},
        {provide: UnitStudentEnrolmentModalService, useValue: {}},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(UnitRootStateComponent, {set: {template: ''}})
      .overrideComponent(StudentsListComponent, {set: {template: ''}})
      .compileComponents();
  });

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

    routeData.next({unit: unitStub(unitA.id, ['Ana Amos'])});

    expect(component.unit.id).toBe(unitA.id);
    expect(component.dataSource.data).toBe(firstData);
  });
});

describe('StudentsListComponent empty state', () => {
  afterEach(() => vi.restoreAllMocks());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StudentsListComponent],
      imports: [
        FormsModule,
        MatAutocompleteModule,
        MatButtonToggleModule,
        MatFormFieldModule,
        MatInputModule,
        MatPaginatorModule,
        MatSortModule,
        MatTableModule,
        NoopAnimationsModule,
        EmptyStateComponent,
      ],
      providers: [
        {provide: ActivatedRoute, useValue: {parent: {snapshot: {data: {}}}}},
        {provide: Router, useValue: {}},
        {provide: UserService, useValue: {currentUser: {id: 1}}},
        {
          provide: TaskService,
          useValue: {statusColors: new Map(), statusLabels: new Map()},
        },
        {provide: ProjectService, useValue: {loadStudents: () => of([])}},
        {provide: UnitStudentEnrolmentModalService, useValue: {}},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('renders the empty state only while the filtered list has no rows', () => {
    const fixture = TestBed.createComponent(StudentsListComponent);
    const component = fixture.componentInstance;
    component.unit$ = of(unitStub(1, []));

    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('f-empty-state') as HTMLElement;
    const table = fixture.nativeElement.querySelector('table') as HTMLTableElement;
    const tableScrollContainer = table.parentElement as HTMLDivElement;

    expect(emptyState).toBeTruthy();
    expect(emptyState.closest('table')).toBeNull();
    expect(tableScrollContainer.hidden).toBe(true);

    component.dataSource.data = [
      {
        student: {name: 'Cy Cole', username: 'cycole'},
        hasTutor: () => true,
        matches: () => true,
        taskStats: [],
      } as unknown as Project,
    ];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('f-empty-state')).toBeFalsy();
    expect(tableScrollContainer.hidden).toBe(false);
  });

  it('shows a retryable error instead of claiming that a failed load is empty', () => {
    const projectService = TestBed.inject(ProjectService);
    const loadStudents = vi
      .spyOn(projectService, 'loadStudents')
      .mockReturnValueOnce(throwError(() => new Error('network unavailable')))
      .mockReturnValue(of([]));
    const fixture = TestBed.createComponent(StudentsListComponent);
    fixture.componentInstance.unit$ = of(unitStub(1, []));

    fixture.detectChanges();

    const errorState = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(errorState.textContent).toContain('We could not load students.');
    expect(fixture.nativeElement.querySelector('f-empty-state')).toBeFalsy();

    (errorState.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(loadStudents).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('f-empty-state')).toBeTruthy();
  });
});
