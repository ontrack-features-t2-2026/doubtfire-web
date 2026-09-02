import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
  HttpHeaders,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {AlertService} from '../services/alert.service';
import {FileDownloaderService} from './file-downloader.service';

describe('FileDownloaderService download feedback', () => {
  let service: FileDownloaderService;
  let httpMock: HttpTestingController;
  let alerts: {
    message: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let clickedFilenames: string[];
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    vi.useFakeTimers();
    clickedFilenames = [];
    alerts = {message: vi.fn(), error: vi.fn()};
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    createObjectURL = vi.fn(() => 'blob:download');
    revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {configurable: true, value: createObjectURL});
    Object.defineProperty(URL, 'revokeObjectURL', {configurable: true, value: revokeObjectURL});

    TestBed.configureTestingModule({
      providers: [
        FileDownloaderService,
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {provide: AlertService, useValue: alerts},
      ],
    });

    service = TestBed.inject(FileDownloaderService);
    httpMock = TestBed.inject(HttpTestingController);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      clickedFilenames.push(this.download);
    });
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectURL,
    });
  });

  it('announces start only after dispatch, prefers filename*, and revokes its object URL', () => {
    service.downloadFileWithFeedback('/feedback/42', 'fallback.pdf');

    expect(alerts.message).not.toHaveBeenCalled();
    expect(clickedFilenames).toEqual([]);

    httpMock.expectOne('/feedback/42').flush(new Blob(['pdf'], {type: 'application/pdf'}), {
      headers: new HttpHeaders({
        'Content-Disposition':
          "attachment; filename=legacy.pdf; filename*=UTF-8''..%2Fprivate%2F%E2%9C%93%20review.pdf",
      }),
    });

    expect(clickedFilenames).toEqual(['✓ review.pdf']);
    expect(alerts.message).toHaveBeenCalledOnce();
    expect(alerts.message).toHaveBeenCalledWith('Download started: ✓ review.pdf');
    expect(alerts.error).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();

    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:download');
  });

  it('falls back to a safely bounded plain filename when filename* is malformed', () => {
    service.downloadFileWithFeedback('/feedback/43', 'fallback.pdf');

    httpMock.expectOne('/feedback/43').flush(new Blob(['docx']), {
      headers: new HttpHeaders({
        'Content-Disposition':
          "attachment; filename=..\\safe\\Feedback <draft>.docx; filename*=UTF-8''%E0%A4%A",
      }),
    });

    expect(clickedFilenames).toEqual(['Feedback <draft>.docx']);
    expect(alerts.message).toHaveBeenCalledWith('Download started: Feedback <draft>.docx');
  });

  it('reports a retrieval failure without claiming that a download started or exposing the error', () => {
    service.downloadFileWithFeedback('/feedback/44', '../Student feedback.docx');

    httpMock.expectOne('/feedback/44').flush(new Blob(['private server detail']), {
      status: 503,
      statusText: 'Unavailable',
    });

    expect(clickedFilenames).toEqual([]);
    expect(alerts.message).not.toHaveBeenCalled();
    expect(alerts.error).toHaveBeenCalledOnce();
    expect(alerts.error).toHaveBeenCalledWith(
      'Download failed: Student feedback.docx. Please try again.',
    );
  });

  it('ignores a stale response when a newer request uses the same control key', () => {
    service.downloadFileWithFeedback('/feedback/old', 'feedback.pdf', {requestKey: 'comment-7'});
    service.downloadFileWithFeedback('/feedback/new', 'feedback.pdf', {requestKey: 'comment-7'});

    httpMock.expectOne('/feedback/old').flush(new Blob(['old']));

    expect(clickedFilenames).toEqual([]);
    expect(alerts.message).not.toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:download');

    httpMock.expectOne('/feedback/new').flush(new Blob(['new']));

    expect(clickedFilenames).toEqual(['feedback.pdf']);
    expect(alerts.message).toHaveBeenCalledOnce();
    expect(alerts.error).not.toHaveBeenCalled();
  });

  it('reports dispatch failure and still revokes an internally-created object URL', () => {
    vi.mocked(HTMLAnchorElement.prototype.click).mockImplementation(() => {
      throw new Error('browser rejected click');
    });

    service.downloadFileWithFeedback('/feedback/45', 'feedback.pdf');
    httpMock.expectOne('/feedback/45').flush(new Blob(['pdf']));

    expect(alerts.message).not.toHaveBeenCalled();
    expect(alerts.error).toHaveBeenCalledWith('Download failed: feedback.pdf. Please try again.');

    vi.runOnlyPendingTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:download');
  });

  it('reports failure when the browser cannot create a downloadable object URL', () => {
    createObjectURL.mockImplementationOnce(() => {
      throw new Error('object URLs unavailable');
    });

    service.downloadFileWithFeedback('/feedback/46', 'feedback.pdf');
    httpMock.expectOne('/feedback/46').flush(new Blob(['pdf']));

    expect(clickedFilenames).toEqual([]);
    expect(alerts.message).not.toHaveBeenCalled();
    expect(alerts.error).toHaveBeenCalledWith('Download failed: feedback.pdf. Please try again.');
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it('reports dispatch of a caller-owned blob without revoking the preview URL', () => {
    service.downloadBlobToFileWithFeedback('blob:preview', '../displayed-pdf.pdf');

    expect(clickedFilenames).toEqual(['displayed-pdf.pdf']);
    expect(alerts.message).toHaveBeenCalledWith('Download started: displayed-pdf.pdf');
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it('keeps the legacy URL-download API toast-free while releasing its temporary blob', () => {
    service.downloadFile('/legacy/export', 'export.csv');
    httpMock.expectOne('/legacy/export').flush(new Blob(['row']));

    expect(clickedFilenames).toEqual(['export.csv']);
    expect(alerts.message).not.toHaveBeenCalled();
    expect(alerts.error).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:download');
  });
});
