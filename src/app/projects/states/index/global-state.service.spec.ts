import {EntityCache} from 'ngx-entity-service';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {BreakpointObserver} from '@angular/cdk/layout';
import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {Subject, of} from 'rxjs';
import {
  CampusService,
  LearningOutcomeService,
  Project,
  ProjectService,
  TeachingPeriodService,
  Unit,
  UnitRole,
  UnitRoleService,
  UnitService,
  UserService,
} from 'src/app/api/models/doubtfire-model';
import {AuthenticationService} from 'src/app/api/services/authentication.service';
import {FeedbackTemplateService} from 'src/app/api/services/feedback-template.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {AuthReturnUrlService} from 'src/app/security/auth-return-url.service';
import {GlobalStateService} from './global-state.service';

describe('GlobalStateService project loading', () => {
  let service: GlobalStateService;
  let projectResponse: Subject<Project[]>;
  let queryProjects: ReturnType<typeof vi.fn>;
  let alerts: {error: ReturnType<typeof vi.fn>};
  let originalViewportHeight: string;

  beforeEach(() => {
    vi.useFakeTimers();
    originalViewportHeight = document.body.style.getPropertyValue('--vh');
    // Viewport events are unrelated to project loading. Avoid retaining the
    // service's bound window listeners after each independently created instance.
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    projectResponse = new Subject<Project[]>();
    queryProjects = vi.fn(() => projectResponse);
    alerts = {error: vi.fn()};
    TestBed.configureTestingModule({
      providers: [
        GlobalStateService,
        {
          provide: UnitRoleService,
          useValue: {cache: new EntityCache<UnitRole>(), query: vi.fn(() => of([]))},
        },
        {provide: UnitService, useValue: {cache: new EntityCache<Unit>()}},
        {
          provide: UserService,
          useValue: {
            cache: {clear: vi.fn()},
            currentUser: {isStaff: false, hasRunFirstTimeSetup: true},
          },
        },
        {
          provide: AuthenticationService,
          useValue: {
            attemptLoginUsingRefreshToken: vi.fn((callback: (result: boolean) => void) =>
              callback(true),
            ),
          },
        },
        {
          provide: ProjectService,
          useValue: {cache: new EntityCache<Project>(), query: queryProjects},
        },
        {provide: CampusService, useValue: {query: vi.fn(() => of([]))}},
        {provide: TeachingPeriodService, useValue: {query: vi.fn(() => of([]))}},
        {provide: LearningOutcomeService, useValue: {query: vi.fn(() => of([]))}},
        {provide: FeedbackTemplateService, useValue: {query: vi.fn(() => of([]))}},
        {provide: Router, useValue: {navigateByUrl: vi.fn()}},
        {provide: AlertService, useValue: alerts},
        {provide: BreakpointObserver, useValue: {isMatched: vi.fn(() => false)}},
        {provide: AuthReturnUrlService, useValue: {rememberCurrentUrl: vi.fn()}},
      ],
    });
    service = TestBed.inject(GlobalStateService);
  });

  afterEach(() => {
    projectResponse.complete();
    TestBed.resetTestingModule();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (originalViewportHeight) {
      document.body.style.setProperty('--vh', originalViewportHeight);
    } else {
      document.body.style.removeProperty('--vh');
    }
  });

  it('opens the loading gate with a recoverable error when the project request fails', () => {
    const ready = vi.fn();
    service.onLoad(ready);
    service.loadGlobals();
    expect(queryProjects).toHaveBeenCalledWith(undefined, {
      params: {include_inactive: false, include_task_definitions: true},
    });
    expect(service.isLoadingSubject.value).toBe(true);
    expect(ready).not.toHaveBeenCalled();

    projectResponse.error(new Error('private upstream response'));

    expect(service.projectLoadErrorSubject.value).toBe(true);
    expect(service.isLoadingSubject.value).toBe(false);
    expect(ready).toHaveBeenCalledOnce();
    expect(alerts.error).toHaveBeenCalledExactlyOnceWith(
      'Unable to access the units you study.',
      6000,
    );
    vi.runOnlyPendingTimers();
    expect(ready).toHaveBeenCalledOnce();
  });

  it('keeps successful loads behind the normal completion delay without reporting an error', () => {
    const ready = vi.fn();
    service.onLoad(ready);
    service.loadGlobals();
    projectResponse.next([]);
    projectResponse.complete();

    expect(service.isLoadingSubject.value).toBe(true);
    expect(service.projectLoadErrorSubject.value).toBe(false);
    vi.advanceTimersByTime(799);
    expect(ready).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(service.isLoadingSubject.value).toBe(false);
    expect(ready).toHaveBeenCalledOnce();
    expect(alerts.error).not.toHaveBeenCalled();
  });

  it('clears a previous project error when a subsequent load succeeds', () => {
    service.loadGlobals();
    projectResponse.error(new Error('offline'));
    expect(service.projectLoadErrorSubject.value).toBe(true);

    projectResponse = new Subject<Project[]>();
    queryProjects.mockReturnValue(projectResponse);
    service.loadGlobals();
    expect(service.projectLoadErrorSubject.value).toBe(false);
    expect(service.isLoadingSubject.value).toBe(true);
    projectResponse.next([]);
    projectResponse.complete();
    vi.advanceTimersByTime(800);

    expect(service.isLoadingSubject.value).toBe(false);
    expect(service.projectLoadErrorSubject.value).toBe(false);
    expect(queryProjects).toHaveBeenCalledTimes(2);
  });
});
