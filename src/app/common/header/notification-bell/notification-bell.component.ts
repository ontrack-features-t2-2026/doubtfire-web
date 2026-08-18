import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {Subscription, filter} from 'rxjs';
import {AuthenticationService} from 'src/app/api/services/authentication.service';
import {NotificationService} from 'src/app/api/services/notification.service';

/**
 * The bell in the header, and the unread count on it.
 *
 * Its own component rather than more markup in HeaderComponent. The header is
 * already eleven injected services long and its spec replaces the template with
 * an empty string, so anything added there is untested by construction. This
 * also keeps the change to the header itself to one element.
 *
 * The count comes from NotificationService.unreadCount$ and not from a request
 * this component makes, so marking one read anywhere in the app moves the badge
 * without the bell knowing who did it.
 */
@Component({
  selector: 'notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount = 0;

  private subscriptions: Subscription[] = [];
  private destroyed = false;

  constructor(
    private notificationService: NotificationService,
    private authenticationService: AuthenticationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe((count) => {
        this.unreadCount = count;
      }),
    );

    // The count goes stale on its own. Notifications are created by the api,
    // and push only reaches a browser that granted permission and kept the
    // service worker alive, so most sessions never hear about a new one. A
    // navigation is the cheapest honest excuse to ask again, and it is roughly
    // when someone would look at the bell anyway.
    this.subscriptions.push(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => this.refresh()),
    );

    // A remembered session is restored after the header is created. If the bell
    // asks immediately, the authentication guard can skip the request before the
    // restored session is ready, and no later navigation is guaranteed.
    if (this.authenticationService.isAuthenticated()) {
      this.refresh();
    } else {
      this.authenticationService.afterAuthCall((authenticated) => {
        if (authenticated && !this.destroyed) {
          this.refresh();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  /**
   * What a screen reader should call the bell.
   *
   * The badge is not part of it. Material renders the number into a span marked
   * aria-hidden, so a bell with four unread notifications announces itself as
   * "Notifications, button" and the count is the one thing the control exists
   * to say.
   */
  get bellLabel(): string {
    return this.unreadCount ? `Notifications, ${this.unreadCount} unread` : 'Notifications';
  }

  /**
   * Ask the api for the count, but only while somebody is signed in.
   *
   * The guard is not tidiness. Sign out hides the header and routes to
   * /sign_in, and hiding is a change detection away while the navigation event
   * fires straight away, so this component can still be alive for it. The
   * request would then go out anonymous, come back 403, and
   * HttpErrorInterceptor reads a 403 on an anonymous user as an expired session:
   * it shows "Authentication timed out" and redirects to /timeout. Signing out
   * would look like being kicked out.
   *
   * Errors are dropped. Nothing the user asked for depends on this.
   */
  private refresh(): void {
    if (!this.authenticationService.isAuthenticated()) {
      return;
    }

    this.notificationService.refreshUnreadCount().subscribe({error: () => undefined});
  }
}
