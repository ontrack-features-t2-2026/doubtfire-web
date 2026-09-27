import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatIconModule} from '@angular/material/icon';
import {TaskComment} from 'src/app/api/models/doubtfire-model';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {CommentsModalService} from 'src/app/common/modals/comments-modal/comments-modal.service';
import {SafePipe} from 'src/app/common/pipes/safe.pipe';
import {AlertService} from 'src/app/common/services/alert.service';
import {PdfImageCommentComponent} from './pdf-image-comment.component';

describe('PDF and image attachment keyboard controls', () => {
  let fixture: ComponentFixture<PdfImageCommentComponent>;
  let downloader: {downloadBlob: ReturnType<typeof vi.fn>; releaseBlob: ReturnType<typeof vi.fn>};
  let modal: {show: ReturnType<typeof vi.fn>};
  let alerts: {error: ReturnType<typeof vi.fn>};

  beforeEach(async () => {
    downloader = {
      downloadBlob: vi.fn((_url, success) => success('blob:attachment', undefined)),
      releaseBlob: vi.fn(),
    };
    modal = {show: vi.fn()};
    alerts = {error: vi.fn()};
    await TestBed.configureTestingModule({
      declarations: [PdfImageCommentComponent, SafePipe],
      imports: [MatIconModule],
      providers: [
        {provide: FileDownloaderService, useValue: downloader},
        {provide: CommentsModalService, useValue: modal},
        {provide: AlertService, useValue: alerts},
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PdfImageCommentComponent);
  });

  it.each(['pdf', 'image'])('opens the %s preview from a named native button', (commentType) => {
    const comment = {commentType, attachmentUrl: '/attachment'} as TaskComment;
    fixture.componentInstance.comment = comment;
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button).not.toBeNull();
    expect(button.type).toBe('button');
    expect(button.tabIndex).toBe(0);
    expect(button.getAttribute('aria-label')).toBe(
      commentType === 'pdf' ? 'View PDF attachment' : 'View image attachment',
    );
    button.focus();
    expect(document.activeElement).toBe(button);
    const enter = new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true});
    button.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(false);
    // jsdom does not synthesize the native button activation from Enter.
    button.click();

    expect(modal.show).toHaveBeenCalledExactlyOnceWith('blob:attachment', comment);
    expect(downloader.downloadBlob).toHaveBeenCalledTimes(1);
    expect(alerts.error).not.toHaveBeenCalled();
    if (commentType === 'image') {
      expect(button.querySelector('img').getAttribute('alt')).toBe('Image attachment preview');
    }
  });

  it('reports a failed attachment download without opening an empty preview', () => {
    downloader.downloadBlob.mockImplementation((_url, _success, failure) => failure('offline'));
    fixture.componentInstance.comment = {
      commentType: 'pdf',
      attachmentUrl: '/attachment',
    } as TaskComment;
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button').click();

    expect(modal.show).not.toHaveBeenCalled();
    expect(alerts.error).toHaveBeenCalledWith('Unable to download image comment. offline', 6000);
  });
});
