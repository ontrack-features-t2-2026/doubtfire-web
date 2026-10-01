import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, Component, DestroyRef, Input, OnInit, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {RouterLink} from '@angular/router';
import {Subject, catchError, forkJoin, of, startWith, switchMap, tap} from 'rxjs';
import {Notification} from 'src/app/api/models/notification';
import {Project} from 'src/app/api/models/project';
import {
  AttentionService,
  StaffAttention,
  StaffAttentionUnit,
} from 'src/app/api/services/attention.service';
import {NotificationService} from 'src/app/api/services/notification.service';
import {ProjectService} from 'src/app/api/services/project.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {GlobalStateService} from 'src/app/projects/states/index/global-state.service';
import {StudentAttention, StudentAttentionItem, buildStudentAttention} from './student-attention';

@Component({
  selector: 'f-home-attention',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './home-attention.component.html',
  styleUrl: './home-attention.component.scss',
})
export class HomeAttentionComponent implements OnInit {
  @Input() projects: readonly Project[] = [];
  @Input() staff = false;
  loading = true;
  loadFailed = false;
  datesUnavailable = false;
  staffAttention: StaffAttention | null = null;
  private notices: Notification[] = [];
  private refreshedProjectIds: Set<number> | null = null;
  private readonly requests: Subject<boolean> = new Subject();
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private attentionService: AttentionService,
    private notifications: NotificationService,
    private projectService: ProjectService,
    private globalState: GlobalStateService,
    private alerts: AlertService,
  ) {}

  ngOnInit(): void {
    if (this.staff) {
      this.requests
        .pipe(
          startWith(false),
          tap(() => {
            this.loading = true;
            this.loadFailed = false;
          }),
          switchMap(() =>
            this.attentionService.staff().pipe(
              catchError(() => {
                this.loadFailed = true;
                return of(null);
              }),
            ),
          ),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((summary) => {
          this.staffAttention = summary;
          this.loading = false;
        });
    } else {
      this.globalState.projectLoadErrorSubject
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((failed) => (this.loadFailed = failed));
      this.requests
        .pipe(
          startWith(false),
          tap(() => {
            this.loading = true;
            this.datesUnavailable = false;
          }),
          switchMap((refreshProjects) =>
            forkJoin({
              notices: this.notifications.list(true).pipe(
                catchError(() => {
                  this.datesUnavailable = true;
                  return of([] as Notification[]);
                }),
              ),
              projects: refreshProjects
                ? this.projectService
                    .fetchAll(undefined, {
                      cache: this.globalState.currentUserProjects,
                      params: {include_inactive: false, include_task_definitions: true},
                    })
                    .pipe(
                      tap(() => this.globalState.projectLoadErrorSubject.next(false)),
                      catchError(() => {
                        this.globalState.projectLoadErrorSubject.next(true);
                        return of(null);
                      }),
                    )
                : of(null),
            }),
          ),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(({notices, projects}) => {
          this.notices = notices;
          if (projects !== null) {
            this.refreshedProjectIds = new Set(projects.map((project) => project.id));
          }
          this.loading = false;
        });
    }
  }

  get studentAttention(): StudentAttention {
    const projects =
      this.refreshedProjectIds === null
        ? this.projects
        : this.projects.filter((project) => this.refreshedProjectIds.has(project.id));
    return buildStudentAttention(projects, this.notices);
  }

  get waitingUnits(): StaffAttentionUnit[] {
    return (this.staffAttention?.units ?? [])
      .filter(
        (unit) =>
          unit.awaiting_feedback_count +
            unit.help_requested_count +
            unit.extension_requested_count >
          0,
      )
      .slice()
      .sort(
        (a, b) =>
          b.overdue_feedback_count - a.overdue_feedback_count ||
          (b.oldest_wait_days ?? 0) - (a.oldest_wait_days ?? 0) ||
          a.unit_code.localeCompare(b.unit_code),
      );
  }

  refresh(): void {
    if (!this.loading) {
      this.requests.next(true);
    }
  }

  acknowledgeDateUpdate(item: StudentAttentionItem, event: MouseEvent): void {
    const notice = item.dateNotification;
    if (
      !notice ||
      notice.isRead ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    // As in the notification bell, allow this request to finish across navigation.
    // NotificationService itself cancels it when the session ends.
    this.notifications.markRead(notice).subscribe({
      error: () =>
        this.alerts.error(
          'That date update could not be marked as read. It will stay in your notifications.',
        ),
    });
  }
}
