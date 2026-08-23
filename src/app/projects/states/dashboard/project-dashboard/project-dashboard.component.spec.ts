import {beforeEach, describe, expect, it, vi} from 'vitest';
import {BreakpointObserver} from '@angular/cdk/layout';
import {ActivatedRoute, convertToParamMap} from '@angular/router';
import {BehaviorSubject, Subject, of, tap} from 'rxjs';
import {Project, TaskDefinition, Unit} from 'src/app/api/models/doubtfire-model';
import {ProjectService} from 'src/app/api/services/project.service';
import {UnitService} from 'src/app/api/services/unit.service';
import {UserService} from 'src/app/api/services/user.service';
import {GlobalStateService, ViewType} from '../../index/global-state.service';
import {ProjectDashboardComponent} from './project-dashboard.component';

describe('ProjectDashboardComponent route reuse', () => {
  let firstProject: Project;
  let secondProject: Project;
  let firstUnit: Unit;
  let secondUnit: Unit;

  beforeEach(() => {
    firstUnit = {
      id: 101,
      taskDefinitions: [],
      studentCache: {add: vi.fn()},
    } as unknown as Unit;
    secondUnit = {
      id: 202,
      taskDefinitions: [],
      studentCache: {add: vi.fn()},
    } as unknown as Unit;
    firstProject = {id: 2, targetGrade: 0, unit: firstUnit} as Project;
    secondProject = {id: 18, targetGrade: 0, unit: secondUnit} as Project;
  });

  it('loads and displays each project emitted by a reused parent route', () => {
    const routeProjects: BehaviorSubject<Project> = new BehaviorSubject(firstProject);
    const loadedProjects = new Map([
      [firstProject.id, firstProject],
      [secondProject.id, secondProject],
    ]);
    const loadedUnits = new Map([
      [firstUnit.id, firstUnit],
      [secondUnit.id, secondUnit],
    ]);
    const projectGet = vi.fn(
      (params: {id: number}, options: {mappingCompleteCallback: (project: Project) => void}) => {
        const project = loadedProjects.get(params.id);
        options.mappingCompleteCallback(project);
        return of(project);
      },
    );
    const unitGet = vi.fn((id: number) => of(loadedUnits.get(id)));
    const setView = vi.fn();
    const component = new ProjectDashboardComponent(
      {} as UserService,
      {get: projectGet} as unknown as ProjectService,
      {get: unitGet} as unknown as UnitService,
      {setView} as unknown as GlobalStateService,
      {
        parent: {
          data: of({project: firstProject}),
          snapshot: {paramMap: convertToParamMap({projectId: firstProject.id})},
        },
      } as unknown as ActivatedRoute,
      {observe: () => of({matches: false, breakpoints: {}})} as unknown as BreakpointObserver,
    );
    component.project$ = routeProjects.asObservable();

    component.ngOnInit();
    component.selectedTaskDefinition$.next({id: 999} as TaskDefinition);
    routeProjects.next(secondProject);

    let displayedProject: Project;
    component.project$.subscribe((project) => (displayedProject = project));

    expect(projectGet.mock.calls.map(([params]) => params.id)).toEqual([2, 18]);
    expect(unitGet.mock.calls.map(([id]) => id)).toEqual([101, 202]);
    expect(displayedProject.id).toBe(18);
    expect(component.selectedTaskDefinition$.value).toBeNull();
    expect(setView).toHaveBeenLastCalledWith(ViewType.PROJECT, secondProject);

    component.ngOnDestroy();
  });

  it('ignores a delayed response from an earlier visit to the same project', () => {
    const routeProjects: BehaviorSubject<Project> = new BehaviorSubject(firstProject);
    const projectResponses: Subject<Project>[] = [];
    const projectGet = vi.fn(
      (_params: {id: number}, options: {mappingCompleteCallback: (project: Project) => void}) => {
        const response: Subject<Project> = new Subject();
        projectResponses.push(response);
        return response.pipe(tap((project) => options.mappingCompleteCallback(project)));
      },
    );
    const oldUnit = {...firstUnit, id: 301} as Unit;
    const latestUnit = {...firstUnit, id: 303} as Unit;
    const oldProject = {id: firstProject.id, targetGrade: 0, unit: oldUnit} as Project;
    const latestProject = {id: firstProject.id, targetGrade: 0, unit: latestUnit} as Project;
    const unitGet = vi.fn((id: number) => of(id === latestUnit.id ? latestUnit : oldUnit));
    const component = new ProjectDashboardComponent(
      {} as UserService,
      {get: projectGet} as unknown as ProjectService,
      {get: unitGet} as unknown as UnitService,
      {setView: vi.fn()} as unknown as GlobalStateService,
      {
        parent: {
          data: of({project: firstProject}),
          snapshot: {paramMap: convertToParamMap({projectId: firstProject.id})},
        },
      } as unknown as ActivatedRoute,
      {observe: () => of({matches: false, breakpoints: {}})} as unknown as BreakpointObserver,
    );
    component.project$ = routeProjects.asObservable();

    component.ngOnInit();
    routeProjects.next(secondProject);
    routeProjects.next({...firstProject} as Project);
    projectResponses[2].next(latestProject);
    projectResponses[0].next(oldProject);

    let displayedProject: Project;
    component.project$.subscribe((project) => (displayedProject = project));

    expect(displayedProject).toBe(latestProject);
    expect(unitGet).toHaveBeenCalledTimes(1);
    expect(unitGet).toHaveBeenCalledWith(latestUnit.id);

    component.ngOnDestroy();
  });

  it('cancels a pending unit load when a reused route changes projects', () => {
    const routeProjects: BehaviorSubject<Project> = new BehaviorSubject(firstProject);
    const oldUnitResponse: Subject<Unit> = new Subject();
    const delayedOldUnit = {
      ...firstUnit,
      studentCache: {add: vi.fn()},
    } as unknown as Unit;
    const latestUnit = {...firstUnit, id: 303} as Unit;
    const oldProject = {id: firstProject.id, targetGrade: 0, unit: firstUnit} as Project;
    const latestProject = {id: firstProject.id, targetGrade: 0, unit: latestUnit} as Project;
    const loadedProjects = [oldProject, secondProject, latestProject];
    let projectLoad = 0;
    const projectGet = vi.fn(
      (_params: {id: number}, options: {mappingCompleteCallback: (project: Project) => void}) => {
        const project = loadedProjects[projectLoad++];
        options.mappingCompleteCallback(project);
        return of(project);
      },
    );
    const unitGet = vi.fn((id: number) => {
      if (id === firstUnit.id) {
        return oldUnitResponse;
      }
      return of(id === secondUnit.id ? secondUnit : latestUnit);
    });
    const component = new ProjectDashboardComponent(
      {} as UserService,
      {get: projectGet} as unknown as ProjectService,
      {get: unitGet} as unknown as UnitService,
      {setView: vi.fn()} as unknown as GlobalStateService,
      {
        parent: {
          data: of({project: firstProject}),
          snapshot: {paramMap: convertToParamMap({projectId: firstProject.id})},
        },
      } as unknown as ActivatedRoute,
      {observe: () => of({matches: false, breakpoints: {}})} as unknown as BreakpointObserver,
    );
    component.project$ = routeProjects.asObservable();

    component.ngOnInit();
    routeProjects.next(secondProject);
    routeProjects.next({...firstProject} as Project);
    oldUnitResponse.next(delayedOldUnit);

    let displayedProject: Project;
    component.project$.subscribe((project) => (displayedProject = project));

    expect(displayedProject).toBe(latestProject);
    expect(oldProject.unit).toBe(firstUnit);
    expect(delayedOldUnit.studentCache.add).not.toHaveBeenCalled();

    component.ngOnDestroy();
  });
});
