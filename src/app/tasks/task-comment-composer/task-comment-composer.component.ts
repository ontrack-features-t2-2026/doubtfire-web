import {EmojiSearch} from '@ctrl/ngx-emoji-mart';
import {EmojiData} from '@ctrl/ngx-emoji-mart/ngx-emoji';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef,
  HostListener,
  Inject,
  Input,
  KeyValueDiffer,
  KeyValueDiffers,
  OnChanges,
  OnDestroy,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {NavigationStart, Router} from '@angular/router';
import {Subscription, filter} from 'rxjs';
import {
  FeedbackTemplate,
  Task,
  TaskComment,
  TaskCommentService,
} from 'src/app/api/models/doubtfire-model';
import {UserService} from 'src/app/api/models/doubtfire-model';
import {AlertService} from 'src/app/common/services/alert.service';
import {EmojiService} from 'src/app/common/services/emoji.service';
import {
  FeedbackDraftContext,
  FeedbackDraftStore,
  StagedFeedbackAttachment,
} from 'src/app/common/services/feedback-draft-store.service';
import {TaskCommentsViewerComponent} from '../task-comments-viewer/task-comments-viewer.component';

interface ApiError {
  error?: string | {error?: string; message?: string};
  message?: string;
  status?: number;
}

/**
 * The task comment viewer needs to share data with the Task Comment Composer. The data needed
 * id defined through this interface.
 */

export interface TaskCommentComposerData {
  [key: string]: TaskComment;
  originalComment: TaskComment;
  editingComment: TaskComment;
}

const ACCEPTED_FILE_TYPES = [
  'audio/mpeg',
  'audio/vorbis',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'image/png',
  'image/pdf',
  'application/pdf',
  'image/gif',
  'image/jpg',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_ATTACHMENT_BYTES = 30_000_000;

/**
 * The task comment composer is responsible for creating and adding comments to a given task.
 */
@Component({
  selector: 'task-comment-composer',
  templateUrl: './task-comment-composer.component.html',
  styleUrls: ['./task-comment-composer.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class TaskCommentComposerComponent implements AfterViewInit, DoCheck, OnChanges, OnDestroy {
  @Input() task: Task;
  @Input() sharedData: TaskCommentComposerData;

  private readonly SUBMITTED_KEY_PREFIX = 'task_comments_submitted_';
  private readonly TEXTAREA_MAX_HEIGHT_PX = 144;
  private readonly routeSubscription: Subscription;
  private draftLoadGeneration = 0;
  private readonly draftLoadTimers: Set<ReturnType<typeof setTimeout>> = new Set();
  public isDraftLoaded = false;
  private submittedTaskIds: Set<number | string> = new Set();

  public isSending: boolean = false;
  public stagedAttachments: StagedFeedbackAttachment[] = [];
  private draftClientRequestId: string | null = null;
  private draftReplyToId: number | null = null;
  private draftBeforeEdit: string = '';

  comment = {
    text: '',
    type: 'text',
  };

  @ViewChildren('commentInput') input: QueryList<ElementRef<HTMLTextAreaElement>>;
  @ViewChild('uploader') uploader: ElementRef;
  @ViewChild('emojiPickerHost') emojiPickerHost?: ElementRef<HTMLElement>;
  @ViewChild('emojiPickerButton') emojiPickerButton?: ElementRef<HTMLButtonElement>;

  differ: KeyValueDiffer<string, TaskComment>;
  showEmojiPicker = false;
  emojiSearchMode = false;
  // eslint-disable-next-line no-useless-escape
  emojiRegex: RegExp = /(?:\:)(.*?)(?=\:|$)/;
  emojiSearchResults: EmojiData[] = [];
  emojiMatch: string;
  showFeedbackTemplatePicker: boolean = false;
  recording = false;

  constructor(
    private differs: KeyValueDiffers,
    public dialog: MatDialog,
    private emojiSearch: EmojiSearch,
    private emojiService: EmojiService,
    private commentsViewer: TaskCommentsViewerComponent,
    private alerts: AlertService,
    @Inject(TaskCommentService) private taskCommentService: TaskCommentService,
    private cdRef: ChangeDetectorRef,
    private userService: UserService,
    private router: Router,
    private draftStore: FeedbackDraftStore,
  ) {
    this.differ = this.differs.find({}).create();
    // submitted tasks from sessionStorage, for this user only
    try {
      const key = this.submittedKey();
      const saved = key ? sessionStorage.getItem(key) : null;
      if (saved) {
        this.submittedTaskIds = new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading submitted tasks:', e);
    }

    this.routeSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => this.dismissEmojiPicker());
  }

  ngOnChanges(changes: SimpleChanges) {
    this.showFeedbackTemplatePicker = false;
    this.dismissEmojiPicker();

    if (changes.task && changes.task.currentValue !== changes.task.previousValue) {
      const newTask = changes.task.currentValue as Task;
      const previousTask = changes.task.previousValue as Task;
      if (previousTask) {
        this.saveDraftForTask(
          previousTask,
          this.currentInputText,
          this.sharedData?.originalComment?.id ?? this.draftReplyToId,
        );
      }
      this.cancelDraftLoadTimers();
      this.draftLoadGeneration += 1;

      this.cancelEdit();
      this.sharedData.originalComment = null;
      this.stagedAttachments = [];
      this.draftClientRequestId = null;
      this.draftReplyToId = null;
      this.clearInput();

      if (newTask) {
        this.loadDraftForTask(newTask);
      }
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.task?.id) {
        this.loadDraftForTask(this.task);
      }
      this.resizeMessageField();
    }, 100);
  }

  ngOnDestroy(): void {
    this.saveCurrentDraft();
    this.cancelDraftLoadTimers();
    this.draftLoadGeneration += 1;
    this.routeSubscription.unsubscribe();
    this.dismissEmojiPicker();
  }

  // Update onInputChange to reset submitted status
  onInputChange(event: Event) {
    if (this.isEditing) {
      this.resizeMessageField();
      this.keyTyped();
      return;
    }

    const target = event.target as HTMLTextAreaElement;
    const text = target.value;

    // If user is typing something new after submission, reset the submitted status
    if (this.task) {
      const taskKey =
        this.task.id ||
        `${this.task.projectId || this.task.project?.id}_${this.task.definition?.id}`;

      // If this was a previously submitted task and user is typing again,
      // remove from submitted set
      if (this.submittedTaskIds.has(taskKey) && text.trim()) {
        this.submittedTaskIds.delete(taskKey);

        // Update session storage
        try {
          const submittedKey = this.submittedKey();
          if (submittedKey) {
            sessionStorage.setItem(submittedKey, JSON.stringify([...this.submittedTaskIds]));
          }
        } catch (e) {
          console.error('Error saving submitted tasks:', e);
        }
      }
    }

    this.saveCurrentDraft();
    this.resizeMessageField();
    this.keyTyped();
  }

  // The id of whoever is signed in, or null during sign out when currentUser has
  // already been swapped for the anonymous user. A draft with nobody to own it is
  // not worth keeping, so callers return early on null rather than inventing a
  // key. The id and not the username or the email: ids are stable, and an email
  // in a storage key is personal data sitting in plain sight in dev tools.
  private currentUserId(): number | null {
    const id = this.userService?.currentUser?.id;
    return typeof id === 'number' && id > 0 ? id : null;
  }

  private submittedKey(): string | null {
    const userId = this.currentUserId();
    return userId === null ? null : `${this.SUBMITTED_KEY_PREFIX}${userId}`;
  }

  private draftContext(task: Task): FeedbackDraftContext | null {
    const userId = this.currentUserId();
    if (userId === null || !task) {
      return null;
    }

    const projectId = task.projectId || task.project?.id || 0;
    const taskDefinitionId = task.definition?.id || 0;
    if (!task.id && (!projectId || !taskDefinitionId)) {
      return null;
    }

    return {
      userId,
      unitId: task.unit?.id ?? null,
      projectId,
      taskDefinitionId,
      taskId: task.id ?? null,
      conversation: 'task-feedback',
    };
  }

  private getDraftKey(task: Task): string | null {
    const context = this.draftContext(task);
    return context ? this.draftStore.key(context) : null;
  }

  private hasContent(raw: string): boolean {
    return raw.replace(/\s+/g, '').length > 0;
  }

  // Update saveDraftForTask to use the taskDraftContents map
  private saveDraftForTask(
    task: Task,
    _rawFromDom?: string,
    replyToId: number | null = this.originalComment?.id ?? this.draftReplyToId,
  ): void {
    if (!task) {
      return;
    }

    const context = this.draftContext(task);
    if (context === null) {
      return;
    }

    try {
      let raw: string;
      if (this.task?.id === task.id && this.input?.first) {
        raw = _rawFromDom ?? this.input.first.nativeElement.value;
      } else {
        raw = _rawFromDom ?? '';
      }

      this.draftStore.save(context, raw, replyToId, this.draftClientRequestId);
    } catch (error) {
      console.error('saveDraftForTask error:', error);
    }
  }

  private loadDraftForTask(task: Task) {
    if (!task) {
      return;
    }

    const context = this.draftContext(task);
    if (context === null) {
      return;
    }

    try {
      const generation = ++this.draftLoadGeneration;
      const draft = this.draftStore.load(context);
      this.stagedAttachments = this.draftStore.attachments(context);
      this.draftClientRequestId = draft.clientRequestId;
      this.draftReplyToId = draft.replyToId;

      if (!draft.text && draft.replyToId === null && this.stagedAttachments.length === 0) {
        return;
      }

      const maxRetries = 5;
      const retryWithTimeout = (attempt = 0) => {
        if (
          generation !== this.draftLoadGeneration ||
          this.getDraftKey(this.task) !== this.draftStore.key(context)
        ) {
          return;
        }
        if (!this.input || !this.input.first || !this.input.first.nativeElement) {
          if (attempt < maxRetries) {
            const timer = setTimeout(() => {
              this.draftLoadTimers.delete(timer);
              retryWithTimeout(attempt + 1);
            }, 200);
            this.draftLoadTimers.add(timer);
            return;
          } else {
            return;
          }
        }

        this.input.first.nativeElement.value = draft.text;
        if (draft.replyToId !== null) {
          this.sharedData.originalComment =
            task.comments?.find((comment) => comment.id === draft.replyToId) ?? null;
        }
        this.resizeMessageField();
        this.isDraftLoaded = true;
        this.cdRef.detectChanges();

        const timer = setTimeout(() => {
          this.draftLoadTimers.delete(timer);
          if (generation !== this.draftLoadGeneration) {
            return;
          }
          this.isDraftLoaded = false;
          this.cdRef.detectChanges();
        }, 1500);
        this.draftLoadTimers.add(timer);
      };

      retryWithTimeout();
    } catch (error) {
      console.error(error);
    }
  }

  private cancelDraftLoadTimers(): void {
    this.draftLoadTimers.forEach((timer) => clearTimeout(timer));
    this.draftLoadTimers.clear();
  }

  private clearInput() {
    if (this.input?.first?.nativeElement) {
      this.input.first.nativeElement.value = '';
      this.resizeMessageField();
      this.cdRef.detectChanges();
    }
  }

  private saveCurrentDraft() {
    if (!this.task) {
      return;
    }
    this.saveDraftForTask(this.task);
  }

  ngDoCheck() {
    if (this.draftReplyToId !== null && this.originalComment == null) {
      this.sharedData.originalComment =
        this.task?.comments?.find((comment) => comment.id === this.draftReplyToId) ?? null;
    }
    // Check to see if the sharedData has changed
    const change = this.differ.diff(this.sharedData);
    if (change) {
      change.forEachChangedItem((item) => {
        // If it has changed to be an actual comment
        if (item != null) {
          this.syncComposerState();
        }
      });
    }
  }

  get originalComment(): TaskComment {
    return this.sharedData.originalComment;
  }

  get editingComment(): TaskComment {
    return this.sharedData.editingComment;
  }

  get isEditing(): boolean {
    return this.editingComment != null;
  }

  get isStaff() {
    return this.task?.unit?.currentUserIsStaff;
  }

  private get currentInputText(): string {
    return this.input?.first?.nativeElement?.value ?? '';
  }

  cancelReply() {
    this.sharedData.originalComment = null;
    this.draftReplyToId = null;
    this.saveCurrentDraft();
  }

  cancelEdit() {
    this.sharedData.editingComment = null;
    this.restoreDraftAfterEdit();
  }

  formatImageName(imageName) {
    const index = imageName.indexOf('.');
    let nameString = imageName.substring(0, index);
    const typeString = imageName.substring(index);

    if (nameString.length > 20) {
      nameString = nameString.substring(0, 20) + '..';
    }

    const finalString = nameString + typeString;
    return finalString;
  }

  recordingMode(): void {
    this.recording = !this.recording;
    this.dismissEmojiPicker();
  }

  get canSendMessage(): boolean {
    return (
      !this.isSending &&
      (this.currentInputText.trim().length > 0 || this.stagedAttachments.length > 0)
    );
  }

  get hasDiscardableDraft(): boolean {
    return (
      !this.isEditing &&
      (this.hasContent(this.currentInputText) ||
        this.originalComment != null ||
        this.stagedAttachments.length > 0)
    );
  }

  send(e?: Event) {
    e?.preventDefault();
    if (!this.canSendMessage) {
      return;
    }

    if (this.isEditing) {
      this.saveEditedComment();
    } else {
      this.addComment();
    }
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  dismissEmojiPicker(restoreTriggerFocus: boolean = false): void {
    if (!this.showEmojiPicker) {
      return;
    }

    this.showEmojiPicker = false;
    if (restoreTriggerFocus) {
      setTimeout(() => this.emojiPickerButton?.nativeElement.focus());
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: Event): void {
    this.dismissEmojiPickerFromOutside(event);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.dismissEmojiPickerFromOutside(event);
  }

  private dismissEmojiPickerFromOutside(event: Event): void {
    if (!this.showEmojiPicker) {
      return;
    }

    const target = event.target as Node | null;
    if (
      target &&
      (this.emojiPickerHost?.nativeElement?.contains(target) ||
        this.emojiPickerButton?.nativeElement?.contains(target))
    ) {
      return;
    }

    this.dismissEmojiPicker();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePressed(event: KeyboardEvent): void {
    if (!this.showEmojiPicker) {
      return;
    }

    event.preventDefault();
    this.dismissEmojiPicker(true);
  }

  resizeMessageField(): void {
    const element = this.input?.first?.nativeElement;
    if (!element) {
      return;
    }

    element.style.height = 'auto';
    const contentHeight = Math.max(element.scrollHeight, 24);
    const nextHeight = Math.min(contentHeight, this.TEXTAREA_MAX_HEIGHT_PX);
    element.style.height = `${nextHeight}px`;
    element.style.overflowY = contentHeight > this.TEXTAREA_MAX_HEIGHT_PX ? 'auto' : 'hidden';
  }

  keyTyped() {
    setTimeout(() => {
      const commentText: string = this.currentInputText;
      this.emojiSearchMode = !commentText.includes('`') && this.emojiRegex.test(commentText);

      if (this.emojiSearchMode) {
        // Get the cursor position in the textarea.
        const cursorPosition = this.caretOffset();

        // get the text from the start of the string up to the cursor.
        const testText = commentText.slice(0, cursorPosition);

        // within this smaller string, find the last :
        const lastColPos = testText.lastIndexOf(':');

        // The emoji search term will be from the position after the last :
        // Note, the second parameter is a length not position, so we subtract.
        this.emojiMatch = testText.substr(lastColPos + 1, cursorPosition - lastColPos);

        if (this.emojiMatch?.includes(' ')) {
          this.emojiSearchMode = false;
          this.emojiSearchResults = null;
        } else {
          // results is the list of emoji returned.
          const results = this.emojiSearch.search(this.emojiMatch);
          if (results?.length > 0) {
            this.emojiSearchResults = results.slice(0, 15);
          }
        }
      } // timeout to ensure that the inner html is updated with the new character.
    }, 0);
  }

  emojiSelected(emoji: string) {
    const element = this.input.first.nativeElement;
    element.value = element.value.replace(`:${this.emojiMatch}`, emoji);
    this.emojiSearchMode = false;
    this.resizeMessageField();
    this.saveCurrentDraft();
    element.focus();
  }

  private caretOffset() {
    const element = this.input.first.nativeElement;
    return element.selectionStart ?? element.value.length;
  }

  addEmoji(e): void {
    let char: string;
    if (typeof e === 'string') {
      char = e;
    } else {
      char = e.emoji.native;
    }
    const element = this.input.first.nativeElement;
    const position = this.caretOffset();
    element.setRangeText(char, position, element.selectionEnd ?? position, 'end');
    element.focus();
    this.resizeMessageField();
    this.saveCurrentDraft();
  }

  addFeedback(template: FeedbackTemplate): void {
    const char = template.commentText;
    const element = this.input.first.nativeElement;
    const position = this.caretOffset();
    element.setRangeText(char, position, element.selectionEnd ?? position, 'end');
    element.focus();
    this.resizeMessageField();
    setTimeout(() => {
      this.saveDraftForTask(this.task);
    });
  }

  openDiscussionComposer() {
    this.dialog.open(DiscussionComposerDialog, {
      data: {
        task: this.task,
      },
      maxWidth: '800px',
      disableClose: true,
    });

    // dialogRef.afterOpened().subscribe((result: any) => {
    // });

    // dialogRef.afterClosed().subscribe((result: any) => {
    // });
  }

  addComment() {
    if (this.isSending) {
      return;
    }
    const originalComment = this.sharedData.originalComment;
    if (this.stagedAttachments.length > 0) {
      this.uploadAttachmentQueue([...this.stagedAttachments], 0, originalComment);
      return;
    }

    this.postDraftText(originalComment);
  }

  private postDraftText(originalComment: TaskComment | null): void {
    if (!this.hasContent(this.currentInputText)) {
      this.finishSuccessfulDraft();
      return;
    }

    this.isSending = true;
    this.draftClientRequestId ??= this.newClientRequestId();
    this.saveCurrentDraft();

    const text = this.emojiService.nativeEmojiToColons(this.currentInputText);
    this.taskCommentService
      .addComment(this.task, text, 'text', originalComment, undefined, this.draftClientRequestId)
      .subscribe({
        next: (_tc: TaskComment) => {
          this.finishSuccessfulDraft();
        },
        error: (error: ApiError) => {
          this.isSending = false;
          this.alerts.error(this.uploadErrorMessage(error, 'Failed to send this message.'), 6000);
        },
      });
  }

  private uploadAttachmentQueue(
    queue: StagedFeedbackAttachment[],
    index: number,
    originalComment: TaskComment | null,
  ): void {
    if (index >= queue.length) {
      this.isSending = false;
      if (this.stagedAttachments.length === 0) {
        this.postDraftText(originalComment);
      } else {
        this.alerts.error('Some attachments could not be sent. Remove them or retry.', 6000);
      }
      return;
    }

    this.isSending = true;
    const attachment = queue[index];
    this.updateStagedAttachment(attachment.clientRequestId, {
      status: 'uploading',
      progress: 0,
      error: undefined,
    });

    this.taskCommentService
      .uploadStagedAttachment(
        this.task,
        attachment.data,
        attachment.fileName,
        '',
        originalComment,
        attachment.clientRequestId,
      )
      .subscribe({
        next: (state) => {
          this.updateStagedAttachment(attachment.clientRequestId, {
            status: 'uploading',
            progress: state.progress,
          });
          if (state.state === 'complete') {
            this.removeStagedAttachment(attachment.clientRequestId, false, true);
          }
        },
        error: (error: ApiError) => {
          this.updateStagedAttachment(attachment.clientRequestId, {
            status: 'failed',
            error: this.uploadErrorMessage(error, 'Upload failed. Retry or remove this file.'),
          });
          this.uploadAttachmentQueue(queue, index + 1, originalComment);
        },
        complete: () => this.uploadAttachmentQueue(queue, index + 1, originalComment),
      });
  }

  private finishSuccessfulDraft(): void {
    this.isSending = false;
    const taskKey =
      this.task.id || `${this.task.projectId || this.task.project?.id}_${this.task.definition?.id}`;
    this.submittedTaskIds.add(taskKey);
    const submittedKey = this.submittedKey();
    if (submittedKey) {
      sessionStorage.setItem(submittedKey, JSON.stringify([...this.submittedTaskIds]));
    }

    const context = this.draftContext(this.task);
    if (context) {
      this.draftStore.clear(context);
    }
    this.stagedAttachments = [];
    this.draftClientRequestId = null;
    this.draftReplyToId = null;
    this.sharedData.originalComment = null;
    this.clearInput();
    this.emojiSearchMode = false;
    this.dismissEmojiPicker();
    this.commentsViewer.scrollDown();
  }

  saveEditedComment() {
    if (this.isSending || !this.editingComment) {
      return;
    }

    this.isSending = true;
    const text = this.emojiService.nativeEmojiToColons(this.currentInputText);

    this.taskCommentService.editComment(this.editingComment, text).subscribe({
      next: (_tc: TaskComment) => {
        this.isSending = false;
        this.sharedData.editingComment = null;
        this.draftBeforeEdit = '';
        this.emojiSearchMode = false;
        this.dismissEmojiPicker();
        this.clearInput();
      },
      error: (error: ApiError) => {
        this.isSending = false;
        this.alerts.error(this.uploadErrorMessage(error, 'Failed to edit this comment.'), 6000);
      },
    });
  }

  addCommentWithType(comment: string, type: string) {
    this.taskCommentService.addComment(this.task, comment, type).subscribe({
      next: (_success: TaskComment) => {
        this.comment.text = '';
        this.commentsViewer.scrollDown();
        console.log('implement - check map comments');
        //this.task.comments = this.ts.mapComments(this.task.comments);
      },
      error: (message: string) => this.alerts.error(message, 6000),
    });
  }

  openFile() {
    this.uploader.nativeElement.click();
  }

  handlePaste(event: ClipboardEvent) {
    const files = this.getClipboardFiles(event);

    if (files.length === 0) {
      return;
    }

    const existingText = this.currentInputText;
    event.preventDefault();
    this.clearPastedPlaceholderContent(existingText);
    this.uploadFiles(files);
  }

  handleBeforeInput(event: InputEvent) {
    if (event.inputType !== 'insertFromPaste') {
      return;
    }

    const files = Array.from(event.dataTransfer?.files ?? []);

    if (files.length === 0) {
      return;
    }

    const existingText = this.currentInputText;
    event.preventDefault();
    this.clearPastedPlaceholderContent(existingText);
    this.uploadFiles(files);
  }

  uploadFiles(files: ArrayLike<File>) {
    Array.from(files).forEach((file) => {
      const validationError = this.attachmentValidationError(file);
      if (validationError) {
        this.alerts.error(validationError, 5000);
        return;
      }

      this.stageAttachment(file, file.name, 'file');
    });

    this.resetUploader();
    this.saveCurrentDraft();
  }

  stageAudioRecording(recording: Blob): void {
    if (!recording || recording.size === 0) {
      return;
    }
    for (const existing of this.stagedAttachments.filter((item) => item.kind === 'audio')) {
      this.removeStagedAttachment(existing.clientRequestId, false);
    }
    const extension = recording.type.includes('ogg') ? 'ogg' : 'webm';
    this.stageAttachment(recording, `feedback-recording.${extension}`, 'audio');
    this.saveCurrentDraft();
  }

  removeStagedAttachment(
    clientRequestId: string,
    save: boolean = true,
    allowUploading: boolean = false,
  ): void {
    const context = this.draftContext(this.task);
    if (!context) {
      return;
    }
    const attachment = this.stagedAttachments.find(
      (item) => item.clientRequestId === clientRequestId,
    );
    if (attachment?.status === 'uploading' && !allowUploading) {
      return;
    }
    this.draftStore.removeAttachment(context, clientRequestId);
    this.stagedAttachments = this.draftStore.attachments(context);
    if (save) {
      this.saveCurrentDraft();
    }
  }

  retryStagedAttachment(clientRequestId: string): void {
    if (this.isSending) {
      return;
    }
    const attachment = this.stagedAttachments.find(
      (item) => item.clientRequestId === clientRequestId,
    );
    if (attachment) {
      this.uploadAttachmentQueue([attachment], 0, this.originalComment);
    }
  }

  discardDraft(): void {
    const context = this.draftContext(this.task);
    if (context) {
      this.draftStore.clear(context);
    }
    this.stagedAttachments = [];
    this.draftClientRequestId = null;
    this.draftReplyToId = null;
    this.sharedData.originalComment = null;
    this.clearInput();
    this.recording = false;
  }

  private stageAttachment(data: File | Blob, fileName: string, kind: 'file' | 'audio'): void {
    const context = this.draftContext(this.task);
    if (!context) {
      this.alerts.error('Sign in before adding an attachment.', 4000);
      return;
    }
    const attachment: StagedFeedbackAttachment = {
      data,
      fileName,
      mimeType: data.type || 'application/octet-stream',
      byteSize: data.size,
      kind,
      clientRequestId: this.newClientRequestId(),
      status: 'staged',
      progress: 0,
    };
    this.draftStore.stageAttachment(context, attachment);
    this.stagedAttachments = this.draftStore.attachments(context);
  }

  private updateStagedAttachment(
    clientRequestId: string,
    update: Partial<StagedFeedbackAttachment>,
  ): void {
    const context = this.draftContext(this.task);
    if (!context) {
      return;
    }
    this.draftStore.updateAttachment(context, clientRequestId, update);
    this.stagedAttachments = this.draftStore.attachments(context);
    this.cdRef.detectChanges();
  }

  private attachmentValidationError(file: File): string | null {
    if (file.size === 0) {
      return `${file.name} is empty.`;
    }
    if (file.size >= MAX_ATTACHMENT_BYTES) {
      return `${file.name} is too large. Attachments must be smaller than 30 MB.`;
    }

    const mimeType = file.type.toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const unknownMime = mimeType === '' || mimeType === 'application/octet-stream';
    if (extension === 'docx' || mimeType === DOCX_MIME_TYPE) {
      return extension === 'docx' && (mimeType === DOCX_MIME_TYPE || unknownMime)
        ? null
        : `${file.name} does not match the DOCX file type.`;
    }
    if (extension === 'pdf' || mimeType === 'application/pdf' || mimeType === 'image/pdf') {
      return extension === 'pdf' &&
        (mimeType === 'application/pdf' || mimeType === 'image/pdf' || unknownMime)
        ? null
        : `${file.name} does not match the PDF file type.`;
    }
    if (
      ACCEPTED_FILE_TYPES.includes(mimeType) ||
      mimeType.startsWith('audio/') ||
      mimeType.startsWith('image/')
    ) {
      return null;
    }
    return `Cannot attach ${file.name}. Choose an image, audio file, PDF, or DOCX document.`;
  }

  private newClientRequestId(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  }

  private uploadErrorMessage(error: unknown, fallback: string): string {
    const failure = error as {
      error?: string | {error?: string; message?: string};
      message?: string;
      status?: number;
      name?: string;
    };
    if (typeof failure?.error === 'string' && failure.error.trim()) {
      return failure.error;
    }
    if (typeof failure?.error === 'object') {
      const nested = failure.error.error || failure.error.message;
      if (nested) {
        return nested;
      }
    }
    if (failure?.status === 0) {
      return 'You appear to be offline. Your draft is still here; reconnect and retry.';
    }
    if (failure?.name === 'TimeoutError' || failure?.status === 408 || failure?.status === 504) {
      return 'The upload timed out. Your draft is still here; retry when the connection is stable.';
    }
    return failure?.message || fallback;
  }

  private getClipboardFiles(event: ClipboardEvent): File[] {
    const clipboardData = event.clipboardData;

    if (!clipboardData) {
      return [];
    }

    const directFiles = Array.from(clipboardData.files ?? []);
    if (directFiles.length > 0) {
      return directFiles;
    }

    return Array.from(clipboardData.items ?? [])
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((file): file is File => file != null);
  }

  private clearPastedPlaceholderContent(existingText: string) {
    if (!this.input?.first?.nativeElement) {
      return;
    }

    // Let the browser finish the paste event lifecycle, then restore the pre-paste text
    // so clipboard attachment placeholders do not replace an in-progress draft.
    const generation = this.draftLoadGeneration;
    const draftKey = this.getDraftKey(this.task);
    const timer = setTimeout(() => {
      this.draftLoadTimers.delete(timer);
      if (generation !== this.draftLoadGeneration || draftKey !== this.getDraftKey(this.task)) {
        return;
      }
      this.input.first.nativeElement.value = existingText;
      this.resizeMessageField();
      this.saveCurrentDraft();
      this.cdRef.detectChanges();
    });
    this.draftLoadTimers.add(timer);
  }

  private resetUploader() {
    if (this.uploader?.nativeElement) {
      this.uploader.nativeElement.value = '';
    }
  }

  showFeedbackPicker() {
    this.showFeedbackTemplatePicker = !this.showFeedbackTemplatePicker;
    this.commentsViewer.scrollDown();
  }

  private syncComposerState() {
    if (this.isEditing) {
      this.beginEditingComment();
      return;
    }

    this.draftReplyToId = this.originalComment?.id ?? null;
    this.saveCurrentDraft();
    setTimeout(() => {
      this.input.first.nativeElement.focus();
    });
  }

  private beginEditingComment() {
    const currentText = this.currentInputText;
    const nextText = this.editingComment?.text ?? '';

    if (this.sharedData.originalComment != null) {
      this.sharedData.originalComment = null;
    }

    if (currentText !== nextText) {
      this.draftBeforeEdit = currentText;
      this.setComposerText(nextText);
    }

    setTimeout(() => {
      this.focusComposerAtEnd();
    });
  }

  private restoreDraftAfterEdit() {
    const draft = this.draftBeforeEdit;
    this.draftBeforeEdit = '';
    this.setComposerText(draft);
  }

  private setComposerText(text: string) {
    if (!this.input?.first?.nativeElement) {
      return;
    }

    this.input.first.nativeElement.value = text;
    this.resizeMessageField();
    this.cdRef.detectChanges();
  }

  private focusComposerAtEnd() {
    const element = this.input?.first?.nativeElement;
    if (!element) {
      return;
    }

    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  }
}

// The discussion prompt composer dialog Component
// eslint-disable-next-line max-classes-per-file
@Component({
  selector: 'discussion-prompt-composer-dialog.html',
  templateUrl: 'discussion-prompt-composer-dialog.html',
  styleUrls: ['./discussion-prompt-composer/discussion-prompt-composer.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class DiscussionComposerDialog {
  constructor(
    public dialogRef: MatDialogRef<DiscussionComposerDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {task: Task},
  ) {}
}
