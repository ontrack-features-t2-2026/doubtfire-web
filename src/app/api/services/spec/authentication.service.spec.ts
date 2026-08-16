import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {provideHttpClient, withInterceptorsFromDi, withXhr} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {Injector} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {Subject, of, throwError} from 'rxjs';
import {UserService} from 'src/app/api/models/doubtfire-model';
import {AppInjector, setAppInjector} from 'src/app/app-injector';
import {AlertService} from 'src/app/common/services/alert.service';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {GlobalStateService} from 'src/app/projects/states/index/global-state.service';
import {AuthenticationService} from '../authentication.service';
import {PushNotificationService} from '../push-notification.service';

const API_URL = 'http://localhost:3000/api';
const AUTH_URL = `${API_URL}/auth`;

/**
 * Sign out has to drop this browser's push registration, otherwise the next
 * person to sign in on a shared machine keeps receiving the previous user's
 * notifications. These tests pin that behaviour at the sign out boundary:
 * push is torn down while the token is still valid, and a failure tearing it
 * down never traps the user signed in.
 *
 * The push tear down itself (DELETE /push_subscriptions then the browser
 * unsubscribe, and the "never throw" wrapper) is covered in
 * push-notification.service.spec.ts. Here PushNotificationService is a mock so
 * these tests only describe what AuthenticationService.signOut does with it.
 */
describe('AuthenticationService sign out', () => {
  let service: AuthenticationService;
  let httpMock: HttpTestingController;

  let pushService: {unsubscribeQuietly: ReturnType<typeof vi.fn>};
  let globalState: {
    clearUnitsAndProjects: ReturnType<typeof vi.fn>;
    hideHeader: ReturnType<typeof vi.fn>;
    setView: ReturnType<typeof vi.fn>;
    loadGlobals: ReturnType<typeof vi.fn>;
  };
  let userService: {
    currentUser: {authenticationToken?: string};
    anonymousUser: {authenticationToken?: string};
    cache: {clear: ReturnType<typeof vi.fn>};
  };
  let router: {navigateByUrl: ReturnType<typeof vi.fn>};

  // signOut resolves PushNotificationService and GlobalStateService through
  // AppInjector rather than the constructor (its comment explains this avoids a
  // circular dependency). This stub injector hands back the mocks above. It is
  // set once, and reads them through its closure so each test's fresh mocks flow
  // through. setAppInjector is only ever called by the app module otherwise, so
  // in a unit test AppInjector starts unset and this is the only writer.
  const injectorStub = {
    get: (token: unknown) => {
      if (token === PushNotificationService) {
        return pushService;
      }
      if (token === GlobalStateService) {
        return globalState;
      }
      throw new Error(`unexpected AppInjector token: ${String(token)}`);
    },
  } as unknown as Injector;

  beforeEach(() => {
    pushService = {unsubscribeQuietly: vi.fn().mockReturnValue(of(void 0))};
    globalState = {
      clearUnitsAndProjects: vi.fn(),
      hideHeader: vi.fn(),
      setView: vi.fn(),
      loadGlobals: vi.fn(),
    };

    const anonymousUser = {authenticationToken: undefined};
    userService = {
      currentUser: {authenticationToken: 'token-for-user-a'},
      anonymousUser,
      cache: {clear: vi.fn()},
    };
    router = {navigateByUrl: vi.fn()};

    if (!AppInjector) {
      setAppInjector(injectorStub);
    }

    TestBed.configureTestingModule({
      providers: [
        AuthenticationService,
        {provide: UserService, useValue: userService as unknown as UserService},
        {provide: Router, useValue: router},
        {provide: AlertService, useValue: {error: vi.fn()}},
        {provide: DoubtfireConstants, useValue: {API_URL, SignoutURL: undefined}},
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthenticationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // The shared computer case. The push registration belongs to whoever enabled
  // it and the browser keeps it across sign out, so it has to be dropped while
  // the token is still valid. DELETE /push_subscriptions needs that token, which
  // is why the unsubscribe must finish before the token is deleted.
  it('unsubscribes from push before the auth token is deleted', () => {
    // Hold the unsubscribe open so we can prove the token is not deleted first.
    const unsubscribeGate: Subject<void> = new Subject();
    pushService.unsubscribeQuietly.mockReturnValue(unsubscribeGate);

    service.signOut();

    expect(pushService.unsubscribeQuietly).toHaveBeenCalledTimes(1);
    // The token is still needed for the push delete, so it must not be gone yet.
    httpMock.expectNone((r) => r.url === AUTH_URL && r.method === 'DELETE');

    // Unsubscribe finishes, and only now may the token go.
    unsubscribeGate.next();
    unsubscribeGate.complete();

    const tokenDelete = httpMock.expectOne((r) => r.url === AUTH_URL && r.method === 'DELETE');
    expect(tokenDelete.request.params.get('remember')).toBe('false');
    tokenDelete.flush(null);

    // The browser is signed out now, so the next person starts unsubscribed.
    expect(userService.currentUser).toBe(userService.anonymousUser);
  });

  // unsubscribeQuietly is the "never throw" variant, and sign out is also wired
  // to continue on error. Either way a failed unsubscribe must not leave the
  // user stuck signed in.
  it('still completes sign out when the push unsubscribe fails', () => {
    pushService.unsubscribeQuietly.mockReturnValue(
      throwError(() => new Error('push unsubscribe failed')),
    );

    service.signOut();

    // The failure did not stop the token being deleted or the user signing out.
    httpMock.expectOne((r) => r.url === AUTH_URL && r.method === 'DELETE').flush(null);

    expect(userService.currentUser).toBe(userService.anonymousUser);
  });

  // With no one signed in there is no subscription tied to a user and no token,
  // so signing out must not call push or the auth api at all.
  it('does not touch push or the token when no user is signed in', () => {
    userService.currentUser = {authenticationToken: undefined};

    service.signOut();

    expect(pushService.unsubscribeQuietly).not.toHaveBeenCalled();
    httpMock.expectNone((r) => r.url === AUTH_URL && r.method === 'DELETE');
    expect(userService.currentUser).toBe(userService.anonymousUser);
  });
});
