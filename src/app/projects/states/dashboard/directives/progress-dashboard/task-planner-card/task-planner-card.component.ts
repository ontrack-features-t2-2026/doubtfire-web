import {ChangeDetectionStrategy, Component, Inject, Input} from '@angular/core';
import {Project} from 'src/app/api/models/project';
import {buildIcsCalendar} from 'src/app/api/services/ics-calendar-builder';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';

@Component({
  selector: 'f-task-planner-card',
  templateUrl: './task-planner-card.component.html',
  styleUrl: './task-planner-card.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class TaskPlannerCardComponent {
  @Input() project: Project;
  public get unit() {
    return this.project?.unit;
  }

  constructor(@Inject(FileDownloaderService) private fileDownloader: FileDownloaderService) {}

  /**
   * The dashboard route resolves progressively (project.resolver.ts), so project.tasks can
   * still be empty on first render. Gates the button so it cannot be clicked before tasks
   * have loaded, rather than producing a technically-valid but empty .ics file.
   */
  public get hasDownloadableTasks(): boolean {
    return !!this.project && this.project.activeTasks().length > 0;
  }

  public downloadIcs(): void {
    if (!this.hasDownloadableTasks) {
      return;
    }

    const ics = buildIcsCalendar(this.project.activeTasks());
    const blob = new Blob([ics], {type: 'text/calendar;charset=utf-8'});
    const url = window.URL.createObjectURL(blob);
    const filename = `${this.project.unit.code}-tasks.ics`;

    this.fileDownloader.downloadBlobToFile(url, filename);
    this.fileDownloader.releaseBlob(url);
  }
}
