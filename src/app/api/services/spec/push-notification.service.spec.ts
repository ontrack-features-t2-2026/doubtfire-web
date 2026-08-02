import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {provideHttpClient, withInterceptorsFromDi, withXhr} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {SwPush} from '@angular/service-worker';
import {BehaviorSubject} from 'rxjs';
import API_URL from 'src/app/config/constants/apiUrl';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {PushNotificationService} from '../push-notification.service';

const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/test-browser';

/**
 * Enough of a PushSubscription for the service. The real one comes from the
 * browser and cannot be constructed in a test environment.
 */
function fakeSubscription() {
  return {
    endpoint: ENDPOINT,
    toJSON: () => ({
      endpoint: ENDPOINT,
      keys: {p256dh: 'BFakePublicKey', auth: 'FakeAuthSecret'},
    }),
  } as unknown as PushSubscription;
}

describe('PushNotificationService', () => {
  let service: PushNotificationService;
  let httpMock: HttpTestingController;
  let swPush: {
    isEnabled: boolean;
    subscription: BehaviorSubject<PushSubscription | null>;
    requestSubscription: ReturnType<typeof vi.fn>;
    unsubscribe: ReturnType<typeof vi.fn>;
  };
  let constants: {IsPushEnabled: BehaviorSubject<boolean>; VapidPublicKey: BehaviorSubject<string>};

  beforeEach(() => {
    swPush = {
      isEnabled: true,
      subscription: new BehaviorSubject<PushSubscription | null>(null),
      requestSubscription: vi.fn().mockResolvedValue(fakeSubscription()),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
    };
    constants = {
      IsPushEnabled: new BehaviorSubject<boolean>(true),
      VapidPublicKey: new BehaviorSubject<string>('BTestVapidPublicKey'),
    };

    // jsdom has neither, and the service checks for both.
    vi.stubGlobal('Notification', {permission: 'default'});
    (window as unknown as {PushManager: unknown}).PushManager = class {};

    TestBed.configureTestingModule({
      providers: [
        PushNotificationService,
        {provide: SwPush, useValue: swPush},
        {provide: DoubtfireConstants, useValue: constants},
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PushNotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.unstubAllGlobals();
  });

  it('posts the browser registration to the api when subscribing', () => {
    service.subscribe().subscribe();

    // requestSubscription resolves a promise, so the POST is a microtask away.
    return Promise.resolve().then(() => {
      const request = httpMock.expectOne(`${API_URL}/push_subscriptions`);

      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({
        endpoint: ENDPOINT,
        p256dh: 'BFakePublicKey',
        auth: 'FakeAuthSecret',
      });
      request.flush(null);
    });
  });

  it('asks the browser to subscribe with the key the api supplied', () => {
    service.subscribe().subscribe();

    expect(swPush.requestSubscription).toHaveBeenCalledWith({
      serverPublicKey: 'BTestVapidPublicKey',
    });

    return Promise.resolve().then(() => {
      httpMock.expectOne(`${API_URL}/push_subscriptions`).flush(null);
    });
  });

  it('deletes on the api before unsubscribing in the browser', () => {
    swPush.subscription.next(fakeSubscription());

    service.unsubscribe().subscribe();

    const request = httpMock.expectOne(
      (r) => r.url === `${API_URL}/push_subscriptions` && r.method === 'DELETE',
    );

    // Order matters. Unsubscribing first would throw the endpoint away and leave
    // a row on the api that nothing can ever delete.
    expect(swPush.unsubscribe).not.toHaveBeenCalled();
    expect(request.request.params.get('endpoint')).toBe(ENDPOINT);

    request.flush(null);
    expect(swPush.unsubscribe).toHaveBeenCalled();
  });

  it('does nothing when unsubscribing a browser that was never subscribed', () => {
    swPush.subscription.next(null);

    service.unsubscribe().subscribe();

    expect(swPush.unsubscribe).not.toHaveBeenCalled();
    httpMock.expectNone(`${API_URL}/push_subscriptions`);
  });

  it('reports nothing blocking when the service worker is running and keys are set', () => {
    expect(service.blocker()).toBeNull();
  });

  it('reports the service worker as the blocker during the first six seconds', () => {
    swPush.isEnabled = false;

    expect(service.blocker()).toBe('no-service-worker');
  });

  it('reports a blocker when the api has no vapid keys', () => {
    constants.IsPushEnabled.next(false);

    expect(service.blocker()).toBe('not-configured');
  });

  it('reports a blocker when the user has denied notifications', () => {
    vi.stubGlobal('Notification', {permission: 'denied'});

    expect(service.blocker()).toBe('permission-denied');
  });

  it('reports a blocker when the browser cannot do push at all', () => {
    delete (window as unknown as {PushManager?: unknown}).PushManager;

    expect(service.blocker()).toBe('unsupported');
  });
});
