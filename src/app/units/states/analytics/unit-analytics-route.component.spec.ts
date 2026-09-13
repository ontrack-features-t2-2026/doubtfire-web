import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject, Observable, Subject, of, throwError} from 'rxjs';
import {SidekiqJob} from 'src/app/api/models/sidekiq-job';
import {Unit} from 'src/app/api/models/unit';
import {UserService} from 'src/app/api/services/user.service';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {SidekiqProgressModalService} from 'src/app/common/modals/sidekiq-progress-modal/sidekiq-progress-modal.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {UnitAnalyticsComponent} from './unit-analytics-route.component';

describe('UnitAnalyticsComponent downloads', () => {
  let fixture: ComponentFixture<UnitAnalyticsComponent>;
  let component: UnitAnalyticsComponent;
  let unit$: BehaviorSubject<Unit>;
  let alertError: ReturnType<typeof vi.fn>;
  let modalShow: ReturnType<typeof vi.fn>;
  let downloadBlobToFile: ReturnType<typeof vi.fn>;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  const job = (id: string | undefined): Observable<SidekiqJob> =>
    of({id, result: 'a,b\n1,2'} as SidekiqJob);

  beforeEach(async () => {
    unit$ = new BehaviorSubject({
      id: 1,
      code: 'COS10001',
      staff: [{role: 'Tutor', user: {id: 7}}],
      downloadTaskCompletionCsv: vi.fn(() => job('task-completion')),
    } as unknown as Unit);
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
      declarations: [UnitAnalyticsComponent],
      providers: [
        {provide: AlertService, useValue: {error: alertError}},
        {provide: SidekiqProgressModalService, useValue: {show: modalShow}},
        {provide: FileDownloaderService, useValue: {downloadBlobToFile}},
        {provide: UserService, useValue: {currentUser: {id: 7, systemRole: 'Tutor'}}},
        {provide: ActivatedRoute, useValue: {parent: {snapshot: {data: {}}}}},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(UnitAnalyticsComponent, {set: {template: ''}})
      .compileComponents();

    fixture = TestBed.createComponent(UnitAnalyticsComponent);
    component = fixture.componentInstance;
    component.unit$ = unit$;
    fixture.detectChanges();
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

  it('saves the finished job as a CSV file named for the report', () => {
    const done: Subject<SidekiqJob> = new Subject();
    modalShow.mockReturnValue(done);

    component.getTaskCompletionCsv();
    done.next({id: 'task-completion', result: 'a,b\n1,2'} as SidekiqJob);

    expect(downloadBlobToFile).toHaveBeenCalledWith(
      'blob:csv',
      'COS10001-task-completion-stats.csv',
    );
  });

  it('shows an alert when the server does not start a job', () => {
    component.downloadCsv(job(undefined), 'report', 'x.csv');

    expect(alertError).toHaveBeenCalledWith('Failed to download report', 6000);
    expect(modalShow).not.toHaveBeenCalled();
  });

  // The tutor times card calls downloadCsv through an input, so `this` was the card.
  // The card has no alertsService, so a failed download threw a TypeError instead.
  it('still shows the alert when another component calls downloadCsv', () => {
    const card = {downloadCsvFn: component.downloadCsv};

    card.downloadCsvFn(
      throwError(() => 'Server error'),
      'tutor times summary',
      'x.csv',
    );

    expect(alertError).toHaveBeenCalledWith(
      'Could not download tutor times summary: Server error',
      6000,
    );
  });

  it('still shows the alert when another component gets no job back', () => {
    const card = {downloadCsvFn: component.downloadCsv};

    card.downloadCsvFn(job(undefined), 'my marking sessions', 'x.csv');

    expect(alertError).toHaveBeenCalledWith('Failed to download my marking sessions', 6000);
  });
});
