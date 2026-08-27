import {beforeEach, describe, expect, it, vi} from 'vitest';
import {BreakpointObserver} from '@angular/cdk/layout';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute} from '@angular/router';
import {EMPTY, Subject, of} from 'rxjs';
import {Project, Task, TaskDefinition} from 'src/app/api/models/doubtfire-model';
import {ProjectService} from 'src/app/api/services/project.service';
import {TaskService} from 'src/app/api/services/task.service';
import {UnitService} from 'src/app/api/services/unit.service';
import {UserService} from 'src/app/api/services/user.service';
import {GlobalStateService} from '../../index/global-state.service';
import {ProjectDashboardComponent} from './project-dashboard.component';

describe('ProjectDashboardComponent task selection', () => {
  let component: ProjectDashboardComponent;
  let fixture: ComponentFixture<ProjectDashboardComponent>;
  let taskStatusUpdated$: Subject<Task>;
  let taskSubmissionCompleted$: Subject<Task>;

  const project = {id: 7} as Project;
  const selectedTaskDefinition = {id: 42} as TaskDefinition;

  beforeEach(async () => {
    taskStatusUpdated$ = new Subject<Task>();
    taskSubmissionCompleted$ = new Subject<Task>();

    await TestBed.configureTestingModule({
      declarations: [ProjectDashboardComponent],
      providers: [
        {provide: UserService, useValue: {}},
        {provide: ProjectService, useValue: {get: () => EMPTY}},
        {
          provide: TaskService,
          useValue: {taskStatusUpdated$, taskSubmissionCompleted$},
        },
        {provide: UnitService, useValue: {}},
        {provide: GlobalStateService, useValue: {setView: vi.fn()}},
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              snapshot: {
                data: {project},
                paramMap: {get: () => String(project.id)},
              },
            },
          },
        },
        {
          provide: BreakpointObserver,
          useValue: {observe: () => of({matches: false, breakpoints: {}})},
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ProjectDashboardComponent, {set: {template: ''}})
      .compileComponents();

    fixture = TestBed.createComponent(ProjectDashboardComponent);
    component = fixture.componentInstance;
    component.project$ = of(project);
    fixture.detectChanges();
    component.selectedTaskDefinition$.next(selectedTaskDefinition);
  });

  it('keeps the selected task when an unrelated status-change event is emitted', () => {
    taskStatusUpdated$.next({project, definition: selectedTaskDefinition} as Task);

    expect(component.selectedTaskDefinition$.value).toBe(selectedTaskDefinition);
  });

  it('returns to the dashboard after the selected task submission completes', () => {
    taskSubmissionCompleted$.next({project, definition: selectedTaskDefinition} as Task);

    expect(component.selectedTaskDefinition$.value).toBeNull();
  });

  it('ignores submission events from another project or task definition', () => {
    taskSubmissionCompleted$.next({
      project: {id: project.id + 1},
      definition: selectedTaskDefinition,
    } as Task);
    expect(component.selectedTaskDefinition$.value).toBe(selectedTaskDefinition);

    taskSubmissionCompleted$.next({
      project,
      definition: {id: selectedTaskDefinition.id + 1},
    } as Task);
    expect(component.selectedTaskDefinition$.value).toBe(selectedTaskDefinition);
  });
});
