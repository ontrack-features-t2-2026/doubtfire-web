import {beforeEach, describe, expect, it} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';
import {BehaviorSubject, Observable, Subject, throwError} from 'rxjs';
import {TaskDefinition} from 'src/app/api/models/task-definition';
import {Unit} from 'src/app/api/models/unit';
import {UnitService} from 'src/app/api/services/unit.service';
import {TaskViewerStateComponent} from './task-viewer-state.component';

function bareUnit(id: number): Unit {
  return {id, taskDefinitions: []} as unknown as Unit;
}

function loadedUnit(id: number, ...abbreviations: string[]): Unit {
  return {
    id,
    taskDefinitions: abbreviations.map((abbreviation) => ({abbreviation}) as TaskDefinition),
  } as unknown as Unit;
}

describe('TaskViewerStateComponent', () => {
  let fixture: ComponentFixture<TaskViewerStateComponent>;
  let component: TaskViewerStateComponent;
  let requestedUnitIds: number[];
  let responses: Map<number, Subject<Unit>>;
  let failNextRequest: boolean;
  let routeData$: BehaviorSubject<{unit?: Unit}>;

  function respond(unit: Unit): void {
    responses.get(unit.id).next(unit);
  }

  beforeEach(async () => {
    requestedUnitIds = [];
    responses = new Map();
    failNextRequest = false;
    routeData$ = new BehaviorSubject({unit: bareUnit(1)});

    await TestBed.configureTestingModule({
      declarations: [TaskViewerStateComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {parent: {data: routeData$, snapshot: {data: {}}}},
        },
        {provide: Router, useValue: {navigate: () => {}}},
        {
          provide: UnitService,
          useValue: {
            get: (unitId: number): Observable<Unit> => {
              requestedUnitIds.push(unitId);
              if (failNextRequest) {
                failNextRequest = false;
                return throwError(() => new Error('offline'));
              }
              const response: Subject<Unit> = new Subject();
              responses.set(unitId, response);
              return response;
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(TaskViewerStateComponent, {set: {template: ''}})
      .compileComponents();

    fixture = TestBed.createComponent(TaskViewerStateComponent);
    component = fixture.componentInstance;
  });

  // Task routes resolve the unit progressively, so the unit the route hands over has
  // no task definitions yet. The viewer used it as it was and showed an empty list.
  it('loads the unit so its task definitions reach the list', () => {
    component.ngOnInit();

    expect(requestedUnitIds).toEqual([1]);
    expect(component.loading).toBe(true);
    expect(component.unit).toBeNull();

    respond(loadedUnit(1, '1.1P', '1.2P'));

    expect(component.loading).toBe(false);
    expect(component.loadFailed).toBe(false);
    expect(component.unit.taskDefinitions.map((td) => td.abbreviation)).toEqual(['1.1P', '1.2P']);
  });

  it('uses the unit stream the unit root hands down', () => {
    component.unit$ = new BehaviorSubject(bareUnit(5));
    component.ngOnInit();

    expect(requestedUnitIds).toEqual([5]);
  });

  it('loads the new unit when the route moves to another unit', () => {
    component.ngOnInit();
    respond(loadedUnit(1, '1.1P'));

    routeData$.next({unit: bareUnit(2)});
    expect(component.loading).toBe(true);
    respond(loadedUnit(2, '2.1P'));

    expect(requestedUnitIds).toEqual([1, 2]);
    expect(component.unit.id).toBe(2);
  });

  it('ignores a late answer for the unit the user has left', () => {
    component.ngOnInit();
    routeData$.next({unit: bareUnit(2)});
    respond(loadedUnit(2, '2.1P'));

    respond(loadedUnit(1, '1.1P'));

    expect(component.unit.id).toBe(2);
  });

  it('offers a retry when the unit fails to load', () => {
    failNextRequest = true;
    component.ngOnInit();

    expect(component.loading).toBe(false);
    expect(component.loadFailed).toBe(true);

    component.retryLoad();
    respond(loadedUnit(1, '1.1P'));

    expect(requestedUnitIds).toEqual([1, 1]);
    expect(component.loadFailed).toBe(false);
    expect(component.unit.id).toBe(1);
  });
});
