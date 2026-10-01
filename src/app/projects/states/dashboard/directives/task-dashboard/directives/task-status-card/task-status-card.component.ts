import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';
import {Project} from 'src/app/api/models/project';
import {Task} from 'src/app/api/models/task';
import {TaskStatusEnum, TaskStatusUiData} from 'src/app/api/models/task-status';
import {UnitRole} from 'src/app/api/models/unit-role';
import {TaskService} from 'src/app/api/services/task.service';
import {UserService} from 'src/app/api/services/user.service';
import {ExtensionModalService} from 'src/app/common/modals/extension-modal/extension-modal.service';
import {QrModalService} from 'src/app/common/modals/qr-modal/qr-modal.service';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {FeedbackAppealModalService} from 'src/app/tasks/modals/feedback-appeal-modal/feedback-appeal-modal.service';
import {SubmissionTypeModalService} from 'src/app/tasks/modals/submission-type-modal/submission-type-modal.service';

@Component({
  selector: 'f-task-status-card',
  templateUrl: './task-status-card.component.html',
  styleUrls: ['./task-status-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class TaskStatusCardComponent implements OnChanges, OnDestroy {
  triggers: TaskStatusUiData[];
  private taskStatusSub: Subscription;

  constructor(
    private extensions: ExtensionModalService,
    private taskService: TaskService,
    private route: ActivatedRoute,
    private qrModalService: QrModalService,
    private doubtfireConstants: DoubtfireConstants,
    private submissionTypeModalService: SubmissionTypeModalService,
    private userService: UserService,
    private feedbackAppealService: FeedbackAppealModalService,
  ) {
    this.taskStatusSub = this.taskService.taskStatusUpdated$.subscribe((task) => {
      if (this.isCurrentTask(task)) {
        this.reapplyTriggers();
      }
    });
  }

  @Input() task: Task;
  @Input() compact = false;

  /** Choose the next step without introducing a second submission or extension policy. */
  get primaryAction(): 'messages' | 'discussion' | 'help' | 'extension' | 'submit' | null {
    if (!this.task) {
      return null;
    }
    if (this.task.numNewComments > 0) {
      return 'messages';
    }
    if (!this.isTutor && this.task.blockedByPrerequisiteTasks()) {
      return null;
    }
    if (this.submissionActionPending || this.task.submissionProcessingActive) {
      return null;
    }
    if (this.task.inAwaitingFeedbackState()) {
      return null;
    }
    if (this.task.status === 'time_exceeded' && this.task.canApplyForExtension()) {
      return 'extension';
    }
    if (this.task.inFinalState()) {
      return null;
    }
    if (this.task.status === 'need_help') {
      return 'help';
    }
    if (this.task.inDiscussState()) {
      return 'discussion';
    }
    if (this.task.isPastDueDate() && this.task.canApplyForExtension()) {
      return 'extension';
    }
    return this.showUploadSubmission && !this.isSubmittedForPortfolio() ? 'submit' : null;
  }

  get primaryLabel(): string {
    switch (this.primaryAction) {
      case 'messages':
        return 'Read messages';
      case 'discussion':
        return 'Arrange discussion';
      case 'help':
        return 'View help conversation';
      case 'extension':
        return 'Request extension';
      case 'submit':
        return ['redo', 'fix_and_resubmit'].includes(this.task.status)
          ? 'Submit revision'
          : 'Submit task';
      default:
        return '';
    }
  }

  get nextStepMessage(): string {
    if (!this.task) {
      return '';
    }
    if (this.task.numNewComments > 0) {
      return 'Read your unread messages before deciding what to do next.';
    }
    if (!this.isTutor && this.task.blockedByPrerequisiteTasks()) {
      return 'Complete the prerequisites listed below before submitting this task.';
    }
    if (this.submissionActionPending || this.task.submissionProcessingActive) {
      return 'Your upload is being prepared. You can leave this page and return later.';
    }
    if (this.task.inAwaitingFeedbackState()) {
      return 'Your work is with your tutor. Wait for feedback before submitting again.';
    }
    if (this.task.status === 'need_help') {
      return 'Your help request is with your tutor. Open the conversation to add a question or check a reply.';
    }
    if (this.task.inDiscussState()) {
      return 'Check the feedback and arrange the discussion or demonstration your tutor has requested.';
    }
    if (this.primaryAction === 'extension') {
      return 'Your due date has passed. You can request an extension under this unit’s rules.';
    }
    if (this.task.inFinalState()) {
      return this.task.statusHelp()?.action ?? '';
    }
    if (['redo', 'fix_and_resubmit'].includes(this.task.status)) {
      return 'Use your tutor’s feedback to revise your work, then submit it again.';
    }
    return 'Check the task requirements and submit when your work is ready.';
  }

  get nextStepDate(): Date | undefined {
    return this.task?.effectiveDeadlineDate ?? this.task?.localDueDate();
  }

  get feedbackCutoff(): Date | undefined {
    return this.task?.localDeadlineDate();
  }

  performPrimaryAction(): void {
    // Re-evaluate when clicked, since a task can change while the card is open.
    if (this.primaryAction === 'extension') {
      this.applyForExtension();
    } else if (this.primaryAction === 'submit') {
      this.uploadSubmission();
    }
  }

  private project?: Project;

  // Derived so the card's status-colour wrap (--tsc bindings) tracks live status
  // transitions, which mutate the existing task rather than replacing the input.
  get taskStatusColor(): string {
    return this.task?.statusClass?.();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.task) {
      this.task = changes.task.currentValue;
      this.reapplyTriggers();
      this.project = this.task.project;
    }
  }

  ngOnDestroy(): void {
    this.taskStatusSub?.unsubscribe();
  }

  private isCurrentTask(task: Task): boolean {
    return (
      task &&
      this.task &&
      task.project?.id === this.task.project?.id &&
      task.definition?.id === this.task.definition?.id
    );
  }

  reapplyTriggers(): void {
    // if tutor is in queryParam
    if (this.isTutor) {
      this.triggers = this.taskService.statusKeys
        .map((k) => this.taskService.statusData(k))
        .filter((trigger) => {
          if (trigger.status !== 'complete') {
            return true;
          }

          return this.task.canMarkComplete || this.task.status === 'complete';
        });
    } else {
      const studentTriggers = (this.taskService.switchableStates.student as TaskStatusEnum[]).map(
        (k) => this.taskService.statusData(k),
      );
      const filteredStudentTriggers = this.task.filterFutureStates(studentTriggers);
      this.triggers = filteredStudentTriggers;
      // Ensure the current task's status is in the list
      if (!this.triggers.find((t) => t.status === this.task.status)) {
        this.triggers.push(this.taskService.statusData(this.task.status));
      }
    }
  }

  public isReadyForFeedback(): boolean {
    return this.task.status === 'ready_for_feedback';
  }

  public isSubmittedForPortfolio(): boolean {
    return this.task.status === 'assess_in_portfolio';
  }

  // The action follows the current status, not submission history. A task
  // returned for Redo or Resubmit has history but must go back through Ready
  // for Feedback, which asks for group contributions. The upload modal only
  // offers New Evidence while the task is in a submitted state.
  public get showUploadSubmission(): boolean {
    return !!this.task && !this.task.inSubmittedState();
  }

  public get showUploadNewFiles(): boolean {
    return !!this.task?.inSubmittedState() && this.task.requiresFileUpload();
  }

  public get submissionActionPending(): boolean {
    return !!(this.task?.processingPdf || this.task?.loadingSubmissionDetails);
  }

  triggerTransition(trigger: TaskStatusEnum): void {
    if (trigger === 'complete' && !this.task.canMarkComplete) {
      return;
    }

    if (trigger === 'ready_for_feedback') {
      this.uploadSubmission();
    } else {
      this.task.triggerTransition(trigger);
    }
  }

  uploadSubmission(): void {
    if (this.task.definition.assessInPortfolioOnly) {
      this.submissionTypeModalService.show(this.task);
    } else {
      this.task.triggerTransition('ready_for_feedback');
    }
  }

  updateFilesInSubmission(): void {
    this.task.presentTaskSubmissionModal(this.task.status, true);
  }

  openDiscussionQrCode(): void {
    const hostName = this.doubtfireConstants.HOST_URL;
    const url = `${hostName}/tutor-discussion?unitId=${this.task.unit.id}&username=${this.userService.currentUser.username}`;
    this.qrModalService.show(
      url,
      'Display this QR code during your class so your tutor can scan it to view your submissions and mark your tasks as complete.',
    );
  }

  applyForExtension(): void {
    this.extensions.show(this.task, () => {
      this.task.refresh();
    });
  }

  openFeedbackAppealModal(): void {
    this.feedbackAppealService.show(this.task);
  }

  public get currentUnitRole(): UnitRole | undefined {
    const currentUser = this.userService.currentUser;
    return this.project?.unit?.staff?.find((ur) => ur.user.id === currentUser.id);
  }

  public get isTutor(): boolean {
    return (
      this.currentUnitRole?.role === 'Convenor' ||
      this.currentUnitRole?.role === 'Tutor' ||
      this.userService.currentUser.systemRole === 'Admin'
    );
  }
}
