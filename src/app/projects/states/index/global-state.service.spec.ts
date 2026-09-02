import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Subject} from 'rxjs';
import {AuthenticationService} from 'src/app/api/services/authentication.service';
import {GlobalStateService, STARTUP_TIMEOUT_MS} from './global-state.service';

type RefreshCallback = Parameters<AuthenticationService['attemptLoginUsingRefreshToken']>[0];

describe('GlobalStateService startup', () => {
  let service: GlobalStateService;
  let authCallback: RefreshCallback;
  let authentication: {
    attemptLoginUsingRefreshToken: ReturnType<typeof vi.fn>;
    isAuthenticated: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };
  let campuses: Subject<unknown[]>;
  let teachingPeriods: Subject<unknown[]>;
  let unitRoles: Subject<unknown[]>;
  let projects: Subject<unknown[]>;
  let campusService: {query: ReturnType<typeof vi.fn>};
  let teachingPeriodService: {query: ReturnType<typeof vi.fn>};
  let unitRoleService: {cache: object; query: ReturnType<typeof vi.fn>};
  let projectService: {cache: object; query: ReturnType<typeof vi.fn>};
  let router: {navigateByUrl: ReturnType<typeof vi.fn>};

  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    campuses = new Subject();
    teachingPeriods = new Subject();
    unitRoles = new Subject();
    projects = new Subject();
    campusService = {query: vi.fn(() => campuses.asObservable())};
    teachingPeriodService = {query: vi.fn(() => teachingPeriods.asObservable())};
    unitRoleService = {cache: emptyCache(), query: vi.fn(() => unitRoles.asObservable())};
    projectService = {cache: emptyCache(), query: vi.fn(() => projects.asObservable())};
    router = {navigateByUrl: vi.fn()};
    authentication = {
      attemptLoginUsingRefreshToken: vi.fn((callback: RefreshCallback) => {
        authCallback = callback;
      }),
      isAuthenticated: vi.fn(() => true),
      signOut: vi.fn(),
    };

    service = new GlobalStateService(
      unitRoleService as never,
      {cache: emptyCache()} as never,
      {currentUser: {isStaff: false, hasRunFirstTimeSetup: true}, cache: emptyCache()} as never,
      authentication as never,
      projectService as never,
      campusService as never,
      teachingPeriodService as never,
      {query: vi.fn()} as never,
      {query: vi.fn()} as never,
      router as never,
      {error: vi.fn()} as never,
      {isActive: vi.fn(() => false)} as never,
      {rememberCurrentUrl: vi.fn()} as never,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    service.ngOnDestroy();
  });

  it('removes serial project loading and the artificial final delay', () => {
    service.loadGlobals();
    expect(unitRoleService.query).not.toHaveBeenCalled();
    expect(projectService.query).not.toHaveBeenCalled();

    campuses.next([]);
    campuses.complete();
    teachingPeriods.next([]);
    teachingPeriods.complete();

    expect(unitRoleService.query).toHaveBeenCalledOnce();
    expect(projectService.query).toHaveBeenCalledOnce();

    unitRoles.next([]);
    unitRoles.complete();
    projects.next([]);
    projects.complete();

    expect(service.startupStateSubject.value.status).toBe('ready');
    expect(service.isLoadingSubject.value).toBe(false);
  });

  it('publishes a recoverable terminal state when a required request fails', () => {
    service.loadGlobals();
    campuses.error(new Error('network failed'));

    expect(service.startupStateSubject.value).toMatchObject({
      status: 'error',
      failedResource: 'campuses',
    });
    expect(service.startupStateSubject.value.message).toContain('campuses');
    expect(service.isLoadingSubject.value).toBe(true);
  });

  it('labels a required-request failure as offline when the browser is offline', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);

    service.loadGlobals();
    campuses.error(new Error('network failed'));

    expect(service.startupStateSubject.value).toMatchObject({
      status: 'offline',
      failedResource: 'campuses',
    });
    expect(service.startupStateSubject.value.message).toContain('offline');
  });

  it('times out an otherwise permanent startup wait', async () => {
    vi.useFakeTimers();
    service.loadGlobals();

    await vi.advanceTimersByTimeAsync(STARTUP_TIMEOUT_MS + 1);

    expect(service.startupStateSubject.value.status).toBe('error');
    expect(service.startupStateSubject.value.message).toContain('taking longer than expected');
  });

  it('retries refresh-token hydration without routing away after a transient failure', () => {
    authCallback(false, 'timeout');
    expect(service.startupStateSubject.value).toMatchObject({
      status: 'error',
      phase: 'authentication',
    });
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    authentication.isAuthenticated.mockReturnValue(false);
    service.retryStartup();

    expect(authentication.attemptLoginUsingRefreshToken).toHaveBeenCalledTimes(2);
    expect(service.startupStateSubject.value.status).toBe('loading');
  });
});

function emptyCache(): object {
  return {
    clear: vi.fn(),
    values: new Subject().asObservable(),
    currentValues: [],
  };
}
