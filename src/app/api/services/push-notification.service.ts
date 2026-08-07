import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {SwPush} from '@angular/service-worker';
import {Observable, catchError, from, map, of, switchMap, take} from 'rxjs';
import API_URL from 'src/app/config/constants/apiUrl';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';

/**
 * Why the browser cannot be subscribed to push right now, or null if it can.
 */
export type PushBlocker =
  | 'no-service-worker'
  | 'not-configured'
  | 'permission-denied'
  | 'unsupported';

@Injectable({providedIn: 'root'})
export class PushNotificationService {
  private readonly endpoint = `${API_URL}/push_subscriptions`;

  constructor(
    private http: HttpClient,
    private swPush: SwPush,
    private constants: DoubtfireConstants,
  ) {}

  /**
   * Emits the current subscription, or null when this browser is not subscribed.
   *
   * The service worker registers six seconds after bootstrap
   * (doubtfire-angular.module.ts), so this is null on load and then changes.
   * Subscribe to it rather than reading it once.
   */
  public get subscription$(): Observable<PushSubscription | null> {
    return this.swPush.subscription;
  }

  /**
   * Whether the service worker is running. False in a build without it, and
   * false for the first six seconds of every page load.
   */
  public get isEnabled(): boolean {
    return this.swPush.isEnabled;
  }

  /**
   * What is stopping this browser subscribing, or null if nothing is.
   */
  public blocker(): PushBlocker | null {
    if (typeof Notification === 'undefined' || !('PushManager' in window)) {
      return 'unsupported';
    }
    if (Notification.permission === 'denied') {
      return 'permission-denied';
    }
    if (!this.constants.IsPushEnabled.value || !this.constants.VapidPublicKey.value) {
      return 'not-configured';
    }
    if (!this.swPush.isEnabled) {
      return 'no-service-worker';
    }
    return null;
  }

  /**
   * Ask the browser for permission, then store the resulting registration
   * against the signed in user.
   *
   * Call this from a click and nowhere else. requestSubscription needs an active
   * service worker and a user gesture; called during app init it fails in a way
   * that looks nothing like the real cause.
   */
  public subscribe(): Observable<void> {
    return from(
      this.swPush.requestSubscription({
        serverPublicKey: this.constants.VapidPublicKey.value,
      }),
    ).pipe(
      switchMap((subscription) => {
        const keys = subscription.toJSON().keys ?? {};
        return this.http.post<void>(this.endpoint, {
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        });
      }),
    );
  }

  /**
   * Stop this browser receiving push, both in the browser and on the api.
   *
   * The api call goes first and on purpose: once swPush.unsubscribe() has run
   * the endpoint is gone from this page, and a row nobody can delete would sit
   * there until the push service returned 410 for it.
   */
  public unsubscribe(): Observable<void> {
    // take(1) matters. swPush.subscription never completes, so without it the
    // returned observable would stay open forever and re-fire on every change.
    return this.swPush.subscription.pipe(
      take(1),
      switchMap((subscription) => {
        if (!subscription) {
          return of(void 0);
        }

        return this.http
          .delete<void>(this.endpoint, {params: {endpoint: subscription.endpoint}})
          .pipe(
            // Server cleanup failing must not leave the browser subscribed. If
            // the delete fails we still unsubscribe locally: the browser stops
            // receiving immediately, and the row left behind is removed the
            // first time the push service answers 410 for it, which deliver_to
            // in PushNotificationService already handles.
            catchError(() => of(void 0)),
            switchMap(() => from(this.swPush.unsubscribe())),
            map(() => void 0),
          );
      }),
    );
  }

  /**
   * Unsubscribe, but never fail.
   *
   * For sign out, where the caller cannot do anything useful with an error and
   * must not be blocked by one. Prefer unsubscribe() anywhere a person is
   * waiting on the result and should be told it did not work.
   */
  public unsubscribeQuietly(): Observable<void> {
    return this.unsubscribe().pipe(catchError(() => of(void 0)));
  }
}
