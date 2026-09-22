import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

export interface AttachmentConfirmationDialogData {
  file: File;
  category?: string;
}

@Component({
  selector: 'f-attachment-confirmation-dialog',
  templateUrl: './attachment-confirmation-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AttachmentConfirmationDialogComponent implements OnInit, OnDestroy, AfterViewInit {
  public file: File;
  public previewUrl: string | null = null;

  @ViewChild('dialogRoot', {static: true}) private dialogRoot: ElementRef<HTMLElement>;
  private removeEnterGuard: (() => void) | null = null;

  constructor(
    public dialogRef: MatDialogRef<AttachmentConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AttachmentConfirmationDialogData,
    private renderer: Renderer2,
  ) {}

  ngOnInit() {
    this.file = this.data.file;
    if (this.isImage || this.isAudio) {
      this.previewUrl = URL.createObjectURL(this.file);
    }
  }

  ngAfterViewInit() {
    // Keep the dialog's Enter contained so it cannot reach outer keyboard
    // shortcuts, without blocking native activation of the dialog's controls.
    this.removeEnterGuard = this.renderer.listen(
      this.dialogRoot.nativeElement,
      'keydown',
      (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          event.stopPropagation();
        }
      },
    );
  }

  ngOnDestroy() {
    this.removeEnterGuard?.();
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  get isImage(): boolean {
    return this.file?.type?.startsWith('image/') ?? false;
  }

  get isPdf(): boolean {
    return this.file?.type === 'application/pdf' || this.file?.name?.toLowerCase().endsWith('.pdf');
  }

  get isAudio(): boolean {
    return this.file?.type?.startsWith('audio/') ?? false;
  }

  dismiss(confirmed: boolean) {
    this.dialogRef.close(confirmed);
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
}
