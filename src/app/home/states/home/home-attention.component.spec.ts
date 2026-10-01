import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {BehaviorSubject, Subject, of, throwError} from 'rxjs';
import {Notification} from 'src/app/api/models/notification';
import {AttentionService, StaffAttention} from 'src/app/api/services/attention.service';
import {NotificationService} from 'src/app/api/services/notification.service';
import {ProjectService} from 'src/app/api/services/project.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {expectAccessible} from 'src/app/common/testing/accessibility';
import {GlobalStateService} from 'src/app/projects/states/index/global-state.service';
import {HomeAttentionComponent} from './home-attention.component';
import {StudentAttentionItem} from './student-attention';

describe('HomeAttentionComponent', () => {
  let fixture: ComponentFixture<HomeAttentionComponent>;
  let staff: ReturnType<typeof vi.fn>;
  let notifications: ReturnType<typeof vi.fn>;
  let markRead: ReturnType<typeof vi.fn>;
  const summary: StaffAttention = {
    units: [
      {
        queue_scope: 'mine',
        unit_id: 8,
        unit_code: 'SIT764',
        unit_name: 'Capstone',
        awaiting_feedback_count: 4,
        help_requested_count: 1,
        extension_requested_count: 2,
        oldest_wait_days: 9,
        overdue_feedback_count: 2,
        feedback_warning_threshold_days: 7,
      },
    ],
    totals: {
      awaiting_feedback_count: 4,
      help_requested_count: 1,
      extension_requested_count: 2,
      oldest_wait_days: 9,
      overdue_feedback_count: 2,
    },
  };

  beforeEach(async () => {
    staff = vi.fn().mockReturnValue(of(summary));
    notifications = vi.fn().mockReturnValue(of([]));
    markRead = vi.fn().mockReturnValue(of(null));
    await TestBed.configureTestingModule({
      imports: [HomeAttentionComponent],
      providers: [
        provideRouter([]),
        {provide: AttentionService, useValue: {staff}},
        {provide: NotificationService, useValue: {list: notifications, markRead}},
        {provide: AlertService, useValue: {error: vi.fn()}},
        {provide: ProjectService, useValue: {fetchAll: vi.fn().mockReturnValue(of([]))}},
        {
          provide: GlobalStateService,
          useValue: {projectLoadErrorSubject: new BehaviorSubject(false), currentUserProjects: {}},
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HomeAttentionComponent);
  });

  it('links the authorised staff counts to their unit queues without loading student notifications', () => {
    fixture.componentRef.setInput('staff', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('4 waiting for feedback');
    expect(fixture.nativeElement.textContent).toContain('Longest feedback wait: 9 teaching days');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe(
      '/units/8/tasks/inbox?students=mine',
    );
    expect(notifications).not.toHaveBeenCalled();
  });

  it('shows unavailable and supports retry instead of reporting an empty staff queue on errors', () => {
    staff.mockReturnValueOnce(throwError(() => new Error('offline')));
    fixture.componentRef.setInput('staff', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'could not check',
    );
    expect(fixture.nativeElement.textContent).not.toContain('No submissions or requests');
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('4 waiting for feedback');
  });

  it('does not claim there are no updates when the notification request fails', () => {
    notifications.mockReturnValue(throwError(() => new Error('offline')));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Date and extension updates could not be checked',
    );
    expect(fixture.nativeElement.textContent).not.toContain('No unread messages');
    expect(staff).not.toHaveBeenCalled();
  });

  it('cancels an unfinished staff request when navigating away', () => {
    const pending: Subject<StaffAttention> = new Subject();
    staff.mockReturnValue(pending);
    fixture.componentRef.setInput('staff', true);
    fixture.detectChanges();
    expect(pending.observed).toBe(true);
    fixture.destroy();
    expect(pending.observed).toBe(false);
  });

  it('gives the staff queue a named section and keyboard links without accessibility violations', async () => {
    fixture.componentRef.setInput('staff', true);
    const main = document.createElement('main');
    fixture.nativeElement.replaceWith(main);
    main.appendChild(fixture.nativeElement);
    try {
      fixture.detectChanges();
      await fixture.whenStable();
      const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
      link.focus();
      expect(document.activeElement).toBe(link);
      expect(link.textContent).toContain('for SIT764');
      await expectAccessible(main);
    } finally {
      main.remove();
    }
  });

  it('acknowledges a date update when opening it, leaving unrelated actions and new-tab clicks unchanged', () => {
    const notice = Object.assign(new Notification(), {id: 12, readAt: null});
    const item = {dateNotification: notice} as StudentAttentionItem;
    fixture.componentInstance.acknowledgeDateUpdate(item, new MouseEvent('click', {ctrlKey: true}));
    fixture.componentInstance.acknowledgeDateUpdate(
      {dateNotification: null} as StudentAttentionItem,
      new MouseEvent('click'),
    );
    expect(markRead).not.toHaveBeenCalled();
    fixture.componentInstance.acknowledgeDateUpdate(item, new MouseEvent('click'));
    expect(markRead).toHaveBeenCalledWith(notice);
  });
});
