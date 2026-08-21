import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  Input,
  Output,
} from '@angular/core';
import {Task, TaskDefinition, Unit} from 'src/app/api/models/doubtfire-model';
import {CalendarEvent, buildCalendarEvent} from 'src/app/api/services/calendar-event-builder';
import {MappingFunctions} from 'src/app/api/services/mapping-fn';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {GradeService} from 'src/app/common/services/grade.service';

function formatGoogleCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Builds a Google Calendar "add event" link from a calendar event snapshot. The dates
 * range end is exclusive, one day after the event's date, since that is what Google's
 * all-day date range expects. This is a different convention to webcal.rb's ICS output,
 * which sets DTEND == DTSTART for the same single day, see calendar-event-builder.ts for
 * why those two conventions cannot share one date pair. formatGoogleCalendarDate is
 * calibrated for this URL only, CAL-F02's ICS output must not reuse it.
 */
function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const start = formatGoogleCalendarDate(event.date);
  const end = formatGoogleCalendarDate(MappingFunctions.addDays(event.date, 1));

  const params = [
    ['action', 'TEMPLATE'],
    ['text', event.title],
    ['dates', `${start}/${end}`],
  ]
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  return `https://calendar.google.com/calendar/render?${params}`;
}

@Component({
  selector: 'f-task-description-card',
  templateUrl: 'task-description-card.component.html',
  styleUrls: ['task-description-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class TaskDescriptionCardComponent {
  @Output() switchView$: EventEmitter<string> = new EventEmitter();

  @Input() task: Task;
  @Input() taskDef: TaskDefinition;
  @Input() unit: Unit;

  public grades: {
    names: GradeService['grades'];
    acronyms: GradeService['gradeAcronyms'];
  };

  constructor(
    private GradeService: GradeService,
    @Inject(FileDownloaderService) private fileDownloader: FileDownloaderService,
  ) {
    this.grades = {
      names: GradeService.grades,
      acronyms: GradeService.gradeAcronyms,
    };
  }

  public downloadTaskSheet() {
    this.fileDownloader.downloadFile(
      this.taskDef.getTaskPDFUrl(true),
      `${this.unit.code}-${this.taskDef.abbreviation}-TaskSheet.pdf`,
    );
  }

  public viewTaskSheet() {
    this.switchView$.emit('task');
  }

  public downloadResources() {
    this.fileDownloader.downloadFile(
      this.taskDef.getTaskResourcesUrl(true),
      `${this.unit.code}-${this.taskDef.abbreviation}-TaskResources.zip`,
    );
  }

  public dueDate(): Date {
    if (this.task) {
      return this.task.localDueDate();
    } else if (this.taskDef) {
      return this.taskDef.targetDate;
    } else {
      return undefined;
    }
  }

  public startDate(): Date {
    return this.task?.startDate ?? this.taskDef?.startDate;
  }

  public feedbackDate(): Date {
    if (this.task) {
      return this.task.localDeadlineDate();
    }
    return this.taskDef?.localDeadlineDate();
  }

  public shouldShowDeadline(): boolean {
    return this.task && this.task.daysUntilDeadlineDate() <= 14;
  }

  /**
   * Google Calendar's TEMPLATE link has no identifier parameter, so this always opens a
   * fresh "add event" dialog rather than updating an existing calendar entry. The date is
   * a snapshot of the due date at click time and will not track later changes. That is
   * inherent to this mechanism, not a defect.
   */
  public googleCalendarUrl(): string | null {
    if (!this.task) {
      return null;
    }

    const event = buildCalendarEvent(this.task);
    return event ? buildGoogleCalendarUrl(event) : null;
  }
}
