import {CachedEntityService, RequestOptions} from 'ngx-entity-service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, map, tap} from 'rxjs';
import API_URL from 'src/app/config/constants/apiUrl';
import {Notification} from '../models/notification';
import {MappingFunctions} from './mapping-fn';

/**
 * Reads and updates the signed in user's notifications.
 *
 * Three of the five endpoints are ordinary entity work and go through
 * CachedEntityService. The other two answer `{count: n}` and `{success: true}`,
 * which are not entities and would not survive the mapping, so those two use
 * HttpClient directly. Each one says so at its own definition.
 *
 * Provided in root rather than declared in doubtfire-angular.module.ts. Every
 * other entity service is registered in that module, but IN-01 to IN-05 are
 * five separate pull requests into the same feature branch and would otherwise
 * all edit the same providers array. PushNotificationService, already merged on
 * this branch, sets the same precedent. Being a root singleton is also why
 * reset() exists, see the note there.
 */
@Injectable({providedIn: 'root'})
export class NotificationService extends CachedEntityService<Notification> {
  protected readonly endpointFormat = 'notifications/:id:';
  private readonly markReadEndpointFormat = 'notifications/:id:/read';

  private readonly unreadCountSubject: BehaviorSubject<number> = new BehaviorSubject(0);

  constructor(private apiHttpClient: HttpClient) {
    super(apiHttpClient, API_URL);

    this.mapping.addKeys(
      'id',
      'notificationType',
      'message',
      'link',
      {
        // Not MappingFunctions.mapDate. read_at is null on every unread
        // notification and new Date(null) is the epoch, not null, so mapDate
        // would report every unread notification as read.
        keys: 'readAt',
        toEntityFn: (data: object, key: string) => (data[key] ? new Date(data[key]) : null),
      },
      {
        keys: 'createdAt',
        toEntityFn: MappingFunctions.mapDate,
      },
    );

    // No mapAllKeysToJsonExcept on purpose. Not one of the five endpoints reads
    // a request body, so this entity is never serialised on the way out.
  }

  public createInstanceFrom(_json: object): Notification {
    return new Notification();
  }

  /**
   * How many unread notifications the signed in user has.
   *
   * A subject and not a request, so the bell subscribes once and every later
   * mark read or delete moves the number without another round trip. It starts
   * at zero and stays there until refreshUnreadCount() is called, so call that
   * on sign in and on navigation rather than trusting the seed.
   */
  public get unreadCount$(): Observable<number> {
    return this.unreadCountSubject.asObservable();
  }

  /**
   * Every notification for the signed in user, newest first.
   *
   * fetchAll and not query, because query answers straight from the cache once
   * it has run, and a notification list that never changes after first paint is
   * worse than useless. fetchAll always goes to the server.
   *
   * The cache is passed explicitly and that is not optional. buildInstance only
   * reuses an entity already in the cache when options.cache is set, and
   * fetchAll does not set it the way query does. Without this line every call
   * would build a fresh set of objects, so a component holding the result of an
   * earlier call would stop seeing later updates to the same rows.
   *
   * There is no paging. GET /notifications returns the lot in one response, it
   * takes unread_only and nothing else, so page client side over what comes
   * back. If real paging is wanted it is an api change, not a change here.
   */
  public list(unreadOnly = false): Observable<Notification[]> {
    const options: RequestOptions<Notification> = {cache: this.cache};

    if (unreadOnly) {
      options.params = {unread_only: true};
    }

    return this.fetchAll(undefined, options).pipe(
      tap((notifications) => {
        if (!unreadOnly) {
          this.evictMissing(notifications);
        }
      }),
    );
  }

  /**
   * Ask the api how many are unread and push the answer to unreadCount$.
   *
   * Direct HttpClient. unread_count answers `{count: n}`, which is not a
   * Notification.
   */
  public refreshUnreadCount(): Observable<number> {
    return this.apiHttpClient.get<{count: number}>(`${API_URL}/notifications/unread_count`).pipe(
      map((response) => response.count),
      tap((count) => this.unreadCountSubject.next(count)),
    );
  }

  /**
   * Mark one notification as read.
   *
   * The api answers with the updated entity, so this goes through update() and
   * the cache corrects itself. The body is empty and the endpoint ignores it.
   */
  public markRead(notification: Notification): Observable<Notification> {
    const wasUnread = !notification.isRead;

    const options: RequestOptions<Notification> = {
      endpointFormat: this.markReadEndpointFormat,
      entity: notification,
    };

    return super.update({id: notification.id}, options).pipe(
      tap(() => {
        // Only when it was unread. mark_read! is a no-op on the api for one
        // already read, so decrementing again would drift the bell below the
        // real count.
        if (wasUnread) {
          this.adjustUnreadCount(-1);
        }

        this.resyncUnreadCount();
      }),
    );
  }

  /**
   * Mark every unread notification as read.
   *
   * Direct HttpClient, because read_all answers `{success: true}`. That leaves
   * the cache holding rows the server now considers read, so they are corrected
   * here. Without it the bell drops to zero while the list still draws every
   * row as unread, which reads as an api bug and is not one.
   *
   * The read time is this machine's clock, because read_all sends none back. It
   * is close enough to display and the next list() replaces it with the server's
   * value.
   */
  public markAllRead(): Observable<void> {
    return this.apiHttpClient.put<{success: boolean}>(`${API_URL}/notifications/read_all`, {}).pipe(
      map(() => void 0),
      tap(() => {
        const readAt = new Date();

        this.cache.currentValues
          .filter((notification) => !notification.isRead)
          .forEach((notification) => {
            notification.readAt = readAt;

            // Writing the property alone announces nothing. Only EntityCache.set
            // calls updateCacheArray, so without this cache.values never emits
            // and an OnPush list bound to it keeps drawing every row unread.
            this.cache.set(notification.key, notification);
          });

        this.unreadCountSubject.next(0);
        this.resyncUnreadCount();
      }),
    );
  }

  /**
   * Delete one notification.
   *
   * Named remove because delete() is inherited and takes path ids. This wraps it
   * so callers pass the entity and the unread count follows. The base class
   * evicts it from the cache.
   */
  public remove(notification: Notification): Observable<void> {
    const wasUnread = !notification.isRead;

    return super.delete<{success: boolean}>(notification.id).pipe(
      map(() => void 0),
      tap(() => {
        if (wasUnread) {
          this.adjustUnreadCount(-1);
        }

        this.resyncUnreadCount();
      }),
    );
  }

  /**
   * Forget everything held for the signed in user.
   *
   * Call this on sign out. The service is provided in root and the app signs out
   * by routing rather than reloading, so without this the cache keeps one
   * person's notification messages and the bell keeps their unread count. On a
   * shared machine the next person to sign in sees both. AuthenticationService
   * already drops the push registration for the same reason.
   */
  public reset(): void {
    this.cache.clear();
    this.unreadCountSubject.next(0);
  }

  /**
   * Drop anything the cache holds that the server did not just send back.
   *
   * fetchAll only ever adds. Without this a notification deleted in another tab
   * stays cached for the rest of the session, and markAllRead would walk over a
   * row that no longer exists.
   *
   * Only correct after an unfiltered list. An unread_only response leaves out
   * every read notification deliberately, so evicting on that would throw away
   * rows that are still there.
   */
  private evictMissing(present: Notification[]): void {
    const keep = new Set(present.map((notification) => notification.key));

    // currentValues is a live readonly view, so collect the doomed keys before
    // deleting rather than mutating while walking it.
    this.cache.currentValues
      .filter((notification) => !keep.has(notification.key))
      .map((notification) => notification.key)
      .forEach((key) => this.cache.delete(key));
  }

  /**
   * Move the unread count without going back to the api.
   *
   * Floored at zero. A negative badge is a worse thing to show than a stale one.
   */
  private adjustUnreadCount(delta: number): void {
    this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value + delta));
  }

  /**
   * Re-read the count from the api without making the caller wait for it.
   *
   * Every mutation adjusts the count locally first so the bell moves straight
   * away, then calls this. The local arithmetic drifts: two mark read calls
   * raised before either answers both see the row as unread and both subtract
   * one, and nothing local can know about a notification another tab created or
   * deleted. The server number is the real one, so take it while we are already
   * talking to the server.
   *
   * Errors are swallowed on purpose. A count that failed to refresh is not worth
   * failing the action the user actually asked for.
   */
  private resyncUnreadCount(): void {
    this.refreshUnreadCount().subscribe({error: () => undefined});
  }
}
