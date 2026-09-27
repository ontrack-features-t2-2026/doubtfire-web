import {formatDate} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable, Subscription, catchError, distinctUntilChanged, forkJoin, of} from 'rxjs';
import {SidekiqJob} from 'src/app/api/models/sidekiq-job';
import {Unit} from 'src/app/api/models/unit';
import {
  TargetGradeStat,
  TaskCompletionStats,
  TaskStatusStats,
  UnitService,
} from 'src/app/api/services/unit.service';
import {UserService} from 'src/app/api/services/user.service';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {SidekiqProgressModalService} from 'src/app/common/modals/sidekiq-progress-modal/sidekiq-progress-modal.service';
import {AlertService} from 'src/app/common/services/alert.service';

@Component({
  selector: 'f-unit-analytics',
  templateUrl: 'unit-analytics-route.component.html',
  styleUrls: ['unit-analytics-route.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class UnitAnalyticsComponent implements OnInit, OnDestroy {
  @Input() public unit$: Observable<Unit>;

  public unit: Unit;

  public tutorialId: number | null = null;
  public taskStatusStats: TaskStatusStats | null = null;
  public targetGradeStats: TargetGradeStat[] | null = null;
  public taskCompletionStats: TaskCompletionStats | null = null;
  public statisticsLoading = false;
  public statisticsFailed = false;
  private statisticsSub?: Subscription;
  private unitSub?: Subscription;

  constructor(
    private sidekiqProgressModalService: SidekiqProgressModalService,
    private alertsService: AlertService,
    private fileDownloaderService: FileDownloaderService,
    private userService: UserService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private unitService: UnitService,
    @Inject(LOCALE_ID) private locale: string,
  ) {}

  ngOnInit(): void {
    this.unit$ = this.unit$ ?? of(this.route.parent.snapshot.data.unit);
    this.unitSub = this.unit$
      ?.pipe(distinctUntilChanged((a, b) => a?.id === b?.id))
      .subscribe((unit) => {
        this.unit = unit;
        this.tutorialId = null;
        this.loadStatistics();
      });
  }

  ngOnDestroy(): void {
    this.unitSub?.unsubscribe();
    this.statisticsSub?.unsubscribe();
  }

  public loadStatistics(): void {
    this.statisticsSub?.unsubscribe();
    this.taskStatusStats = null;
    this.targetGradeStats = null;
    this.taskCompletionStats = null;
    this.statisticsFailed = false;
    this.statisticsLoading = !!this.unit;
    if (!this.unit) {
      return;
    }
    this.statisticsSub = forkJoin({
      statuses: this.unitService
        .taskStatusCountByTutorial(this.unit)
        .pipe(catchError(() => of(null))),
      grades: this.unitService.targetGradeStats(this.unit).pipe(catchError(() => of(null))),
      completion: this.unitService.taskCompletionStats(this.unit).pipe(catchError(() => of(null))),
    }).subscribe(({statuses, grades, completion}) => {
      this.taskStatusStats = statuses;
      this.targetGradeStats = grades;
      this.taskCompletionStats = completion;
      this.statisticsFailed = statuses === null || grades === null || completion === null;
      this.statisticsLoading = false;
    });
  }

  get role() {
    return this.unit?.staff.find((s) => s.user.id === this.userService.currentUser.id)?.role;
  }

  get isAdmin() {
    return this.userService.currentUser?.systemRole === 'Admin';
  }

  public getTaskCompletionCsv() {
    this.downloadCsv(
      this.unit.downloadTaskCompletionCsv(),
      'Task Completion Stats CSV',
      `${this.unit.code}-task-completion-stats.csv`,
    );
  }

  public getTutorAssessmentCsv() {
    this.downloadCsv(
      this.unit.downloadTutorAssessmentCsv(),
      'Tutor Assessment Stats CSV',
      `${this.unit.code}-tutor-assessment-stats.csv`,
    );
  }

  public getTasksAwaitingFeedbackCsv() {
    this.downloadCsv(
      this.unit.downloadTasksAwaitingFeedbackCsv(),
      'Tasks Awaiting Feedback CSV',
      `${this.unit.code}-tasks-awaiting-feedback.csv`,
    );
  }

  public getTaskAssessmentCountCsv() {
    this.downloadCsv(
      this.unit.downloadTaskAssessmentCountsCsv(),
      'Task Assessment Counts CSV',
      `${this.unit.code}-task-assessment-counts.csv`,
    );
  }

  public getOverflowTaskClaimsCsv() {
    const timestamp = formatDate(new Date(), 'd-MMMM-y-HHmm', this.locale).toLowerCase();

    this.downloadCsv(
      this.unit.downloadOverflowTaskClaimsCsv(),
      'Overflow Task Claims CSV',
      `${this.unit.code}-overflow-task-claims-${timestamp}.csv`,
    );
  }

  public downloadCsv(newJob: Observable<SidekiqJob>, title: string, filename: string) {
    newJob.subscribe({
      next: (job) => {
        if (!job || !job.id) {
          return this.alertsService.error(`Failed to download ${title}`, 6000);
        }
        this.sidekiqProgressModalService.show(`Downloading ${title}`, job.id).subscribe((job) => {
          const blob = new Blob([job.result], {type: 'text/csv'});
          const url = URL.createObjectURL(blob);

          this.fileDownloaderService.downloadBlobToFile(url, filename);
        });
      },
      error: (error) => {
        this.alertsService.error(`Could not download ${title}: ${error}`, 6000);
      },
    });
  }
}
