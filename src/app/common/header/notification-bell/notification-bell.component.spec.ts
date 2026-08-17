import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatBadge, MatBadgeModule} from '@angular/material/badge';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {NavigationEnd, Router} from '@angular/router';
import {BehaviorSubject, Observable, Subject, config, defer, of, throwError} from 'rxjs';
import {AuthenticationService} from 'src/app/api/services/authentication.service';
import {NotificationService} from 'src/app/api/services/notification.service';
import {NotificationBellComponent} from './notification-bell.component';

/**
 * The bell has three jobs and each one is a way for it to be wrong: show the
 * number the service holds, show nothing at all when that number is zero, and
 * ask again as the user moves around the app. The two after those cover the
 * ones that are easy to leave out, a count request going out after sign out and
 * one still going out after the component is gone.
 */
describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;

  let unreadCount: BehaviorSubject<number>;
  let routerEvents: Subject<NavigationEnd>;
  let subscribedTo: Set<string>;
  let notificationService: {
    unreadCount$: BehaviorSubject<number>;
    refreshUnreadCount: ReturnType<typeof vi.fn>;
  };
  let authenticationService: {isAuthenticated: ReturnType<typeof vi.fn>};
  let router: {events: unknown; navigateByUrl: ReturnType<typeof vi.fn>};

  /**
   * A stand-in that records whether anybody actually subscribed.
   *
   * A spy that only counts calls is happy either way, and refreshUnreadCount
   * returns a cold observable, so dropping the .subscribe() in the component
   * sends no request at all while the call count stays the same.
   */
  const answers = <T>(name: string, value: T): Observable<T> =>
    defer(() => {
      subscribedTo.add(name);
      return of(value);
    });

  const bell = (): HTMLElement => fixture.nativeElement.querySelector('button');

  // What is drawn, not what was bound. Material always renders the content
  // span and hides the whole badge with a class on the host, so the number on
  // screen and whether anyone can see it are two separate questions.
  const badgeText = (): string =>
    fixture.nativeElement.querySelector('.mat-badge-content').textContent.trim();

  const badgeIsHidden = (): boolean =>
    fixture.debugElement
      .query(By.directive(MatBadge))
      .nativeElement.classList.contains('mat-badge-hidden');

  beforeEach(async () => {
    unreadCount = new BehaviorSubject<number>(0);
    routerEvents = new Subject<NavigationEnd>();
    subscribedTo = new Set<string>();

    notificationService = {
      unreadCount$: unreadCount,
      refreshUnreadCount: vi.fn(() => answers('refreshUnreadCount', 0)),
    };
    authenticationService = {isAuthenticated: vi.fn().mockReturnValue(true)};
    router = {events: routerEvents.asObservable(), navigateByUrl: vi.fn()};

    await TestBed.configureTestingModule({
      declarations: [NotificationBellComponent],
      imports: [
        MatBadgeModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        NoopAnimationsModule,
      ],
      providers: [
        {provide: NotificationService, useValue: notificationService},
        {provide: AuthenticationService, useValue: authenticationService},
        {provide: Router, useValue: router},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
  });

  it('shows how many are unread', () => {
    unreadCount.next(3);
    fixture.detectChanges();

    expect(badgeText()).toBe('3');
    expect(badgeIsHidden()).toBe(false);

    // The service is the only source of the number, so a change made anywhere
    // in the app has to reach the bell without it asking.
    unreadCount.next(4);
    fixture.detectChanges();

    expect(badgeText()).toBe('4');
  });

  it('shows no badge at all when nothing is unread', () => {
    fixture.detectChanges();

    // Not a badge reading zero. A zero sitting on the bell is a permanent
    // little alarm that never means anything.
    expect(badgeIsHidden()).toBe(true);

    unreadCount.next(1);
    fixture.detectChanges();

    expect(badgeIsHidden()).toBe(false);
  });

  it('says how many are unread to a screen reader too', () => {
    fixture.detectChanges();

    expect(bell().getAttribute('aria-label')).toBe('Notifications');

    unreadCount.next(4);
    fixture.detectChanges();

    // Material renders the badge into a span marked aria-hidden, so without
    // this the count is the one thing the control exists to say and the only
    // thing it does not say.
    expect(bell().getAttribute('aria-label')).toBe('Notifications, 4 unread');
  });

  it('asks for the count again after every navigation', () => {
    fixture.detectChanges();

    // Once on init, because unreadCount$ starts at zero whether or not that is
    // true.
    expect(notificationService.refreshUnreadCount).toHaveBeenCalledTimes(1);
    expect(subscribedTo.has('refreshUnreadCount')).toBe(true);

    routerEvents.next(new NavigationEnd(1, '/home', '/home'));
    expect(notificationService.refreshUnreadCount).toHaveBeenCalledTimes(2);

    routerEvents.next(new NavigationEnd(2, '/units/1/tasks/inbox', '/units/1/tasks/inbox'));
    expect(notificationService.refreshUnreadCount).toHaveBeenCalledTimes(3);
  });

  it('does not ask for the count when nobody is signed in', () => {
    authenticationService.isAuthenticated.mockReturnValue(false);

    fixture.detectChanges();
    routerEvents.next(new NavigationEnd(1, '/sign_in', '/sign_in'));

    // Sign out hides the header and routes, and the hiding takes a change
    // detection pass while the routing event does not, so this component can
    // still be alive for it. Anonymous, the request comes back 403, and
    // HttpErrorInterceptor treats a 403 on an anonymous user as an expired
    // session: an "Authentication timed out" alert and a redirect to /timeout.
    expect(notificationService.refreshUnreadCount).not.toHaveBeenCalled();
  });

  it('stops asking once it is destroyed', () => {
    fixture.detectChanges();
    expect(notificationService.refreshUnreadCount).toHaveBeenCalledTimes(1);

    fixture.destroy();
    routerEvents.next(new NavigationEnd(1, '/home', '/home'));

    expect(notificationService.refreshUnreadCount).toHaveBeenCalledTimes(1);
  });

  it('handles a count request that fails instead of leaving it unhandled', async () => {
    // rxjs does not throw an unhandled subscriber error where the subscribe
    // call was, it hands it to config.onUnhandledError a macrotask later, and
    // the default for that is to rethrow globally. Swapping it for a spy is the
    // only way to see the difference from inside a test, and without it this
    // passes whether or not the error is handled at all.
    const unhandled = vi.fn();
    const previous = config.onUnhandledError;
    config.onUnhandledError = unhandled;

    try {
      notificationService.refreshUnreadCount.mockReturnValue(
        throwError(() => new Error('unread_count failed')),
      );

      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(unhandled).not.toHaveBeenCalled();
      expect(component.unreadCount).toBe(0);
    } finally {
      config.onUnhandledError = previous;
    }
  });
});
