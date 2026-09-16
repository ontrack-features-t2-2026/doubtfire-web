import {type Mock, beforeEach, describe, expect, it, vi} from 'vitest';
import {Task} from 'src/app/api/models/task';
import {
  UploadSubmissionModalComponent,
  UploadSubmissionModalData,
} from './upload-submission-modal.component';

describe('UploadSubmissionModalComponent', () => {
  let component: UploadSubmissionModalComponent;
  let task: Task;
  let dialogRef: {close: ReturnType<typeof vi.fn>};

  beforeEach(() => {
    task = {
      status: 'not_started',
      definition: {
        abbreviation: '1.1P',
        name: 'Hello World',
        uploadRequirements: [{key: 'file0', name: 'Task evidence', type: 'document'}],
        assessInPortfolioOnly: false,
      },
      project: {id: 1},
      unit: {id: 2},
      isGroupTask: () => false,
      inSubmittedState: () => false,
      submissionUrl: () => '/submission',
      testSubmissionUrl: () => '/test-submission',
      updateFromJson: vi.fn(),
      processTaskStatusChange: vi.fn(),
    } as unknown as Task;
    dialogRef = {close: vi.fn()};
    const data: UploadSubmissionModalData = {
      task,
      reuploadEvidence: false,
      isTestSubmission: false,
    };
    component = new UploadSubmissionModalComponent(
      data,
      dialogRef as never,
      {
        submittableStatuses: ['ready_for_feedback'],
        statusLabels: new Map([['ready_for_feedback', 'Ready for feedback']]),
        mapping: {},
      } as never,
      {} as never,
      {privacy: '', plagiarism: ''} as never,
      {error: vi.fn()} as never,
      {nativeEmojiToColons: (value: string) => value} as never,
    );
    component.ngOnInit();
  });

  it('allows untouched backdrop dismissal and confirms before discarding selected files', () => {
    component.comment = 'A note that has not selected a local file';
    component.submissionType = 'need_help';
    expect(component.canClose()).toBe(true);

    (component as unknown as {fileUploader: unknown}).fileUploader = {
      isUploading: false,
      hasSelectedFiles: () => true,
    };
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(component.canClose()).toBe(false);
    expect(confirm).toHaveBeenCalledWith(
      'Discard the files and details selected for this submission?',
    );

    confirm.mockReturnValue(true);
    expect(component.canClose()).toBe(true);
    confirm.mockRestore();
  });

  it('cannot dismiss while the upload request is active', () => {
    (component as unknown as {fileUploader: unknown}).fileUploader = {
      isUploading: true,
      hasSelectedFiles: () => true,
    };
    const confirm = vi.spyOn(window, 'confirm');

    expect(component.canClose()).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('marks the task queued immediately and closes on the same task after upload', () => {
    component.submissionType = 'ready_for_feedback';
    component.onUploadSuccess({id: 8, project_id: 1, status: 'ready_for_feedback'});

    expect(task.processingPdf).toBe(true);
    expect(task.submissionProcessingState).toBe('queued');

    component.onUploadComplete();

    expect(task.updateFromJson).toHaveBeenCalled();
    expect(task.processTaskStatusChange).toHaveBeenCalledWith(
      'ready_for_feedback',
      expect.anything(),
      true,
      true,
    );
    expect(dialogRef.close).toHaveBeenCalledWith({value: task});
  });

  it('holds the dialog open on the confirmation, then closes on the same task', () => {
    vi.useFakeTimers();
    (task.processTaskStatusChange as unknown as Mock).mockReturnValue({
      timing: 'on_time',
      resubmission: false,
      tone: 'success',
      particles: true,
      headline: 'Submitted on time. Ready for feedback',
      detail: 'T1 A task',
    });

    component.submissionType = 'ready_for_feedback';
    component.onUploadSuccess({id: 8, project_id: 1, status: 'ready_for_feedback'});
    component.onUploadComplete();

    // The old words blur away first, so the panel is mid-swap and not yet
    // showing the confirmation.
    expect(component.flowSwapping).toBe(true);
    expect(component.celebration).toBeNull();

    vi.advanceTimersByTime(300);
    expect(component.flowSwapping).toBe(false);
    expect(component.celebration?.headline).toBe('Submitted on time. Ready for feedback');
    expect(dialogRef.close).not.toHaveBeenCalled();

    // Still open well after the sequence itself has finished arriving, so there
    // is time to read it rather than catch it.
    vi.advanceTimersByTime(2500);
    expect(dialogRef.close).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1500);
    expect(dialogRef.close).toHaveBeenCalledWith({value: task});
    vi.useRealTimers();
  });

  it('lets someone in a hurry leave on the confirmation without a warning', () => {
    (component as unknown as {fileUploader: unknown}).fileUploader = {
      isUploading: true,
      hasSelectedFiles: () => true,
    };
    const confirm = vi.spyOn(window, 'confirm');

    // Mid-upload the dialog holds on, files selected and request in flight.
    expect(component.canClose()).toBe(false);

    // Once it is confirmed the work is saved, so the backdrop and Escape work.
    component.celebration = {
      timing: 'on_time',
      resubmission: false,
      tone: 'success',
      particles: false,
      headline: 'Submitted on time. Ready for feedback',
      detail: '1.1P Hello World',
    };
    expect(component.canClose()).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('closes early when the confirmation is dismissed, and only once', () => {
    vi.useFakeTimers();
    (task.processTaskStatusChange as unknown as Mock).mockReturnValue({
      timing: 'after_due',
      resubmission: false,
      tone: 'neutral',
      particles: false,
      headline: 'Submitted after the due date',
      detail: 'T1 A task',
    });

    component.submissionType = 'ready_for_feedback';
    component.onUploadSuccess({id: 8, project_id: 1, status: 'ready_for_feedback'});
    component.onUploadComplete();
    vi.advanceTimersByTime(300);

    component.finishCelebration();
    expect(dialogRef.close).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(dialogRef.close).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('restores selection controls after a cancelled slow upload', () => {
    component.uploadStarted = true;
    component.uploadSubmitLocked = true;

    component.onUploadCancelled();

    expect(component.uploadStarted).toBe(false);
    expect(component.uploadSubmitLocked).toBe(false);
    expect(component.currentStage).toBe('details');
  });

  it('lists the steps and marks the current one', () => {
    expect(component.steps.map((step) => step.label)).toEqual(['Upload files', 'Comments']);
    expect(component.currentStepIndex).toBe(0);

    component.onReadyChange(true);
    component.goToCommentsStage();
    expect(component.currentStepIndex).toBe(1);
  });

  it('explains a disabled forward button and clears once the file is chosen', () => {
    expect(component.shouldDisableNext()).toBe(true);
    expect(component.continueHint).toBe('Add the required file to continue');

    component.onReadyChange(true);
    expect(component.continueHint).toBeNull();
  });

  it('carries one panel from sending through to the confirmation', () => {
    const uploader = {
      uploadProgress: 40,
      uploadLanded: false,
      uploadingFileLabel: 'report.pdf',
      uploadingInfo: {success: null},
      cancelUpload: vi.fn(),
    };
    (component as unknown as {fileUploader: unknown}).fileUploader = uploader;

    // Nothing until Submit is pressed.
    expect(component.showSubmitFlow).toBe(false);

    component.uploadStarted = true;
    expect(component.showSubmitFlow).toBe(true);
    expect(component.flowTitle).toBe('Uploading your work');
    expect(component.flowDetail).toBe('report.pdf');
    expect(component.flowProgress).toBe(40);
    expect(component.flowLanded).toBe(false);

    // The bytes are away, but the confirmation has not arrived yet.
    uploader.uploadLanded = true;
    expect(component.flowLanded).toBe(true);
    expect(component.flowTitle).toBe('Uploaded');

    // The same panel becomes the confirmation.
    component.celebration = {
      timing: 'on_time',
      resubmission: false,
      tone: 'success',
      particles: true,
      headline: 'Submitted on time. Ready for feedback',
      detail: '1.1P Hello World',
    };
    expect(component.showSubmitFlow).toBe(true);
    expect(component.flowTitle).toBe('Submitted on time. Ready for feedback');
    expect(component.flowDetail).toBe('1.1P Hello World');
    expect(component.flowProgress).toBe(100);
  });

  it('hands a failure back to the uploader rather than holding the panel', () => {
    (component as unknown as {fileUploader: unknown}).fileUploader = {
      uploadProgress: 100,
      uploadLanded: false,
      uploadingFileLabel: 'report.pdf',
      uploadingInfo: {success: false},
    };
    component.uploadStarted = true;

    expect(component.uploadFailed).toBe(true);
    expect(component.showSubmitFlow).toBe(false);
  });

  it('drops the requirements callout when one drop zone already says the same thing', () => {
    expect(component.showUploadRequirements).toBe(false);

    task.definition.uploadRequirements = [
      {key: 'file0', name: 'Report', type: 'document'},
      {key: 'file1', name: 'Code', type: 'code'},
    ] as never;
    expect(component.showUploadRequirements).toBe(true);
  });

  it('shows a status icon only for submission types that are task statuses', () => {
    expect(component.statusFor('ready_for_feedback')).toBe('ready_for_feedback');
    expect(component.statusFor('reupload_evidence')).toBeNull();
    expect(component.selectedSubmissionTypeLabel).toBe('');
  });
});
