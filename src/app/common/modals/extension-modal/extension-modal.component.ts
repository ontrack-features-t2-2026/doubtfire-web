import {
  addDays,
  differenceInCalendarDays,
  differenceInDays,
  differenceInWeeks,
  endOfDay,
  format,
  isAfter,
  isBefore,
  startOfDay,
} from 'date-fns';
import {ChangeDetectionStrategy, Component, Inject, LOCALE_ID} from '@angular/core';
import {FormControl, FormGroup, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';
import {MatDatepickerInputEvent} from '@angular/material/datepicker';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Task, TaskComment, TaskCommentService} from 'src/app/api/models/doubtfire-model';
import {AlertService} from '../../services/alert.service';

/** Error when invalid control is dirty, touched, or submitted. */
export class ReasonErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'extension-modal',
  templateUrl: './extension-modal.component.html',
  styleUrl: './extension-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ExtensionModalComponent {
  protected reasonMinLength: number = 15;
  protected reasonMaxLength: number = 256;
  /** The counter turns to the warning colour from this many characters. */
  protected readonly reasonWarnLength = 230;
  submitting = false;
  errorMessage = '';
  private allowClose = false;
  private dateChanged = false;
  private dateEntryInvalid = false;
  constructor(
    public dialogRef: MatDialogRef<ExtensionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {task: Task; afterApplication?: () => void},
    @Inject(LOCALE_ID) public currentLocale: string,
    private alerts: AlertService,
    private taskComments: TaskCommentService,
  ) {}

  matcher = new ReasonErrorStateMatcher();
  extensionData = new FormGroup({
    extensionReason: new FormControl('', [
      Validators.required,
      Validators.minLength(this.reasonMinLength),
      Validators.maxLength(this.reasonMaxLength),
    ]),
  });

  get extensionDuration(): number {
    // calculating the number of weeks between now and the requested date, rounding up
    const days = differenceInDays(this.extensionDate, this.data.task.localDueDate());
    let weeks = differenceInWeeks(this.extensionDate, this.data.task.localDueDate());
    if (days % 7 > 0 || weeks == 0) {
      // round week count up if there are less than a week left or requested range is not in weeks
      weeks++;
    }
    return weeks;
  }

  // minimum date is due date if before target date, current date if after target date
  minDate = new Date(
    addDays(
      isAfter(Date.now(), this.data.task.localDueDate())
        ? new Date()
        : this.data.task.localDueDate(),
      1,
    ),
  );
  maxDate = this.data.task.localDeadlineDate(); // deadline, hard deadline
  extensionDate = new Date(this.minDate);
  addEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    this.dateEntryInvalid = !event.value;
    if (event.value) {
      this.extensionDate = new Date(event.value);
      this.dateChanged = true;
    }
  }

  /** Short date for the dialog, e.g. "Fri 11 Sep". */
  public formatShortDate(date: Date): string {
    return format(date, 'EEE d MMM');
  }

  public get dueDate(): Date {
    return this.data.task.localDueDate();
  }

  /** Whole days the task is past its due date, or 0 when it is not overdue. */
  public get daysPastDue(): number {
    const diff = Date.now() - this.dueDate.getTime();
    return diff > 0 ? Math.ceil(diff / (1000 * 3600 * 24)) : 0;
  }

  public get reasonLength(): number {
    return this.extensionData.controls.extensionReason.value?.length ?? 0;
  }

  public get reasonCounterState(): 'ok' | 'warn' | 'limit' {
    if (this.reasonLength >= this.reasonMaxLength) {
      return 'limit';
    }
    return this.reasonLength >= this.reasonWarnLength ? 'warn' : 'ok';
  }

  /** The allowed range for the new due date, e.g. "Sat 12 Sep to Thu 1 Oct". */
  public get dateRangeText(): string {
    if (!this.minDate || !this.maxDate) {
      return '';
    }
    return `${this.formatShortDate(this.minDate)} to ${this.formatShortDate(this.maxDate)}`;
  }

  /** Calendar days between the current due date and the picked date. */
  public get extensionDays(): number {
    return differenceInCalendarDays(this.extensionDate, this.dueDate);
  }

  public get isDateInRange(): boolean {
    if (this.minDate && isBefore(this.extensionDate, startOfDay(this.minDate))) {
      return false;
    }
    if (this.maxDate && isAfter(this.extensionDate, endOfDay(this.maxDate))) {
      return false;
    }
    return true;
  }

  /** True once the date field holds something that cannot be requested. */
  public get dateNeedsAttention(): boolean {
    return this.dateEntryInvalid || (this.dateChanged && !this.isDateInRange);
  }

  /**
   * The picked extension as it will be requested, e.g. "+1 week · Thu 17 Sep".
   * Requests are made in whole weeks, so the length is shown in weeks.
   */
  public get extensionSummary(): string {
    if (!this.dateChanged || this.dateNeedsAttention) {
      return '';
    }
    const weeks = this.extensionDuration;
    return `+${weeks} ${weeks === 1 ? 'week' : 'weeks'} · ${this.formatShortDate(this.extensionDate)}`;
  }

  public get canSubmit(): boolean {
    return (
      this.extensionData.valid && this.dateChanged && !this.dateNeedsAttention && !this.submitting
    );
  }

  public get isDirty(): boolean {
    return this.extensionData.dirty || this.dateChanged;
  }

  public canClose(): boolean {
    if (this.allowClose || !this.isDirty) {
      return true;
    }

    return globalThis.confirm('Discard this extension request? Your entered details will be lost.');
  }

  public requestClose(): void {
    this.dialogRef.close();
  }

  private scrollCommentsDown(): void {
    setTimeout(() => {
      const objDiv = document.querySelector<HTMLElement>('div.comments-body');
      if (!objDiv) {
        return;
      }
      objDiv.scrollTop = objDiv.scrollHeight;
    }, 50);
  }

  submitApplication(): void {
    if (this.submitting || this.extensionData.invalid) {
      this.extensionData.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.taskComments
      .requestExtension(
        this.extensionData.controls.extensionReason.value,
        this.extensionDuration,
        this.data.task,
      )
      .subscribe({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        next: ((tc: TaskComment) => {
          this.alerts.success('Extension requested.', 2000);
          this.scrollCommentsDown();
          if (typeof this.data.afterApplication === 'function') {
            this.data.afterApplication();
          }
          this.allowClose = true;
          this.dialogRef.close();
        }).bind(this),

        error: (() => {
          this.submitting = false;
          this.errorMessage = 'The extension request could not be sent. Please try again.';
          this.alerts.error(this.errorMessage, 4000);
        }).bind(this),
      });
  }
}
