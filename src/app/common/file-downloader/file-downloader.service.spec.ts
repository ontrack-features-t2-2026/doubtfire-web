import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {HttpErrorResponse, provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {AlertService} from '../services/alert.service';
import {FileDownloaderService} from './file-downloader.service';

describe('FileDownloaderService', () => {
  const endpoint = '/api/projects/12/tasks/34/submission';
  let service: FileDownloaderService;
  let http: HttpTestingController;
  const success = vi.fn();
  const failure = vi.fn();
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:download');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL = createObjectURL;
      },
    );
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: AlertService, useValue: {error: vi.fn()}},
      ],
    });
    service = TestBed.inject(FileDownloaderService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function part(range: string | null, text: string) {
    http.expectOne(endpoint).flush(new Blob([text], {type: 'application/pdf'}), {
      status: 206,
      statusText: 'Partial Content',
      headers: range ? {'Content-Range': range} : {},
    });
  }

  function readBlob(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
  }

  it('downloads a complete file without requesting another part', async () => {
    service.downloadBlob(endpoint, success, failure);
    const request = http.expectOne(endpoint);
    expect(request.request.responseType).toBe('blob');
    expect(request.request.headers.has('Range')).toBe(false);
    request.flush(new Blob(['complete'], {type: 'application/pdf'}));

    expect(success).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(await readBlob(blob)).toBe('complete');
    expect(blob.type).toBe('application/pdf');
    expect(failure).not.toHaveBeenCalled();
  });

  it('joins consecutive ranges and requests only remaining byte indexes', async () => {
    service.downloadBlob(endpoint, success, failure);
    part('bytes 0-2/6', 'abc');
    expect(success).not.toHaveBeenCalled();
    const next = http.expectOne(endpoint);
    expect(next.request.headers.get('Range')).toBe('bytes=3-5');
    next.flush(new Blob(['def'], {type: 'application/pdf'}), {
      status: 206,
      statusText: 'Partial Content',
      headers: {'Content-Range': 'bytes 3-5/6'},
    });

    expect(success).toHaveBeenCalledOnce();
    expect(await readBlob(createObjectURL.mock.calls[0][0])).toBe('abcdef');
    expect(failure).not.toHaveBeenCalled();
  });

  it('accepts case-insensitive byte range units', async () => {
    service.downloadBlob(endpoint, success, failure);
    part('Bytes 0-2/3', 'abc');

    expect(success).toHaveBeenCalledOnce();
    expect(await readBlob(createObjectURL.mock.calls[0][0])).toBe('abc');
    expect(failure).not.toHaveBeenCalled();
  });

  it.each([
    [null, 'abc'],
    ['garbage', 'abc'],
    ['bytes 0-x/6', 'abc'],
    ['bytes 0-2/*', 'abc'],
    ['bytes 1-3/6', 'abc'],
    ['bytes 0-6/6', 'abcdefg'],
    ['bytes 0-2/6', 'ab'],
    ['bytes 0-9007199254740992/9007199254740993', 'abc'],
  ])('fails once for invalid Content-Range %s without publishing a partial file', (range, body) => {
    service.downloadBlob(endpoint, success, failure);
    part(range, body);

    expect(failure).toHaveBeenCalledOnce();
    expect(success).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
    http.expectNone(endpoint);
  });

  it.each(['bytes 0-2/6', 'bytes 4-5/6', 'bytes 3-5/7'])(
    'rejects a duplicate, skipped, or changed-size continuation %s',
    (range) => {
      service.downloadBlob(endpoint, success, failure);
      part('bytes 0-2/6', 'abc');
      part(range, range === 'bytes 4-5/6' ? 'ef' : 'def');

      expect(failure).toHaveBeenCalledOnce();
      expect(success).not.toHaveBeenCalled();
      expect(createObjectURL).not.toHaveBeenCalled();
      http.expectNone(endpoint);
    },
  );

  it('uses the complete response when the server ignores a continuation Range', async () => {
    service.downloadBlob(endpoint, success, failure);
    part('bytes 0-2/6', 'abc');
    http.expectOne(endpoint).flush(new Blob(['abcdef']));

    expect(await readBlob(createObjectURL.mock.calls[0][0])).toBe('abcdef');
    expect(success).toHaveBeenCalledOnce();
    expect(failure).not.toHaveBeenCalled();
  });

  it('reports a failed continuation without offering a truncated download', () => {
    service.downloadBlob(endpoint, success, failure);
    part('bytes 0-2/6', 'abc');
    http.expectOne(endpoint).flush(null, {status: 500, statusText: 'Server Error'});

    expect(failure).toHaveBeenCalledWith(expect.any(HttpErrorResponse));
    expect(success).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
