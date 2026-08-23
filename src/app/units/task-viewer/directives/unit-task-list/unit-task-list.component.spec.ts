import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA, SimpleChange} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';
import {Project, Task, TaskDefinition} from 'src/app/api/models/doubtfire-model';
import {FUnitTaskListComponent} from './unit-task-list.component';

const emptyProvider = {};

const taskDefinition = (
  id: number,
  abbreviation: string,
  startDate = new Date(2026, 0, id + 1),
  targetGrade = 0,
): TaskDefinition =>
  ({
    id,
    seq: id,
    abbreviation,
    name: abbreviation,
    startDate,
    targetGrade,
  }) as TaskDefinition;

const taskForDefinition = (definition: TaskDefinition, topWeight: number): Task =>
  ({
    definition,
    topWeight,
  }) as Task;

describe('FUnitTaskListComponent', () => {
  let component: FUnitTaskListComponent;
  let fixture: ComponentFixture<FUnitTaskListComponent>;

  beforeEach(async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });

    await TestBed.configureTestingModule({
      declarations: [FUnitTaskListComponent],
      providers: [
        {provide: Router, useValue: emptyProvider},
        {provide: ActivatedRoute, useValue: emptyProvider},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(FUnitTaskListComponent, {set: {template: ''}})
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FUnitTaskListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sorts task definitions by task top weight by default', () => {
    const middlePriorityTask = taskDefinition(0, 'C');
    const lowPriorityTask = taskDefinition(1, 'A');
    const highPriorityTask = taskDefinition(2, 'B');
    component.taskDefinitions = [lowPriorityTask, middlePriorityTask, highPriorityTask];
    component.tasks = [
      taskForDefinition(middlePriorityTask, 1),
      taskForDefinition(lowPriorityTask, 2),
      taskForDefinition(highPriorityTask, 0),
    ];

    component.applyFilters();

    expect(component.filteredTaskDefinitions).toEqual([
      highPriorityTask,
      middlePriorityTask,
      lowPriorityTask,
    ]);
  });

  it('restores top weight order when switching back to default sorting', () => {
    const middlePriorityTask = taskDefinition(0, 'C');
    const lowPriorityTask = taskDefinition(1, 'A');
    const highPriorityTask = taskDefinition(2, 'B');
    component.taskDefinitions = [lowPriorityTask, middlePriorityTask, highPriorityTask];
    component.tasks = [
      taskForDefinition(middlePriorityTask, 1),
      taskForDefinition(lowPriorityTask, 2),
      taskForDefinition(highPriorityTask, 0),
    ];

    component.setSortBy('abbreviation');
    expect(component.filteredTaskDefinitions).toEqual([
      lowPriorityTask,
      highPriorityTask,
      middlePriorityTask,
    ]);

    component.setSortBy('default');
    expect(component.filteredTaskDefinitions).toEqual([
      highPriorityTask,
      middlePriorityTask,
      lowPriorityTask,
    ]);
  });

  it('falls back to task definition sequence when no task is available', () => {
    const firstTask = taskDefinition(0, 'C');
    const secondTask = taskDefinition(1, 'A');
    const thirdTask = taskDefinition(2, 'B');
    component.taskDefinitions = [thirdTask, firstTask, secondTask];

    component.applyFilters();

    expect(component.filteredTaskDefinitions).toEqual([firstTask, secondTask, thirdTask]);
  });

  it('shows only tasks at or below the project target grade by default', () => {
    const passTask = taskDefinition(1, 'P1', undefined, 0);
    const creditTask = taskDefinition(2, 'C1', undefined, 1);
    const distinctionTask = taskDefinition(3, 'D1', undefined, 2);
    component.project = {
      id: 10,
      targetGrade: 0,
      unit: {id: 20},
    } as Project;
    component.targetGrade = 0;
    component.taskDefinitions = [passTask, creditTask, distinctionTask];
    component.tasks = [];

    component.applyFilters();

    expect(component.filteredTaskDefinitions).toEqual([passTask]);
    expect(component.activeViewPreferenceCount).toBe(0);
  });

  it('reveals tasks beyond the target grade only when explicitly selected', () => {
    const passTask = taskDefinition(1, 'P1', undefined, 0);
    const creditTask = taskDefinition(2, 'C1', undefined, 1);
    component.project = {
      id: 10,
      targetGrade: 0,
      unit: {id: 20},
    } as Project;
    component.targetGrade = 0;
    component.taskDefinitions = [passTask, creditTask];
    component.tasks = [];

    component.toggleShowAboveTargetGrade(true);

    expect(component.filteredTaskDefinitions).toEqual([passTask, creditTask]);
    expect(component.activeViewPreferenceCount).toBe(1);

    component.resetViewPreferences();

    expect(component.filteredTaskDefinitions).toEqual([passTask]);
    expect(component.activeViewPreferenceCount).toBe(0);
  });

  it('reapplies target-grade filtering when the selected target changes', () => {
    const passTask = taskDefinition(1, 'P1', undefined, 0);
    const creditTask = taskDefinition(2, 'C1', undefined, 1);
    component.project = {
      id: 10,
      targetGrade: 0,
      unit: {id: 20},
    } as Project;
    component.targetGrade = 0;
    component.taskDefinitions = [passTask, creditTask];
    component.tasks = [];
    component.applyFilters();

    component.targetGrade = 1;
    component.project.targetGrade = 1;
    component.ngOnChanges({targetGrade: new SimpleChange(0, 1, false)});

    expect(component.filteredTaskDefinitions).toEqual([passTask, creditTask]);
  });

  it('does not grade-filter an all-tasks list without a student project', () => {
    const passTask = taskDefinition(1, 'P1', undefined, 0);
    const distinctionTask = taskDefinition(2, 'D1', undefined, 2);
    component.mode = 'all-tasks';
    component.taskDefinitions = [passTask, distinctionTask];
    component.tasks = [];

    component.applyFilters();

    expect(component.filteredTaskDefinitions).toEqual([passTask, distinctionTask]);
  });
});
