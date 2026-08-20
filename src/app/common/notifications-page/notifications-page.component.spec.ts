import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {Observable, Subject, defer, of, throwError} from 'rxjs';
import {Notification} from 'src/app/api/models/notification';
import {AuthenticationService} from 'src/app/api/services/authentication.service';
import {NotificationRouteService} from 'src/app/api/services/notification-route.service';
import {NotificationService} from 'src/app/api/services/notification.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {NotificationsPageComponent} from './notifications-page.component';

/**
 * Three of these are the states the ticket names, loading, empty and the list
 * itself, and they are tested through the rendered page because that is where
 * the difference between them lives. The fourth is the one the ticket does not
 * name and is the same trap as in the dropdown: a request that failed must not
 * be drawn as a user with no notifications.
 *
 * The paging tests drive the real paginator rather than calling onPage, so the
 * binding between them counts. They hold the api at arm's length deliberately:
 * there is one fetch and one only, and every page after the first has to come
 * out of what is already here.
 */
describe('NotificationsPageComponent', () => {
  let component: NotificationsPageComponent;
  let fixture: ComponentFixture<NotificationsPageComponent>;

  let list: Subject<Notification[]>;
  let subscribedTo: Set<string>;
  let notificationService: {
    list: ReturnType<typeof vi.fn>;
    markRead: ReturnType<typeof vi.fn>;
  };
  let authenticationService: {afterAuthCall: ReturnType<typeof vi.fn>};
  let alerts: {success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>};
  let router: {navigateByUrl: ReturnType<typeof vi.fn>};
  let notificationRoutes: {navigate: ReturnType<typeof vi.fn>};

  /**
   * A stand-in that records whether anybody actually subscribed.
   *
   * A spy that only counts calls is happy either way, and markRead returns a
   * cold observable, so dropping the .subscribe() sends no request at all while
   * the call count stays exactly the same.
   */
  const answers = <T>(name: string, value: T): Observable<T> =>
    defer(() => {
      subscribedTo.add(name);
      return of(value);
    });

  const notification = (id: number, over: Partial<Notification> = {}): Notification => {
    const built = new Notification();
    built.id = id;
    built.message = `notification ${id}`;
    built.link = `/projects/${id}/dashboard`;
    built.notificationType = 'feedback';
    built.readAt = null;
    // Newest id first, so a page of them reads in a checkable order.
    built.createdAt = new Date(2026, 0, 1, 0, 0, id);
    return Object.assign(built, over);
  };

  const many = (count: number): Notification[] =>
    Array.from({length: count}, (_unused, index) => notification(count - index));

  const rows = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.notification-row'));

  const rowText = (): string[] =>
    rows().map((row) => row.querySelector('.notification-message').textContent.trim());

  const pageText = (): string => fixture.nativeElement.textContent;

  const paginator = (): MatPaginator =>
    fixture.debugElement.query(By.directive(MatPaginator)).componentInstance;

  beforeEach(async () => {
    list = new Subject<Notification[]>();
    subscribedTo = new Set<string>();

    notificationService = {
      list: vi.fn().mockReturnValue(list),
      markRead: vi.fn(() => answers('markRead', undefined)),
    };
    // Signed in and settled, unless a test says otherwise.
    authenticationService = {afterAuthCall: vi.fn((callback) => callback(true))};
    alerts = {success: vi.fn(), error: vi.fn()};
    router = {navigateByUrl: vi.fn()};
    notificationRoutes = {navigate: vi.fn().mockResolvedValue(true)};

    await TestBed.configureTestingModule({
      declarations: [NotificationsPageComponent],
      imports: [
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        NoopAnimationsModule,
      ],
      providers: [
        {provide: NotificationService, useValue: notificationService},
        {provide: AuthenticationService, useValue: authenticationService},
        {provide: AlertService, useValue: alerts},
        {provide: Router, useValue: router},
        {provide: NotificationRouteService, useValue: notificationRoutes},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsPageComponent);
    component = fixture.componentInstance;
  });

  it('says it is loading before the list arrives', () => {
    fixture.detectChanges();

    expect(pageText()).toContain('Loading your notifications');
    expect(rows()).toHaveLength(0);

    list.next([notification(1)]);
    fixture.detectChanges();

    expect(pageText()).not.toContain('Loading your notifications');
    expect(rows()).toHaveLength(1);
  });

  it('says something friendly when there is nothing to show', () => {
    fixture.detectChanges();

    list.next([]);
    fixture.detectChanges();

    expect(pageText()).toContain('You have no notifications yet');
    expect(rows()).toHaveLength(0);
  });

  it('says it could not load rather than claiming there is nothing', () => {
    fixture.detectChanges();

    list.error(new Error('GET /notifications failed'));
    fixture.detectChanges();

    expect(pageText()).toContain('could not load');
    expect(pageText()).not.toContain('You have no notifications yet');
  });

  it('reads the list again when the retry is clicked', () => {
    fixture.detectChanges();
    list.error(new Error('GET /notifications failed'));
    fixture.detectChanges();

    list = new Subject<Notification[]>();
    notificationService.list.mockReturnValue(list);

    fixture.nativeElement.querySelector('.notifications-retry').click();
    fixture.detectChanges();

    expect(notificationService.list).toHaveBeenCalledTimes(2);
    expect(pageText()).toContain('Loading your notifications');

    list.next([notification(1)]);
    fixture.detectChanges();

    expect(rowText()).toEqual(['notification 1']);
  });

  it('shows the newest first', () => {
    fixture.detectChanges();

    list.next([notification(1), notification(3), notification(2)]);
    fixture.detectChanges();

    expect(rowText()).toEqual(['notification 3', 'notification 2', 'notification 1']);
  });

  it('makes each row a real button so a keyboard can open it', () => {
    fixture.detectChanges();
    list.next([notification(1)]);
    fixture.detectChanges();

    // Structural, and it has to be. A mat-list-item on its own is static list
    // content: no focus, no Enter, no Space. Only the element type gives the
    // row those, and the test environment does not simulate the browser
    // behaviour that would let this be asserted any other way.
    expect(rows()[0].tagName).toBe('BUTTON');
  });

  it('gives each category the same icon and colour the dropdown gives it', () => {
    fixture.detectChanges();
    list.next([
      notification(5, {notificationType: 'feedback'}),
      notification(4, {notificationType: 'task'}),
      notification(3, {notificationType: 'portfolio'}),
      notification(2, {notificationType: 'extension'}),
      notification(1, {notificationType: 'general'}),
    ]);
    fixture.detectChanges();

    const glyphs: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.notification-glyph'),
    );

    expect(glyphs.map((g) => g.querySelector('mat-icon').textContent.trim())).toEqual([
      'chat_bubble',
      'assignment',
      'collections_bookmark',
      'more_time',
      'campaign',
    ]);
    expect(glyphs.map((g) => Array.from(g.classList).find((n) => n.startsWith('tone-')))).toEqual([
      'tone-feedback',
      'tone-task',
      'tone-portfolio',
      'tone-extension',
      'tone-general',
    ]);
  });

  it('still draws something for a category it has never heard of', () => {
    fixture.detectChanges();
    list.next([notification(1, {notificationType: 'announcement'})]);
    fixture.detectChanges();

    const glyph = fixture.nativeElement.querySelector('.notification-glyph');

    expect(glyph.querySelector('mat-icon').textContent.trim()).toBe('notifications');
    expect(Array.from(glyph.classList)).toContain('tone-general');
  });

  it('says unread in words, not only in bold', () => {
    fixture.detectChanges();
    list.next([
      notification(2, {message: 'Andrew Cain commented on 1.1P.'}),
      notification(1, {message: 'Your extension was granted.', readAt: new Date(2026, 0, 2)}),
    ]);
    fixture.detectChanges();

    expect(rows()[0].getAttribute('aria-label')).toContain('Unread.');
    expect(rows()[1].getAttribute('aria-label')).toContain('Read.');
  });

  it('shows one page at a time out of a single fetch', () => {
    fixture.detectChanges();

    list.next(many(45));
    fixture.detectChanges();

    expect(rows()).toHaveLength(20);
    expect(rowText()[0]).toBe('notification 45');
    expect(paginator().length).toBe(45);

    // Through the paginator and not through onPage. Calling the handler
    // directly passes just as well with the (page) binding deleted, and then
    // the real Next button does nothing.
    paginator().nextPage();
    fixture.detectChanges();

    expect(rowText()[0]).toBe('notification 25');
    expect(rows()).toHaveLength(20);

    // The last page is the short one, and it is where an off by one shows up.
    paginator().nextPage();
    fixture.detectChanges();

    expect(rows()).toHaveLength(5);
    expect(rowText()).toEqual([
      'notification 5',
      'notification 4',
      'notification 3',
      'notification 2',
      'notification 1',
    ]);

    // One request for the whole thing. Paging is over what is already here,
    // because the api has no page parameters to send.
    expect(notificationService.list).toHaveBeenCalledTimes(1);
  });

  it('follows a change of page size', () => {
    fixture.detectChanges();
    list.next(many(45));
    fixture.detectChanges();

    paginator()._changePageSize(50);
    fixture.detectChanges();

    expect(rows()).toHaveLength(45);
  });

  it('does not strand the reader past the end when a reload is shorter', () => {
    fixture.detectChanges();
    list.next(many(45));
    fixture.detectChanges();

    paginator().nextPage();
    paginator().nextPage();
    fixture.detectChanges();
    expect(rows()).toHaveLength(5);

    // Same page number, far fewer notifications behind it. Left alone this
    // renders an empty page with a paginator insisting it is page three of one.
    list = new Subject<Notification[]>();
    notificationService.list.mockReturnValue(list);
    component.load();
    list.next(many(4));
    fixture.detectChanges();

    expect(component.pageIndex).toBe(0);
    expect(rows()).toHaveLength(4);
  });

  it('marks a row read and follows its link when it is clicked', () => {
    fixture.detectChanges();
    list.next([notification(1, {link: '/projects/9/dashboard'})]);
    fixture.detectChanges();

    rows()[0].click();

    expect(notificationService.markRead).toHaveBeenCalledTimes(1);
    expect(notificationService.markRead.mock.calls[0][0].id).toBe(1);
    expect(subscribedTo.has('markRead')).toBe(true);
    expect(notificationRoutes.navigate).toHaveBeenCalledWith('/projects/9/dashboard');
  });

  it('does not mark a row read twice', () => {
    fixture.detectChanges();
    list.next([notification(1, {readAt: new Date(2026, 0, 2)})]);
    fixture.detectChanges();

    rows()[0].click();

    expect(notificationService.markRead).not.toHaveBeenCalled();
    expect(notificationRoutes.navigate).toHaveBeenCalledTimes(1);
  });

  it('marks a row read even when it has nowhere to go', () => {
    fixture.detectChanges();
    list.next([notification(1, {link: null})]);
    fixture.detectChanges();

    rows()[0].click();

    // link is nullable on the api. Refusing to mark it read would leave a
    // number on the bell that the user has no way to clear.
    expect(notificationService.markRead).toHaveBeenCalledTimes(1);
    expect(notificationRoutes.navigate).toHaveBeenCalledWith(null);
  });

  it('says so when a notification could not be marked as read', () => {
    notificationService.markRead.mockReturnValue(throwError(() => new Error('PUT read failed')));

    fixture.detectChanges();
    list.next([notification(1, {link: null})]);
    fixture.detectChanges();

    rows()[0].click();

    expect(alerts.error).toHaveBeenCalledTimes(1);
  });

  describe('before anyone is signed in', () => {
    it('asks nothing of the api until authentication has settled', () => {
      let resume: (signedIn: boolean) => void;
      authenticationService.afterAuthCall.mockImplementation((callback) => {
        resume = callback;
      });

      fixture.detectChanges();

      // An anonymous GET /notifications comes back 403, and HttpErrorInterceptor
      // reads a 403 on an anonymous user as an expired session: it alerts
      // "Authentication timed out" and redirects to /timeout. Opening a
      // bookmark while signed out would look like being thrown out.
      expect(notificationService.list).not.toHaveBeenCalled();

      resume(true);
      fixture.detectChanges();

      expect(notificationService.list).toHaveBeenCalledTimes(1);
    });

    it('sends the visitor to sign in instead of asking the api', () => {
      authenticationService.afterAuthCall.mockImplementation((callback) => callback(false));

      fixture.detectChanges();

      expect(notificationService.list).not.toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/sign_in');
    });
  });
});
