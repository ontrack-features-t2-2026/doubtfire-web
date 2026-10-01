import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {Subject, of, throwError} from 'rxjs';
import {Notification} from 'src/app/api/models/notification';
import {AuthenticationService} from 'src/app/api/services/authentication.service';
import {NotificationPage, NotificationService} from 'src/app/api/services/notification.service';
import {EmptyStateComponent} from '../empty-state/empty-state.component';
import {ConfirmationModalService} from '../modals/confirmation-modal/confirmation-modal.service';
import {NotificationOpenService} from '../notifications/notification-open.service';
import {AlertService} from '../services/alert.service';
import {NotificationsPageComponent} from './notifications-page.component';

const row = (id: number, read = false) =>
  Object.assign(new Notification(), {
    id,
    message: `Update ${id}`,
    createdAt: new Date(),
    readAt: read ? new Date() : null,
    event: 'task_due_soon',
    notificationType: 'task',
    unitId: 10,
  });
const page = (
  notifications = [row(80), row(79)],
  over: Partial<NotificationPage> = {},
): NotificationPage => ({
  notifications,
  totalCount: notifications.length,
  page: 1,
  perPage: 20,
  unreadCount: notifications.length,
  throughId: 80,
  events: ['task_due_soon', 'task_comment_created'],
  units: [{id: 10, code: 'SIT764', name: 'Project A'}],
  ...over,
});

describe('NotificationsPageComponent server-filtered history', () => {
  let fixture: ComponentFixture<NotificationsPageComponent>;
  let component: NotificationsPageComponent;
  let pending: Subject<NotificationPage>;
  let service: {
    listPage: ReturnType<typeof vi.fn>;
    markRead: ReturnType<typeof vi.fn>;
    markAllRead: ReturnType<typeof vi.fn>;
    deleteAll: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let auth: {afterAuthCall: ReturnType<typeof vi.fn>};
  let confirmation: {show: ReturnType<typeof vi.fn>};
  let alerts: {success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>};
  let router: {navigateByUrl: ReturnType<typeof vi.fn>};
  let opener: {open: ReturnType<typeof vi.fn>};
  const text = () => fixture.nativeElement.textContent;
  const rows = () => fixture.nativeElement.querySelectorAll('.notification-row');
  const start = (result = page()) => {
    fixture.detectChanges();
    pending.next(result);
    fixture.detectChanges();
  };
  const select = (index: number, value: string) => {
    const input: HTMLSelectElement = fixture.nativeElement.querySelectorAll(
      '.notification-filters select',
    )[index];
    input.value = value;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    pending = new Subject();
    service = {
      listPage: vi.fn().mockReturnValue(pending),
      markRead: vi.fn().mockReturnValue(of(row(80, true))),
      markAllRead: vi.fn().mockReturnValue(of(undefined)),
      deleteAll: vi.fn().mockReturnValue(of(80)),
      remove: vi.fn().mockReturnValue(of(undefined)),
    };
    auth = {afterAuthCall: vi.fn((callback) => callback(true))};
    confirmation = {show: vi.fn()};
    alerts = {success: vi.fn(), error: vi.fn()};
    router = {navigateByUrl: vi.fn()};
    opener = {open: vi.fn().mockResolvedValue(true)};
    await TestBed.configureTestingModule({
      declarations: [NotificationsPageComponent],
      imports: [
        EmptyStateComponent,
        MatButtonModule,
        MatIconModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        NoopAnimationsModule,
      ],
      providers: [
        {provide: NotificationService, useValue: service},
        {provide: AuthenticationService, useValue: auth},
        {provide: ConfirmationModalService, useValue: confirmation},
        {provide: AlertService, useValue: alerts},
        {provide: Router, useValue: router},
        {provide: NotificationOpenService, useValue: opener},
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NotificationsPageComponent);
    component = fixture.componentInstance;
  });

  it('waits for sign-in and does not load another account history', () => {
    auth.afterAuthCall.mockImplementation((callback) => callback(false));
    fixture.detectChanges();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/sign_in');
    expect(service.listPage).not.toHaveBeenCalled();
  });

  it('shows loading, then a bounded page grouped by date with a full history count', () => {
    fixture.detectChanges();
    expect(text()).toContain('Loading your notifications');
    pending.next(page([row(80), row(79)], {totalCount: 1200}));
    fixture.detectChanges();
    expect(rows().length).toBe(2);
    expect(text()).toContain('Today');
    expect(text()).toContain('1200');
    expect(service.listPage).toHaveBeenCalledWith(expect.objectContaining({page: 1, perPage: 20}));
  });

  it('requests the next server page through the real paginator', () => {
    start(page([row(80)], {totalCount: 1200}));
    fixture.debugElement.query(By.directive(MatPaginator)).componentInstance.nextPage();
    expect(service.listPage).toHaveBeenLastCalledWith(
      expect.objectContaining({page: 2, perPage: 20}),
    );
    pending.next(page([row(60)], {totalCount: 1200, page: 2}));
    fixture.detectChanges();
    expect(text()).toContain('Update 60');
    expect(text()).not.toContain('Update 80');
  });

  it('filters by unit, event, category and unread on the server and resets paging', () => {
    start(page([row(80)], {totalCount: 1200}));
    component.pageIndex = 4;
    select(0, '10');
    expect(service.listPage).toHaveBeenLastCalledWith(
      expect.objectContaining({unitId: 10, page: 1}),
    );
    select(2, 'task_comment_created');
    expect(service.listPage).toHaveBeenLastCalledWith(
      expect.objectContaining({event: 'task_comment_created'}),
    );
    select(1, 'feedback');
    expect(service.listPage).toHaveBeenLastCalledWith(
      expect.objectContaining({notificationType: 'feedback', event: ''}),
    );
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]');
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    expect(service.listPage).toHaveBeenLastCalledWith(expect.objectContaining({unreadOnly: true}));
    component.clearFilters();
    expect(service.listPage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        unreadOnly: false,
        unitId: undefined,
        notificationType: '',
        event: '',
      }),
    );
  });

  it('keeps the paginator control in place while a later page loads', () => {
    start(page([row(80)], {totalCount: 1200}));
    const paginator = fixture.nativeElement.querySelector('mat-paginator');
    fixture.debugElement.query(By.directive(MatPaginator)).componentInstance.nextPage();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-paginator')).toBe(paginator);
  });

  it('cancels obsolete filter requests so late results cannot replace current ones', () => {
    const stale: Subject<NotificationPage> = new Subject();
    const current: Subject<NotificationPage> = new Subject();
    service.listPage.mockReturnValueOnce(stale).mockReturnValueOnce(current);
    fixture.detectChanges();
    component.unreadOnly = true;
    component.filtersChanged();
    current.next(page([row(70)]));
    stale.next(page([row(90)]));
    fixture.detectChanges();
    expect(text()).toContain('Update 70');
    expect(text()).not.toContain('Update 90');
  });

  it('distinguishes a failed request from an empty inbox and retries', () => {
    service.listPage
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of(page([])));
    fixture.detectChanges();
    expect(text()).toContain('We could not load');
    expect(text()).not.toContain('You have no notifications yet');
    fixture.nativeElement.querySelector('.notifications-retry').click();
    fixture.detectChanges();
    expect(text()).toContain('You have no notifications yet');
  });

  it('explains an empty filter result without saying the whole inbox is empty', () => {
    component.unreadOnly = true;
    start(page([]));
    expect(text()).toContain('No notifications match these filters');
    expect(text()).toContain('Clear filters');
  });

  it('uses global unread count even when this page contains only read rows', () => {
    start(page([row(80, true)], {totalCount: 100, unreadCount: 6}));
    component.markAllRead();
    expect(service.markAllRead).toHaveBeenCalledOnce();
    expect(service.listPage).toHaveBeenCalledTimes(2);
  });

  it('marks a clicked row read and uses the shared safe destination service', () => {
    const notification = row(80);
    start(page([notification]));
    rows()[0].click();
    expect(service.markRead).toHaveBeenCalledWith(notification);
    expect(opener.open).toHaveBeenCalledWith(notification);
  });

  it('does not pretend that a failed mark-read succeeded', () => {
    service.markRead.mockReturnValue(throwError(() => new Error()));
    const notification = row(80);
    start(page([notification]));
    component.open(notification);
    expect(notification.isRead).toBe(false);
    expect(alerts.error).toHaveBeenCalledWith('That notification could not be marked as read');
  });

  it('confirms bulk deletion against the entire loaded snapshot boundary, not the visible page', () => {
    start(page([row(12)], {totalCount: 1200, throughId: 1300}));
    component.confirmDeleteAll();
    expect(confirmation.show.mock.calls[0][1]).toContain('1200');
    component.throughId = 1400;
    confirmation.show.mock.calls[0][2]();
    expect(service.deleteAll).toHaveBeenCalledWith(1300);
  });

  it('does not expose global deletion from a filtered list', () => {
    component.unreadOnly = true;
    start();
    expect(fixture.nativeElement.querySelector('.notification-delete-all')).toBeNull();
    component.confirmDeleteAll();
    expect(confirmation.show).not.toHaveBeenCalled();
  });

  it('leaves a row visible if deletion fails', () => {
    service.remove.mockReturnValue(throwError(() => new Error()));
    start();
    component.confirmDelete(component.notifications[0]);
    confirmation.show.mock.calls[0][2]();
    fixture.detectChanges();
    expect(rows().length).toBe(2);
    expect(alerts.error).toHaveBeenCalledWith('That notification could not be deleted');
  });

  it('returns to a valid page after deleting the last item on a later page', () => {
    start(page([row(80)], {totalCount: 21}));
    component.pageIndex = 1;
    service.listPage.mockReturnValueOnce(of(page([row(79)], {totalCount: 20, page: 1})));
    component.confirmDelete(component.notifications[0]);
    confirmation.show.mock.calls[0][2]();
    expect(component.pageIndex).toBe(0);
    expect(component.notifications[0].id).toBe(79);
  });

  it('provides keyboard controls, distinct row labels and a named paginator', () => {
    start();
    expect(rows()[0].tagName).toBe('BUTTON');
    expect(rows()[0].getAttribute('aria-label')).toContain('Unread');
    expect(
      fixture.nativeElement.querySelector('.notification-delete').getAttribute('aria-label'),
    ).toContain('Update 80');
    expect(fixture.nativeElement.querySelector('mat-paginator').getAttribute('aria-label')).toBe(
      'Notification pages',
    );
    expect(fixture.nativeElement.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('label select').length).toBe(3);
  });

  it('keeps keyboard focus on Mark all read through refresh and an empty unread result', () => {
    component.unreadOnly = true;
    start();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.notification-mark-all');
    button.focus();
    button.click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(button);
    pending.next(page([], {unreadCount: 0}));
    fixture.detectChanges();
    expect(document.activeElement).toBe(button);
    expect(fixture.nativeElement.querySelector('.notification-mark-all')).toBe(button);
    button.click();
    expect(service.markAllRead).toHaveBeenCalledOnce();
  });

  it('leaves unread rows and the action available when marking all read fails', () => {
    service.markAllRead.mockReturnValue(throwError(() => new Error()));
    start();
    component.markAllRead();
    fixture.detectChanges();
    expect(component.hasUnread).toBe(true);
    expect(rows().length).toBe(2);
    expect(component.markAllReadPending).toBe(false);
    expect(alerts.error).toHaveBeenCalledWith('Your notifications could not be marked as read');
  });

  it('keeps the list when a bulk delete fails', () => {
    service.deleteAll.mockReturnValue(throwError(() => new Error()));
    start();
    component.confirmDeleteAll();
    confirmation.show.mock.calls[0][2]();
    fixture.detectChanges();
    expect(rows().length).toBe(2);
    expect(component.deleteAllPending).toBe(false);
    expect(alerts.error).toHaveBeenCalledWith('Your notifications could not be deleted');
  });

  it('does not mark an already-read notification again', () => {
    const notification = row(80, true);
    start(page([notification]));
    component.open(notification);
    expect(service.markRead).not.toHaveBeenCalled();
    expect(opener.open).toHaveBeenCalledWith(notification);
  });

  it('does not send a second read-all while the first request is pending', () => {
    service.markAllRead.mockReturnValue(new Subject());
    start();
    component.markAllRead();
    component.markAllRead();
    expect(service.markAllRead).toHaveBeenCalledOnce();
  });

  it('keeps deletion separate from opening and does nothing when confirmation is cancelled', () => {
    start();
    fixture.nativeElement.querySelector('.notification-delete').click();
    confirmation.show.mock.calls[0][3]();
    expect(service.remove).not.toHaveBeenCalled();
    expect(opener.open).not.toHaveBeenCalled();
  });

  it('moves focus to the next available row after successful deletion', () => {
    start();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.notification-delete');
    button.focus();
    button.click();
    confirmation.show.mock.calls[0][2]();
    fixture.detectChanges();
    pending.next(page([row(79)]));
    fixture.detectChanges();
    expect(document.activeElement).toBe(rows()[0]);
  });

  it('does not restart a list load after a deletion finishes on a destroyed page', () => {
    const deletion: Subject<void> = new Subject();
    service.remove.mockReturnValue(deletion);
    start();
    component.confirmDelete(component.notifications[0]);
    confirmation.show.mock.calls[0][2]();
    fixture.destroy();
    deletion.next();
    expect(service.listPage).toHaveBeenCalledOnce();
  });

  it('abandons a pending list when leaving the page', () => {
    fixture.detectChanges();
    fixture.destroy();
    pending.next(page());
    expect(component.notifications).toEqual([]);
  });
});
