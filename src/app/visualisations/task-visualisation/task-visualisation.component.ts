import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {Project, TaskStatus, TaskStatusEnum} from 'src/app/api/models/doubtfire-model';

interface TaskStatusSummary {
  status: TaskStatusEnum;
  name: string;
  value: number;
  color: string;
  textColor: string;
}

@Component({
  selector: 'f-task-visualisation',
  templateUrl: './task-visualisation.component.html',
  styleUrls: ['./task-visualisation.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class TaskVisualisationComponent implements OnChanges, OnInit {
  @Input() project: Project;
  @Input() grade: number;

  data: TaskStatusSummary[] = [];

  ngOnInit(): void {
    this.updateData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const projectChanged = 'project' in changes && !changes.project.firstChange;
    const gradeChanged = 'grade' in changes && changes.grade.currentValue !== undefined;

    if (projectChanged || gradeChanged) {
      this.updateData();
    }
  }

  updateData(): void {
    if (this.project) {
      const taskCounts = new Map(TaskStatus.STATUS_KEYS.map((status) => [status, 0]));
      const activeTasks = this.project.activeTasks();
      activeTasks.forEach((task) => {
        if (task.status) {
          taskCounts.set(task.status, (taskCounts.get(task.status) || 0) + 1);
        }
      });

      const sortOrder: TaskStatusEnum[] = [
        'complete',
        'discuss',
        'ready_for_feedback',
        'working_on_it',
        'not_started',
      ];

      this.data = Array.from(taskCounts)
        .map(([status, count]) => {
          // Inline [style] bindings accept CSS vars, so point the card straight at
          // the status tokens and its AA-fixed -on foreground; both flip on their own.
          const key = status.replace(/_/g, '-');
          return {
            status,
            name: TaskStatus.STATUS_LABELS.get(status) ?? status,
            value: count,
            color: `var(--ot-status-${key})`,
            textColor: `var(--ot-status-${key}-on)`,
          };
        })
        .filter((task) => task.value > 0 || sortOrder.includes(task.status))
        .sort((a, b) => {
          let aIndex = sortOrder.indexOf(a.status);
          let bIndex = sortOrder.indexOf(b.status);

          aIndex = aIndex === -1 ? sortOrder.length : aIndex;
          bIndex = bIndex === -1 ? sortOrder.length : bIndex;

          return aIndex - bIndex;
        });
    }
  }
}
