import {beforeEach, describe, expect, it} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, Router, convertToParamMap} from '@angular/router';
import {BehaviorSubject, Subject} from 'rxjs';
import {Task, TaskDefinition} from 'src/app/api/models/doubtfire-model';
import {FUnitTaskListComponent} from './unit-task-list.component';

const emptyProvider = {};

const flushTaskSelection = async (): Promise<void> => {
  await new Promise<void>((resolve) => queueMicrotask(resolve));
};

const taskDefinition = (
  id: number,
  abbreviation: string,
  startDate = new Date(2026, 0, id + 1),
): TaskDefinition =>
  ({
    id,
    seq: id,
    abbreviation,
    name: abbreviation,
    startDate,
  }) as TaskDefinition;

const taskForDefinition = (definition: TaskDefinition, topWeight: number): Task =>
  ({
    definition,
    topWeight,
  }) as Task;

describe('FUnitTaskListComponent', () => {
  let component: FUnitTaskListComponent;
  let fixture: ComponentFixture<FUnitTaskListComponent>;
  let routeParamMap$: Subject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    routeParamMap$ = new Subject<ReturnType<typeof convertToParamMap>>();

    await TestBed.configureTestingModule({
      declarations: [FUnitTaskListComponent],
      providers: [
        {provide: Router, useValue: emptyProvider},
        {
          provide: ActivatedRoute,
          useValue: {paramMap: routeParamMap$.asObservable()},
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(FUnitTaskListComponent, {set: {template: ''}})
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FUnitTaskListComponent);
    component = fixture.componentInstance;
    component.taskDefinitions = [];
    component.tasks = [];
    component.selectedTaskDefinition$ = new BehaviorSubject<TaskDefinition>(null);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('follows task route changes without recreating the component', async () => {
    const firstTask = taskDefinition(1, '1.1P');
    const secondTask = taskDefinition(2, '2.3P');

    component.taskDefinitions = [firstTask, secondTask];

    fixture.detectChanges();

    routeParamMap$.next(
      convertToParamMap({
        taskAbbreviation: firstTask.abbreviation,
      }),
    );

    await flushTaskSelection();

    expect(component.selectedTaskDefinition$.value).toBe(firstTask);
    expect(component.selectedTaskDef).toBe(firstTask);

    routeParamMap$.next(
      convertToParamMap({
        taskAbbreviation: secondTask.abbreviation,
      }),
    );

    await flushTaskSelection();

    expect(component.selectedTaskDefinition$.value).toBe(secondTask);
    expect(component.selectedTaskDef).toBe(secondTask);
  });

  it('clears a stale selection when the route task does not exist', async () => {
    const existingTask = taskDefinition(1, '1.1P');

    component.taskDefinitions = [existingTask];

    fixture.detectChanges();

    routeParamMap$.next(
      convertToParamMap({
        taskAbbreviation: existingTask.abbreviation,
      }),
    );

    await flushTaskSelection();

    expect(component.selectedTaskDefinition$.value).toBe(existingTask);

    routeParamMap$.next(
      convertToParamMap({
        taskAbbreviation: 'does-not-exist',
      }),
    );

    await flushTaskSelection();

    expect(component.selectedTaskDefinition$.value).toBeNull();
    expect(component.selectedTaskDef).toBeNull();
  });

  it('clears the selection when the task parameter is removed', async () => {
    const existingTask = taskDefinition(1, '1.1P');

    component.taskDefinitions = [existingTask];

    fixture.detectChanges();

    routeParamMap$.next(
      convertToParamMap({
        taskAbbreviation: existingTask.abbreviation,
      }),
    );

    await flushTaskSelection();

    expect(component.selectedTaskDefinition$.value).toBe(existingTask);

    routeParamMap$.next(convertToParamMap({}));

    await flushTaskSelection();

    expect(component.selectedTaskDefinition$.value).toBeNull();
    expect(component.selectedTaskDef).toBeNull();
  });

  it('stops following route changes after the component is destroyed', async () => {
    const firstTask = taskDefinition(1, '1.1P');
    const secondTask = taskDefinition(2, '2.3P');

    component.taskDefinitions = [firstTask, secondTask];

    fixture.detectChanges();

    routeParamMap$.next(
      convertToParamMap({
        taskAbbreviation: firstTask.abbreviation,
      }),
    );

    await flushTaskSelection();

    expect(component.selectedTaskDefinition$.value).toBe(firstTask);

    component.ngOnDestroy();

    routeParamMap$.next(
      convertToParamMap({
        taskAbbreviation: secondTask.abbreviation,
      }),
    );

    await flushTaskSelection();

    expect(component.selectedTaskDefinition$.value).toBe(firstTask);
    expect(component.selectedTaskDef).toBe(firstTask);
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
});
