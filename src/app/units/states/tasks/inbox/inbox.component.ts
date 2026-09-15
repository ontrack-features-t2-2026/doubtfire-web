import {HotkeysHelpComponent, HotkeysService} from '@ngneat/hotkeys';
import {BreakpointObserver} from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {Observable, Subject, takeUntil} from 'rxjs';
import {Tutorial} from 'src/app/api/models/doubtfire-model';
import {Task} from 'src/app/api/models/task';
import {TaskDefinition} from 'src/app/api/models/task-definition';
import {Unit} from 'src/app/api/models/unit';
import {UnitRole} from 'src/app/api/models/unit-role';
import {UserService} from 'src/app/api/services/user.service';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {SelectedTaskService} from 'src/app/projects/states/dashboard/selected-task.service';

interface InboxTaskData {
  source: (
    unit: Unit,
    taskDef?: TaskDefinition | number,
    fetchMyStudentsOnly?: boolean,
  ) => Observable<Task[]> | null;
  selectedTask: Task | null;
  taskKey: unknown;
  onSelectedTaskChange: (task: Task | null) => void;
  taskDefMode: boolean;
}

@Component({
  selector: 'f-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class InboxComponent implements OnInit, OnDestroy {
  @Input() unit: Unit;
  @Input() unitRole: UnitRole;
  @Input() taskData: InboxTaskData;
  @Input() loading = false;
  @Input() filters: Partial<{
    taskDefinition: TaskDefinition;
    tutorials: Tutorial[];
    forceStream: boolean;
    studentName: string;
    tutorialIdSelected: string | number;
    taskDefinitionIdSelected: number | TaskDefinition;
  }>;
  @Input() showSearchOptions: boolean;
  @ViewChild('inboxpanel', {read: ElementRef}) inboxPanel: ElementRef;

  @Input() viewType: 'inbox' | 'explorer' | 'moderation' | 'overflow';

  private readonly destroy$: Subject<void> = new Subject();
  private readonly commentsBreakpoint = '(max-width: 999.98px)';
  /** ng-flex-layout's `xs` breakpoint. */
  private readonly mobileBreakpoint = '(max-width: 599.98px)';

  // protected filters;
  // protected showSearchOptions;

  public taskSelected = false;
  public isCommentsNarrow = false;
  public commentsCollapsed = false;
  /** The panel shown full screen, and the one shown when the panels stack. */
  public fullscreenPanel: string | null = null;
  public activePanel: string | null = 'list';

  visiblePdfUrl: string;

  get narrowTaskInbox(): boolean {
    return this.inboxPanel?.nativeElement.getBoundingClientRect().width < 150;
  }

  get isMobileView(): boolean {
    return this.breakpointObserver.isMatched(this.mobileBreakpoint);
  }

  /** The narrowest each desktop panel goes; see the project dashboard for why. */
  public readonly panelMinWidths = {list: 280, task: 420, comments: 320} as const;

  /** Explorer, moderation and the inbox each remember their own panels. */
  get panelPage(): string {
    return `task-${this.viewType || 'inbox'}`;
  }

  get commentsPanelCollapsed(): boolean {
    return this.isCommentsNarrow && this.commentsCollapsed;
  }

  constructor(
    private hotkeys: HotkeysService,
    private selectedTask: SelectedTaskService,
    public fileDownloader: FileDownloaderService,
    private router: Router,
    public dialog: MatDialog,
    private userService: UserService,
    private constants: DoubtfireConstants,
    private breakpointObserver: BreakpointObserver,
  ) {
    this.selectedTask.currentPdfUrl$.subscribe((url) => {
      this.visiblePdfUrl = url;
    });

    this.selectedTask.selectedTask$.subscribe((task) => {
      this.taskSelected = task != null;
      this.activePanel = task ? 'task' : 'list';
      if (!task) {
        this.fullscreenPanel = null;
      }
    });
  }

  ngOnInit(): void {
    this.breakpointObserver
      .observe(this.commentsBreakpoint)
      .pipe(takeUntil(this.destroy$))
      .subscribe(({matches}) => {
        this.isCommentsNarrow = matches;
        this.commentsCollapsed = matches;
        window.dispatchEvent(new Event('resize'));
      });

    const registeredHotkeys = this.hotkeys.getHotkeys().map((hotkey) => hotkey.keys);

    if (!registeredHotkeys.includes('shift.?')) {
      this.hotkeys.registerHelpModal(() => {
        const ref = this.dialog.open(HotkeysHelpComponent, {
          // width: '250px',
        });
        ref.componentInstance.title = `${this.constants.ExternalName.value} Feedback Shortcuts`;
        ref.componentInstance.dismiss.subscribe(() => ref.close());
      });
    }

    if (!registeredHotkeys.includes('control.shift.f')) {
      this.hotkeys
        .addShortcut({
          keys: 'control.shift.f',
          description: 'Mark selected task as fix',
        })
        .subscribe(() => this.selectedTask.selectedTask?.updateTaskStatus('fix_and_resubmit'));
    }

    if (!registeredHotkeys.includes('control.shift.c')) {
      this.hotkeys
        .addShortcut({
          keys: 'control.Shift.c',
          description: 'Mark selected task as complete',
        })
        .subscribe(() => {
          const task = this.selectedTask.selectedTask;
          if (!task) {
            return;
          }

          if (!task.canMarkComplete) {
            return;
          }

          task.updateTaskStatus('complete');
        });
    }

    if (!registeredHotkeys.includes('control.shift.d')) {
      this.hotkeys
        .addShortcut({
          keys: 'control.shift.d',
          description: 'Mark selected task as discuss',
        })
        .subscribe(() => {
          const task = this.selectedTask.selectedTask;
          task?.updateTaskStatus(task.status === 'discuss' ? 'rediscuss' : 'discuss');
        });
    }

    window.dispatchEvent(new Event('resize'));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.hotkeys.removeShortcuts('control.shift.d');
    this.hotkeys.removeShortcuts('control.shift.f');
    this.hotkeys.removeShortcuts('control.shift.c');
    this.hotkeys.removeShortcuts('shift.?');
  }

  public toggleCommentsPanel(): void {
    this.commentsCollapsed = !this.commentsCollapsed;
    window.dispatchEvent(new Event('resize'));
  }

  goToStudent(): void {
    // this.router.navigateByUrl('projects/dashboard', {
    //   projectId: this.taskData.selectedTask.project.id,
    //   tutor: true,
    //   taskAbbr: '',
    // });
    this.router.navigate(['/projects', this.taskData.selectedTask.project.id, 'dashboard']);
  }

  openPdfInNewTab(): void {
    if (!this.visiblePdfUrl || !this.taskData?.selectedTask) {
      return;
    }

    const task = this.taskData.selectedTask;
    const taskSheetUrl = task.definition.getTaskPDFUrl();
    const fileName =
      this.visiblePdfUrl === taskSheetUrl
        ? `${task.definition.abbreviation}-task-sheet.pdf`
        : `${task.definition.abbreviation}.pdf`;

    this.fileDownloader.downloadFile(this.visiblePdfUrl, fileName);
  }
}
