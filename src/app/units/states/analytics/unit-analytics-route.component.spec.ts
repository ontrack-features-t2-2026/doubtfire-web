import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject, Observable, Subject, of, throwError} from 'rxjs';
import {SidekiqJob} from 'src/app/api/models/sidekiq-job';
import {Unit} from 'src/app/api/models/unit';
import {UserService} from 'src/app/api/services/user.service';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {SidekiqProgressModalService} from 'src/app/common/modals/sidekiq-progress-modal/sidekiq-progress-modal.service';
import {PageContainerComponent} from 'src/app/common/page-container/page-container.component';
import {AlertService} from 'src/app/common/services/alert.service';
import {UnitAnalyticsComponent} from './unit-analytics-route.component';

describe('UnitAnalyticsComponent', () => {
  let fixture: ComponentFixture<UnitAnalyticsComponent>;
  let component: UnitAnalyticsComponent;
  let unit$: BehaviorSubject<Unit>;
  let currentUser: {id: number; systemRole: string};
  let alertError: ReturnType<typeof vi.fn>;
  let modalShow: ReturnType<typeof vi.fn>;
  let downloadBlobToFile: ReturnType<typeof vi.fn>;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  const job = (id: string | undefined): Observable<SidekiqJob> =>
    of({id, result: 'a,b\n1,2'} as SidekiqJob);

  const makeUnit = (id: number, code: string, role: string): Unit =>
    ({
      id,
      code,
      staff: [{role, user: {id: 7}}],
      downloadTaskCompletionCsv: vi.fn(() => job('task-completion')),
      downloadTaskAssessmentCountsCsv: vi.fn(() => job('assessment-counts')),
      downloadTasksAwaitingFeedbackCsv: vi.fn(() => job('awaiting')),
      downloadTutorAssessmentCsv: vi.fn(() => job('tutor')),
      downloadOverflowTaskClaimsCsv: vi.fn(() => job('overflow')),
    }) as unknown as Unit;

  const render = (): HTMLElement => {
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const reportIds = (): string[] =>
    Array.from(render().querySelectorAll<HTMLElement>('[data-report]')).map(
      (row) => row.dataset.report,
    );

  beforeEach(async () => {
    currentUser = {id: 7, systemRole: 'Tutor'};
    unit$ = new BehaviorSubject(makeUnit(1, 'COS10001', 'Tutor'));
    alertError = vi.fn();
    modalShow = vi.fn(() => new Subject<SidekiqJob>());
    downloadBlobToFile = vi.fn();

    // jsdom has no object URLs.
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:csv'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {configurable: true, value: vi.fn()});

    await TestBed.configureTestingModule({
      declarations: [UnitAnalyticsComponent, PageContainerComponent],
      imports: [MatButtonModule, MatIconModule],
      providers: [
        {provide: AlertService, useValue: {error: alertError}},
        {provide: SidekiqProgressModalService, useValue: {show: modalShow}},
        {provide: FileDownloaderService, useValue: {downloadBlobToFile}},
        {
          provide: UserService,
          useValue: {
            get currentUser() {
              return currentUser;
            },
          },
        },
        {provide: ActivatedRoute, useValue: {parent: {snapshot: {data: {}}}}},
      ],
      // The tutor times card has its own spec.
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UnitAnalyticsComponent);
    component = fixture.componentInstance;
    component.unit$ = unit$;
  });

  afterEach(() => {
    unit$.complete();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectURL,
    });
  });

  it('opens with a page heading and a plain line naming the unit', () => {
    const page = render();

    expect(page.querySelector('h1')?.textContent?.trim()).toBe('Unit analytics');
    expect(page.querySelector('header p')?.textContent).toContain('COS10001');
  });

  it('groups the reports under plain headings, each with a description', () => {
    const page = render();

    const headings = Array.from(page.querySelectorAll('h3')).map((h) => h.textContent?.trim());
    expect(headings).toEqual(['Students and tasks', 'Marking and feedback']);

    const completion = page.querySelector('[data-report="taskCompletion"]');
    expect(completion?.textContent).toContain('Task completion');
    expect(completion?.textContent).toContain("Each student's status on every task");
    expect(completion?.querySelector('button')?.getAttribute('aria-label')).toBe(
      'Download Task completion as CSV',
    );
  });

  it('keeps overflow task claims to convenors and admins, as before', () => {
    expect(reportIds()).toEqual([
      'taskCompletion',
      'taskAssessmentCounts',
      'tasksAwaitingFeedback',
      'tutorAssessments',
    ]);

    unit$.next(makeUnit(2, 'COS20007', 'Convenor'));
    expect(reportIds()).toContain('overflowTaskClaims');

    unit$.next(makeUnit(3, 'COS30008', 'Tutor'));
    currentUser = {id: 7, systemRole: 'Admin'};
    expect(reportIds()).toContain('overflowTaskClaims');
  });

  it('downloads each report from its own endpoint under its old file name', () => {
    const unit = unit$.value;
    const download = vi.spyOn(component, 'downloadCsv');
    render();

    component.downloadReport({id: 'taskAssessmentCounts', title: '', description: ''});

    expect(unit.downloadTaskAssessmentCountsCsv).toHaveBeenCalled();
    expect(download).toHaveBeenCalledWith(
      expect.any(Observable),
      'task assessment counts CSV',
      'COS10001-task-assessment-counts.csv',
    );
  });

  it('saves the finished job as a CSV file named for the report', () => {
    const done: Subject<SidekiqJob> = new Subject();
    modalShow.mockReturnValue(done);
    render();

    component.getTaskCompletionCsv();
    expect(modalShow).toHaveBeenCalledWith('Downloading task completion CSV', 'task-completion');

    done.next({id: 'task-completion', result: 'a,b\n1,2'} as SidekiqJob);
    expect(downloadBlobToFile).toHaveBeenCalledWith(
      'blob:csv',
      'COS10001-task-completion-stats.csv',
    );
  });

  it('shows an alert when the server does not start a job', () => {
    render();

    component.downloadCsv(job(undefined), 'task completion CSV', 'x.csv');

    expect(alertError).toHaveBeenCalledWith('Failed to download task completion CSV', 6000);
    expect(modalShow).not.toHaveBeenCalled();
  });

  // The tutor times card calls downloadCsv through an input, so `this` was the card.
  // The card has no alertsService, so a failed download threw a TypeError instead.
  it('still shows the alert when another component calls downloadCsv', () => {
    render();
    const card = {downloadCsvFn: component.downloadCsv};

    card.downloadCsvFn(
      throwError(() => 'Server error'),
      'tutor times summary CSV',
      'x.csv',
    );

    expect(alertError).toHaveBeenCalledWith(
      'Could not download tutor times summary CSV: Server error',
      6000,
    );
  });

  it('still shows the alert when another component gets no job back', () => {
    render();
    const card = {downloadCsvFn: component.downloadCsv};

    card.downloadCsvFn(job(undefined), 'marking sessions CSV', 'x.csv');

    expect(alertError).toHaveBeenCalledWith('Failed to download marking sessions CSV', 6000);
  });

  it('follows the unit when the header switches to another unit', () => {
    render();
    unit$.next(makeUnit(2, 'COS20007', 'Convenor'));

    expect(component.unit.code).toBe('COS20007');
    expect(render().querySelector('header p')?.textContent).toContain('COS20007');
  });
});
