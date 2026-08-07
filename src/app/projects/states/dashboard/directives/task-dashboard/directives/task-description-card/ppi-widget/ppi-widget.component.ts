import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { Task } from 'src/app/api/models/task';
import { TaskDefinition } from 'src/app/api/models/task-definition';
import { PeerProgressIndicatorService } from 'src/app/api/services/peer-progress-indicator.service';
import {
  resolvePeerProgressState,
  PeerProgressViewModel,
} from 'src/app/api/models/peer-progress-indicator-state';

// f-ppi-widget: renders the peer progress indicator for a task, with state handling per PPI-F03.
@Component({
  selector: 'f-ppi-widget',
  templateUrl: './ppi-widget.component.html',
  styleUrls: ['./ppi-widget.component.scss'],
  standalone: false,
})
export class PpiWidgetComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) task: Task;
  @Input({ required: true }) taskDef: TaskDefinition;

  view: PeerProgressViewModel = { state: 'loading', data: null, message: null };

  private activeRequest?: Subscription;

  constructor(
    private ppiService: PeerProgressIndicatorService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.task || changes.taskDef) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this.activeRequest?.unsubscribe();
  }

  retry(): void {
    this.load();
  }

  private setView(next: PeerProgressViewModel): void {
    this.view = next;
    this.cdr.markForCheck();
  }

  private load(): void {
    if (!this.task?.project || !this.taskDef) {
      return;
    }

    // Cancel the previous request first -- otherwise a late response could overwrite our new loading state with old data.
    this.activeRequest?.unsubscribe();
    this.setView(resolvePeerProgressState(true, null, null));

    const { unit, targetGrade } = this.task.project;

    this.activeRequest = this.ppiService
      .getIndicator(this.taskDef.id, unit.id, targetGrade, 'normal')
      .subscribe({
        next: (data) => this.setView(resolvePeerProgressState(false, null, data)),
        error: (err) => this.setView(resolvePeerProgressState(false, err, null)),
      });
  }
}