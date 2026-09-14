import {ChangeDetectionStrategy, Component, Inject, Input} from '@angular/core';
import {Project} from 'src/app/api/models/project';
import {Task} from 'src/app/api/models/task';
import {buildIcsCalendar} from 'src/app/api/services/ics-calendar-builder';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {GradeService} from 'src/app/common/services/grade.service';

@Component({
  selector: 'f-task-planner-card',
  templateUrl: './task-planner-card.component.html',
  styleUrl: './task-planner-card.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class TaskPlannerCardComponent {
  @Input() project: Project;

  /**
   * The tips speak to the student ("your target grade"), so the dashboard turns them off
   * when staff are looking at someone else's project.
   */
  @Input() showTips = true;

  constructor(
    @Inject(FileDownloaderService) private fileDownloader: FileDownloaderService,
    private gradeService: GradeService,
  ) {}

  public get unit() {
    return this.project?.unit;
  }

  public get gradeValues(): number[] {
    return [...this.gradeService.gradeValuesFor(this.unit)].sort((a, b) => a - b);
  }

  public gradeLabel(grade: number): string {
    return this.gradeService.gradeLabel(grade, this.unit);
  }

  public get lowestGradeLabel(): string {
    const [lowest] = this.gradeValues;
    return lowest === undefined ? '' : this.gradeLabel(lowest);
  }

  /**
   * Read live from the project on every render, so the menu follows a target grade the
   * student has just changed on the dashboard instead of the value it had on first load.
   */
  public get hasTargetGrade(): boolean {
    const target = this.project?.targetGrade;
    return target !== undefined && target !== null && this.gradeValues.includes(target);
  }

  /** Every grade except the target, lowest first. The target is listed on its own above. */
  public get otherGrades(): number[] {
    return this.gradeValues.filter(
      (grade) => !this.hasTargetGrade || grade !== this.project.targetGrade,
    );
  }

  /**
   * The dashboard route resolves progressively (project.resolver.ts), so project.tasks can
   * still be empty on first render. Gates the menu so it cannot be opened before tasks have
   * loaded, rather than offering a technically-valid but empty .ics file.
   */
  public get hasAnyTasks(): boolean {
    return !!this.project && this.project.tasks.length > 0;
  }

  public hasTasksFor(grade: number): boolean {
    return !!this.project && this.tasksUpTo(grade).length > 0;
  }

  /**
   * The chosen grade is local to this download. It is never written back through
   * projectService.update or to project.targetGrade, so downloading another grade's
   * calendar cannot change the student's saved target.
   */
  public downloadIcs(grade: number): void {
    if (!this.hasTasksFor(grade)) {
      return;
    }

    const ics = buildIcsCalendar(this.tasksUpTo(grade));
    const blob = new Blob([ics], {type: 'text/calendar;charset=utf-8'});
    const url = window.URL.createObjectURL(blob);
    const filename = `${this.project.unit.code}-tasks-${this.unit.gradeAbbreviation(grade)}.ics`;

    this.fileDownloader.downloadBlobToFile(url, filename);
    this.fileDownloader.releaseBlob(url);
  }

  /** A grade needs its own tasks and every task from the grades below it. */
  private tasksUpTo(grade: number): Task[] {
    return this.project.tasks.filter((task) => task.definition.targetGrade <= grade);
  }
}
