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
      uploadInFlight: false,
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
      uploadInFlight: true,
      hasSelectedFiles: () => true,
    };
    const confirm = vi.spyOn(window, 'confirm');

    expect(component.canClose()).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('can be dismissed and retried once a failed upload has settled', () => {
    // The uploader keeps isUploading set after the request lands, because its
    // own outcome panels render under it. Reading that as "still uploading"
    // trapped the student on the error: no backdrop, no Escape, no retry.
    (component as unknown as {fileUploader: unknown}).fileUploader = {
      isUploading: true,
      uploadInFlight: false,
      uploadingInfo: {complete: true, success: false},
      hasSelectedFiles: () => true,
    };
    component.uploadStarted = true;
    // What the uploader's onFailure callback does, rather than a hand-set: the
    // Submit button stays locked without it and the retry below is unreachable.
    component.onUploadFailed();

    expect(component.uploadFailed).toBe(true);

    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    expect(component.canClose()).toBe(true);
    expect(confirm).toHaveBeenCalled();
    confirm.mockRestore();

    const startUpload = vi.fn();
    component.onUploaderReady(startUpload);
    component.uploadButtonClicked();
    expect(startUpload).toHaveBeenCalled();
  });

  it('never asks about discarding work the server has already taken', () => {
    // canClose is the dialog's closePredicate, and Material runs it for
    // programmatic closes too. Prompting here both lied to the student and
    // vetoed the dialog closing itself: answering "Cancel" to "discard your
    // files?" kept them in it.
    (component as unknown as {fileUploader: unknown}).fileUploader = {
      isUploading: true,
      uploadInFlight: false,
      hasSelectedFiles: () => true,
    };
    const confirm = vi.spyOn(window, 'confirm');

    component.onUploadSuccess({id: 8, project_id: 1, status: 'ready_for_feedback'});

    // The response is in, the confirmation has not been worked out yet.
    expect(component.celebration).toBeNull();
    expect(component.canClose()).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('records the submission when the dialog is dismissed before the callback', () => {
    // Escape or the backdrop on the "Uploaded" panel destroys the dialog before
    // the uploader reports completion. The bytes are already accepted, so the
    // status change still has to land, with the celebration left for elsewhere.
    component.submissionType = 'ready_for_feedback';
    component.onUploadSuccess({id: 8, project_id: 1, status: 'ready_for_feedback'});

    component.ngOnDestroy();

    expect(task.updateFromJson).toHaveBeenCalled();
    expect(task.processTaskStatusChange).toHaveBeenCalledWith(
      'ready_for_feedback',
      expect.anything(),
      true,
      false,
    );
  });

  it('still records the status change when Done is pressed before the callback fires', () => {
    // Done is on screen from the moment the bytes land, which is about a second
    // before the uploader reports completion. Leaving in that window used to
    // close the dialog without ever applying the response.
    component.submissionType = 'ready_for_feedback';
    component.onUploadSuccess({id: 8, project_id: 1, status: 'ready_for_feedback'});

    component.finishCelebration();

    expect(task.updateFromJson).toHaveBeenCalled();
    // Unclaimed, so the dashboard gets to show what this dialog no longer will.
    expect(task.processTaskStatusChange).toHaveBeenCalledWith(
      'ready_for_feedback',
      expect.anything(),
      true,
      false,
    );
    expect(dialogRef.close).toHaveBeenCalledWith({value: task});

    // And the uploader's own callback must not apply it a second time.
    component.onUploadComplete();
    expect(task.processTaskStatusChange).toHaveBeenCalledTimes(1);
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

    // The handover plays first, so the panel is mid-swap and not yet showing
    // the confirmation.
    expect(component.flowSwapping).toBe(true);
    expect(component.celebration).toBeNull();

    vi.advanceTimersByTime(600);
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
      uploadInFlight: true,
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
    vi.advanceTimersByTime(600);

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
