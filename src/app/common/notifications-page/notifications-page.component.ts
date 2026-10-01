import moment from 'moment';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {PageEvent} from '@angular/material/paginator';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {Notification} from 'src/app/api/models/notification';
import {AuthenticationService} from 'src/app/api/services/authentication.service';
import {NotificationService} from 'src/app/api/services/notification.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {ConfirmationModalService} from '../modals/confirmation-modal/confirmation-modal.service';
import {NotificationOpenService} from '../notifications/notification-open.service';
import {presentationFor} from '../notifications/notification-presentation';

@Component({
  selector: 'f-notifications-page',
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.scss'],
  standalone: false,
})
export class NotificationsPageComponent implements OnInit, OnDestroy {
  readonly pageSizeOptions = [10, 20, 50];
  readonly categories = [
    {value: 'task', label: 'Tasks'},
    {value: 'feedback', label: 'Feedback'},
    {value: 'portfolio', label: 'Portfolios'},
    {value: 'unit_hub', label: 'Unit Hub'},
    {value: 'extension', label: 'Extensions'},
    {value: 'general', label: 'Other updates'},
  ];
  notifications: Notification[] = [];
  groups: {label: string; notifications: Notification[]}[] = [];
  units: {id: number; code: string; name: string}[] = [];
  events: string[] = [];
  totalCount = 0;
  unreadCount = 0;
  throughId: number | null = null;
  loading = true;
  actionsVisible = false;
  loadFailed = false;
  pageIndex = 0;
  pageSize = 20;
  unreadOnly = false;
  category = '';
  event = '';
  unitId = '';
  markAllReadPending = false;
  deleteAllPending = false;
  private listSubscription: Subscription | null = null;
  private destroyed = false;
  private readonly deletingNotificationIds: Set<number> = new Set();

  constructor(
    private notificationService: NotificationService,
    private authenticationService: AuthenticationService,
    private confirmationModal: ConfirmationModalService,
    private alerts: AlertService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private elementRef: ElementRef<HTMLElement>,
    private notificationOpener: NotificationOpenService,
  ) {}

  get hasUnread(): boolean {
    return this.unreadCount > 0;
  }
  get filtered(): boolean {
    return this.unreadOnly || !!this.category || !!this.event || !!this.unitId;
  }

  ngOnInit(): void {
    this.authenticationService.afterAuthCall((signedIn) => {
      if (this.destroyed) {
        return;
      }
      if (!signedIn) {
        void this.router.navigateByUrl('/sign_in');
        return;
      }
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.listSubscription?.unsubscribe();
  }

  load(focusAfterDelete?: number): void {
    if (this.destroyed) {
      return;
    }
    this.loading = true;
    this.loadFailed = false;
    this.listSubscription?.unsubscribe();
    this.listSubscription = this.notificationService
      .listPage({
        page: this.pageIndex + 1,
        perPage: this.pageSize,
        unreadOnly: this.unreadOnly,
        notificationType: this.category,
        event: this.event,
        unitId: this.unitId ? Number(this.unitId) : undefined,
      })
      .subscribe({
        next: (result) => {
          this.totalCount = result.totalCount;
          this.unreadCount = result.unreadCount;
          this.throughId = result.throughId;
          this.units = result.units;
          this.events = result.events;
          this.pageIndex = result.page - 1;
          this.pageSize = result.perPage;
          this.actionsVisible ||= this.totalCount > 0 || this.unreadCount > 0;
          this.notifications = result.notifications;
          this.groupByDay();
          this.loading = false;
          if (focusAfterDelete !== undefined) {
            this.changeDetectorRef.detectChanges();
            this.restoreFocusAfterDelete(focusAfterDelete);
          }
        },
        error: () => {
          this.loading = false;
          this.loadFailed = true;
        },
      });
  }

  filtersChanged(): void {
    this.pageIndex = 0;
    this.load();
  }
  clearFilters(): void {
    this.elementRef.nativeElement
      .querySelector<HTMLInputElement>('.notification-filter-check input')
      ?.focus();
    this.unreadOnly = false;
    this.category = this.event = this.unitId = '';
    this.filtersChanged();
  }
  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  open(notification: Notification): void {
    if (!notification.isRead) {
      this.cancelPendingList();
      this.notificationService.markRead(notification).subscribe({
        next: () => {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          if (this.unreadOnly) {
            this.load();
          }
        },
        error: () => this.alerts.error('That notification could not be marked as read'),
      });
    }
    void this.notificationOpener.open(notification);
  }

  markAllRead(): void {
    if (
      !this.hasUnread ||
      this.markAllReadPending ||
      this.deleteAllPending ||
      this.loading ||
      this.loadFailed
    ) {
      return;
    }
    this.markAllReadPending = true;
    this.cancelPendingList();
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.markAllReadPending = false;
        this.alerts.success('All notifications marked as read');
        this.load();
      },
      error: () => {
        this.markAllReadPending = false;
        this.alerts.error('Your notifications could not be marked as read');
      },
    });
  }

  confirmDelete(notification: Notification): void {
    if (this.isDeleting(notification)) {
      return;
    }
    this.confirmationModal.show(
      'Delete notification',
      `Delete "${notification.message}"? This removes the notification permanently.`,
      () => this.remove(notification),
      () => undefined,
      'Delete',
    );
  }

  confirmDeleteAll(): void {
    // A filtered count cannot truthfully describe an account-wide delete.
    if (
      this.throughId === null ||
      this.filtered ||
      !this.totalCount ||
      this.deleteAllPending ||
      this.loadFailed ||
      this.loading
    ) {
      return;
    }
    const throughId = this.throughId;
    this.confirmationModal.show(
      'Delete all notifications',
      `Delete all ${this.totalCount} notifications? This cannot be undone. New notifications that arrive after this confirmation will be kept.`,
      () => this.removeAll(throughId),
      () => undefined,
      'Delete all',
    );
  }

  iconFor(notification: Notification): string {
    return presentationFor(notification).icon;
  }
  toneFor(notification: Notification): string {
    return presentationFor(notification).tone;
  }
  labelFor(notification: Notification): string {
    return presentationFor(notification).label;
  }
  eventLabel(event: string): string {
    const label = presentationFor(Object.assign(new Notification(), {event})).label;
    return label === 'Notification'
      ? event.replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase())
      : label;
  }
  unitLabel(notification: Notification): string {
    const unit = this.units.find((row) => row.id === notification.unitId);
    return unit ? unit.code || unit.name : '';
  }
  rowLabel(notification: Notification): string {
    return `${notification.isRead ? 'Read' : 'Unread'}. ${this.labelFor(notification)}. ${notification.message}. ${this.timeAgo(notification)}`;
  }
  deleteLabel(notification: Notification): string {
    return `Delete: ${notification.message}`;
  }
  isDeleting(notification: Notification): boolean {
    return this.deleteAllPending || this.deletingNotificationIds.has(notification.id);
  }
  timeAgo(notification: Notification): string {
    return moment(notification.createdAt).fromNow();
  }

  private groupByDay(): void {
    this.groups = [];
    this.notifications.forEach((notification) => {
      const date = moment(notification.createdAt);
      const label = date.isSame(moment(), 'day')
        ? 'Today'
        : date.isSame(moment().subtract(1, 'day'), 'day')
          ? 'Yesterday'
          : date.format('D MMMM YYYY');
      let group = this.groups[this.groups.length - 1];
      if (!group || group.label !== label) {
        group = {label, notifications: []};
        this.groups.push(group);
      }
      group.notifications.push(notification);
    });
  }
  private cancelPendingList(): void {
    this.listSubscription?.unsubscribe();
    this.listSubscription = null;
    this.loading = false;
  }
  private remove(notification: Notification): void {
    if (this.isDeleting(notification)) {
      return;
    }
    this.deletingNotificationIds.add(notification.id);
    this.cancelPendingList();
    const previousIndex = this.notifications.indexOf(notification);
    this.notificationService.remove(notification).subscribe({
      next: () => {
        this.deletingNotificationIds.delete(notification.id);
        this.alerts.success('Notification deleted');
        this.load(previousIndex);
      },
      error: () => {
        this.deletingNotificationIds.delete(notification.id);
        this.alerts.error('That notification could not be deleted');
      },
    });
  }
  private removeAll(throughId: number): void {
    if (this.deleteAllPending) {
      return;
    }
    this.deleteAllPending = true;
    this.cancelPendingList();
    this.notificationService.deleteAll(throughId).subscribe({
      next: (count) => {
        this.deleteAllPending = false;
        this.alerts.success(`${count} ${count === 1 ? 'notification' : 'notifications'} deleted`);
        this.pageIndex = 0;
        this.load(0);
      },
      error: () => {
        this.deleteAllPending = false;
        this.alerts.error('Your notifications could not be deleted');
      },
    });
  }
  private restoreFocusAfterDelete(previousIndex: number): void {
    if (document.activeElement !== document.body) {
      return;
    }
    const rows = Array.from(
      this.elementRef.nativeElement.querySelectorAll<HTMLElement>('.notification-row'),
    );
    const next =
      rows[Math.min(Math.max(previousIndex, 0), rows.length - 1)] ??
      this.elementRef.nativeElement.querySelector<HTMLElement>('.notifications-placeholder');
    next?.focus();
  }
}
