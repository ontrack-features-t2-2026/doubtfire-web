import moment from 'moment';
import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {PageEvent} from '@angular/material/paginator';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {Notification} from 'src/app/api/models/notification';
import {AuthenticationService} from 'src/app/api/services/authentication.service';
import {NotificationService} from 'src/app/api/services/notification.service';
import {AlertService} from 'src/app/common/services/alert.service';

/**
 * The whole notification list, on a page of its own.
 *
 * Lives under common/ next to the other routed components that are not part of
 * a unit or a project, scorm-player and submission-files-download.
 *
 * Paged here and not by the api. GET /notifications takes unread_only and
 * nothing else and answers with every row the user has, so this holds the lot
 * and shows a page of it. That is fine at the sizes this feature produces and
 * it is wrong at some size, which is an api ticket and not this one.
 */
@Component({
  selector: 'f-notifications-page',
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class NotificationsPageComponent implements OnInit, OnDestroy {
  public readonly pageSizeOptions: number[] = [10, 20, 50];

  /**
   * The icon and colour for a notification's category.
   *
   * The same five as the header dropdown, deliberately, so a notification looks
   * like itself wherever it is read. Duplicated rather than shared because the
   * dropdown is on a sibling branch and neither can import from the other yet;
   * this belongs in one place once both have merged, along with open().
   *
   * Keyed on notificationType because that is all NotificationEntity exposes.
   * The event naming the specific thing that happened is not in the payload, so
   * a new task, a due date change and a due soon reminder share the task icon.
   */
  private static readonly CATEGORIES: Record<string, {icon: string; tone: string}> = {
    feedback: {icon: 'chat_bubble', tone: 'feedback'},
    task: {icon: 'assignment', tone: 'task'},
    portfolio: {icon: 'collections_bookmark', tone: 'portfolio'},
    extension: {icon: 'more_time', tone: 'extension'},
    general: {icon: 'campaign', tone: 'general'},
  };

  private static readonly UNKNOWN_CATEGORY = {icon: 'notifications', tone: 'general'};

  notifications: Notification[] = [];

  /**
   * The rows actually on screen.
   *
   * Held rather than worked out in the template. A getter that slices would
   * build a new array on every change detection pass, and with a click handler
   * on every row there are a lot of those.
   */
  visible: Notification[] = [];

  loading = true;
  loadFailed = false;

  pageIndex = 0;
  pageSize = 20;

  private listSubscription: Subscription | null = null;

  constructor(
    private notificationService: NotificationService,
    private authenticationService: AuthenticationService,
    private alerts: AlertService,
    private router: Router,
  ) {}

  /**
   * Wait for authentication before asking the api for anything.
   *
   * The route has no guard, so this component is built for whoever opens the
   * url, signed in or not. An anonymous GET /notifications comes back 403, and
   * HttpErrorInterceptor reads a 403 on an anonymous user as an expired
   * session: it shows "Authentication timed out" and redirects to /timeout,
   * instead of the sign in page somebody following a stale bookmark should get.
   *
   * afterAuthCall is what EditProfileComponent does for the same reason, and it
   * waits rather than guessing, so a page opened while the session is still
   * being restored still loads.
   */
  ngOnInit(): void {
    this.authenticationService.afterAuthCall((signedIn) => {
      if (!signedIn) {
        this.router.navigateByUrl('/sign_in');
        return;
      }

      this.load();
    });
  }

  ngOnDestroy(): void {
    this.listSubscription?.unsubscribe();
  }

  /**
   * Read every notification, once.
   *
   * Also the retry. A failed load is the one state on this page with nothing
   * useful on it, so the way out has to be on the page rather than a refresh of
   * the browser.
   */
  load(): void {
    this.loading = true;
    this.loadFailed = false;

    this.listSubscription?.unsubscribe();

    this.listSubscription = this.notificationService.list().subscribe({
      next: (notifications) => {
        this.notifications = [...notifications].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );

        // A retry after a run of deletes can leave the reader stranded on a
        // page that no longer exists, staring at nothing.
        this.pageIndex = Math.min(this.pageIndex, this.lastPageIndex());
        this.loading = false;
        this.updateVisible();
      },
      error: () => {
        this.loading = false;
        this.loadFailed = true;
      },
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateVisible();
  }

  /**
   * Open one notification: mark it read, then go where it points.
   *
   * The same shape as the dropdown in the header. They are on separate branches
   * so neither can call the other today, and once both have merged this belongs
   * in one place.
   */
  open(notification: Notification): void {
    if (!notification.isRead) {
      // A read that went out before this click is out of date now, and
      // NotificationService writes list responses into the shared entity cache,
      // so one landing late would put readAt back to null.
      this.listSubscription?.unsubscribe();
      this.listSubscription = null;

      this.notificationService.markRead(notification).subscribe({
        error: () => this.alerts.error('That notification could not be marked as read'),
      });
    }

    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
  }

  iconFor(notification: Notification): string {
    return this.categoryFor(notification).icon;
  }

  toneFor(notification: Notification): string {
    return this.categoryFor(notification).tone;
  }

  /**
   * What a screen reader should read for a row.
   *
   * Unread is drawn as bold text, and that is a thing you have to be able to
   * see. The message and the time are already in the button, so this only
   * exists to put the state into words.
   */
  rowLabel(notification: Notification): string {
    const state = notification.isRead ? 'Read' : 'Unread';

    return `${state}. ${notification.message}. ${this.timeAgo(notification)}`;
  }

  timeAgo(notification: Notification): string {
    return moment(notification.createdAt).fromNow();
  }

  private categoryFor(notification: Notification): {icon: string; tone: string} {
    return (
      NotificationsPageComponent.CATEGORIES[notification.notificationType] ??
      NotificationsPageComponent.UNKNOWN_CATEGORY
    );
  }

  private updateVisible(): void {
    const start = this.pageIndex * this.pageSize;
    this.visible = this.notifications.slice(start, start + this.pageSize);
  }

  private lastPageIndex(): number {
    return Math.max(0, Math.ceil(this.notifications.length / this.pageSize) - 1);
  }
}
