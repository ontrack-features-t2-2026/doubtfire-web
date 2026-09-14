import {PDFDocumentProxy, PdfViewerComponent} from 'ng2-pdf-viewer';
import {HttpResponse} from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {FileDownloaderService} from '../file-downloader/file-downloader.service';
import {AlertService} from '../services/alert.service';
import {ElementFullscreen} from './element-fullscreen';

@Component({
  selector: 'f-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class fPdfViewerComponent implements OnDestroy, OnChanges, AfterViewInit {
  private readonly ZOOM_MIN = 0.5;
  private readonly ZOOM_MAX = 2.5;

  private _pdfUrl: string;
  public pdfBlobUrl: string;
  public useNativePdfViewer = false;
  public pdfTotalPages?: number | undefined;
  public pdfHasRendered: boolean = false;

  @Input() pdfUrl: string;
  @Input() startPage: number = 1;

  public pageNumber: number = 1;

  @ViewChild(PdfViewerComponent) private pdfComponent: PdfViewerComponent;
  @ViewChild('pdfContainer', {static: true}) private container: ElementRef<HTMLElement>;
  pdfSearchString: string;
  zoomValue = 1;
  loaded = false;

  private readonly fullscreen = new ElementFullscreen(() => this.container?.nativeElement);
  /** Phones such as the iPhone only let video go full screen, so the button hides there. */
  public readonly canFullscreen = this.fullscreen.supported;
  public isFullscreen = false;

  constructor(
    @Inject(FileDownloaderService) private fileDownloader: FileDownloaderService,
    private alerts: AlertService,
  ) {}

  ngOnDestroy(): void {
    this.fullscreen.release();
    if (this.pdfBlobUrl) {
      this.fileDownloader.releaseBlob(this.pdfBlobUrl);
      this.pdfBlobUrl = null;
    }
  }

  ngAfterViewInit(): void {
    this.useNativePdfViewer = localStorage.getItem('useNativePdfViewer') === 'true';
    const storedZoomValue = parseFloat(localStorage.getItem('pdfViewerZoom')) || 1;
    // Clamp zoom value between ZOOM_MIN and ZOOM_MAX
    this.zoomValue = Math.min(Math.max(storedZoomValue, this.ZOOM_MIN), this.ZOOM_MAX);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.pdfUrlChanges(changes.pdfUrl.currentValue);
  }

  pdfUrlChanges(value: string): void {
    if (this._pdfUrl !== value) {
      // Free the memory used by the old PDF blob
      if (this.pdfBlobUrl) {
        this.fileDownloader.releaseBlob(this.pdfBlobUrl);
        this.pdfBlobUrl = null;
      }

      // Get the new blob
      this._pdfUrl = value;
      this.loaded = false;
      this.pdfHasRendered = false;
      if (value?.startsWith('blob:')) {
        this.pdfBlobUrl = value;
      } else {
        this.downloadBlob(value);
      }
    }
  }

  searchPdf(stringToSearch: string): void {
    this.pdfComponent.eventBus.dispatch('find', {
      query: stringToSearch,
      type: 'again',
      caseSensitive: false,
      findPrevious: undefined,
      highlightAll: true,
      phraseSearch: true,
    });
  }

  scrollToPage(pageNumber: number) {
    if (pageNumber <= this.pdfComponent.pdfViewer.pagesCount) {
      this.pdfComponent.pdfViewer.scrollPageIntoView({
        pageNumber,
      });
    }
  }

  public zoomIn() {
    if (this.zoomValue < this.ZOOM_MAX) {
      this.zoomValue += 0.1;
      localStorage.setItem('pdfViewerZoom', this.zoomValue.toString());
    }
  }
  public zoomOut() {
    if (this.zoomValue > this.ZOOM_MIN) {
      this.zoomValue -= 0.1;
      localStorage.setItem('pdfViewerZoom', this.zoomValue.toString());
    }
  }

  public downloadPdf() {
    this.fileDownloader.downloadBlobToFile(this.pdfBlobUrl, 'displayed-pdf.pdf');
  }

  /**
   * The browser's own full screen, for the task sheet or submission in this viewer.
   * Esc leaves it too, and fullscreenchange keeps the button in step either way.
   */
  public toggleFullscreen(): void {
    const entering = !this.fullscreen.active;
    this.fullscreen.toggle().catch((error: unknown) => {
      if (entering) {
        this.alerts.error(`Could not open full screen. ${error}`, 6000);
      }
    });
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen = this.fullscreen.active;
    // The pages are sized to the viewer's width when the window resizes, and the
    // viewer has just changed size.
    window.dispatchEvent(new Event('resize'));
  }

  public toggleNativePdfViewer() {
    this.useNativePdfViewer = !this.useNativePdfViewer;
    localStorage.setItem('useNativePdfViewer', this.useNativePdfViewer.toString());
  }

  private downloadBlob(downloadUrl: string): void {
    this.fileDownloader.downloadBlob(
      downloadUrl,
      (url: string, _response: HttpResponse<Blob>) => {
        this.pdfBlobUrl = url;
      },
      (error: unknown) => {
        this.alerts.error(`Error downloading PDF. ${error}`, 6000);
      },
    );
  }

  onLoaded(event: PDFDocumentProxy) {
    this.loaded = true;
    window.dispatchEvent(new Event('resize'));
    this.pdfTotalPages = event.numPages;
  }

  onTextLayerRendered() {
    if (this.pdfHasRendered) {
      return;
    }
    this.pdfHasRendered = true;
    setTimeout(() => {
      if (
        this.startPage &&
        this.startPage > 1 &&
        this.pdfTotalPages &&
        this.startPage <= this.pdfTotalPages
      ) {
        this.pageNumber = Number(this.startPage);
      }
    });
  }
}
