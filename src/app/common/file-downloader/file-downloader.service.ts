import {HttpClient, HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {AlertService} from '../services/alert.service';

interface FileDownloaderData {
  url: string;
  response: HttpResponse<Blob>;
  success: (url: string, response: HttpResponse<Blob>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  failure: (error: any) => void;

  binaryData: Blob[];
  totalSize?: number;
}

@Injectable({
  providedIn: 'root',
})
export class FileDownloaderService {
  constructor(
    private httpClient: HttpClient,
    private alerts: AlertService,
  ) {}

  private processPartialBlob(data: FileDownloaderData) {
    const range = data.response.headers.get('Content-Range');
    const match = /^bytes (\d+)-(\d+)\/(\d+)$/i.exec(range ?? '');
    const received = data.binaryData.reduce((size, blob) => size + blob.size, 0);
    const [start, end, totalSize] = match ? match.slice(1).map(Number) : [];

    if (
      !match ||
      ![start, end, totalSize].every(Number.isSafeInteger) ||
      start !== received ||
      end < start ||
      end >= totalSize ||
      data.response.body?.size !== end - start + 1 ||
      (data.totalSize !== undefined && data.totalSize !== totalSize)
    ) {
      data.failure?.('Unable to read data from server: invalid or out-of-order file range');
      return;
    }

    data.totalSize = totalSize;
    data.binaryData.push(data.response.body);
    if (end + 1 === totalSize) {
      this.reportSuccess(data);
      return;
    }

    this.httpClient
      .get(data.url, {
        responseType: 'blob',
        observe: 'response',
        headers: {Range: `bytes=${end + 1}-${totalSize - 1}`},
      })
      .subscribe({
        next: (response) => {
          data.response = response;
          this.processHttpResponse(data);
        },
        error: (error) => data.failure?.(error),
      });
  }

  private processHttpResponse(data: FileDownloaderData) {
    // Check if we have a partial content response
    if (data.response.status === 206) {
      this.processPartialBlob(data);
    } else {
      // A server can ignore Range and return the complete file with 200.
      // Replace previous parts rather than appending the full file to them.
      data.binaryData = [data.response.body];
      this.reportSuccess(data);
    }
  }

  private reportSuccess(data: FileDownloaderData) {
    const resourceUrl: string = window.URL.createObjectURL(
      new Blob(data.binaryData, {type: data.response.body.type}),
    );
    data.success(resourceUrl, data.response);
  }

  public downloadBlob(
    url: string,
    success: (url: string, response: HttpResponse<Blob>) => void,
    failure: (error) => void,
  ) {
    // Declare binary data outside of the subscription so that it can be accessed in the second requests when partial content is returned
    const binaryData = [];

    this.httpClient.get(url, {responseType: 'blob', observe: 'response'}).subscribe({
      next: (response) => {
        this.processHttpResponse({
          url: url,
          response: response,
          success: success,
          failure: failure,
          binaryData: binaryData,
        });
      },
      error: (error) => {
        if (failure) {
          failure(error);
        }
      },
    });
  }

  public releaseBlob(url: string): void {
    window.URL.revokeObjectURL(url);
  }

  /**
   * Download or save a blob to a file. This will trigger the user to "download"
   * the blob, with the suggested filename.
   *
   * @param blobUrl the url of the blob to download/save to file
   * @param filename the name of the file
   */
  public downloadBlobToFile(blobUrl: string, filename: string): void {
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.target = '_blank';
    downloadLink.setAttribute('download', filename);
    document.body.appendChild(downloadLink);

    downloadLink.click();
    downloadLink.parentNode.removeChild(downloadLink);
  }

  public downloadFile(url: string, defaultFilename: string) {
    this.downloadBlob(
      url,
      (resourceUrl: string, response: HttpResponse<Blob>) => {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;

        const matches = filenameRegex.exec(response.headers.get('Content-Disposition'));
        let filename: string;

        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        } else {
          filename = defaultFilename;
        }

        this.downloadBlobToFile(resourceUrl, filename);
      },
      (error) => {
        this.alerts.error(`Error downloading file - ${error}`);
      },
    );
  }
}
