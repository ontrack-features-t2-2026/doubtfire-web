import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {By} from '@angular/platform-browser';
import {BehaviorSubject} from 'rxjs';
import {ProjectService, TaskService} from 'src/app/api/models/doubtfire-model';
import {Task} from 'src/app/api/models/task';
import {UserService} from 'src/app/api/services/user.service';
import {FileUploaderComponent} from 'src/app/common/file-uploader/file-uploader.component';
import {AlertService} from 'src/app/common/services/alert.service';
import {EmojiService} from 'src/app/common/services/emoji.service';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {PrivacyPolicy} from 'src/app/config/privacy-policy/privacy-policy';
import {TaskUploadRequirementsComponent} from './task-upload-requirements/task-upload-requirements.component';
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
    // The component injects its Injector for focus handling, so build it in an injection context.
    component = TestBed.runInInjectionContext(
      () =>
        new UploadSubmissionModalComponent(
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
        ),
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
    );
    expect(dialogRef.close).toHaveBeenCalledWith({value: task});
  });

  it('restores selection controls after a cancelled slow upload', () => {
    component.uploadStarted = true;
    component.uploadSubmitLocked = true;

    component.onUploadCancelled();

    expect(component.uploadStarted).toBe(false);
    expect(component.uploadSubmitLocked).toBe(false);
    expect(component.currentStage).toBe('details');
  });
});

// The guidance and file selection checks for this setup are in the reviewed spec.
describe('UploadSubmissionModalComponent rendered stages', () => {
  let fixture: ComponentFixture<UploadSubmissionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
      declarations: [
        UploadSubmissionModalComponent,
        FileUploaderComponent,
        TaskUploadRequirementsComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            isTestSubmission: true,
            task: {
              definition: {
                abbreviation: '1.1P',
                assessInPortfolioOnly: false,
                name: 'Upload evidence',
                uploadRequirements: [{key: 'file0', name: 'Source code', type: 'code'}],
              },
              testSubmissionUrl: () => '/api/test-submission',
              isGroupTask: () => false,
            },
          },
        },
        {provide: MatDialogRef, useValue: {}},
        {provide: TaskService, useValue: {}},
        {provide: ProjectService, useValue: {}},
        {provide: PrivacyPolicy, useValue: {}},
        {provide: AlertService, useValue: {}},
        {provide: EmojiService, useValue: {}},
        {
          provide: UserService,
          useValue: {currentUser: {authenticationToken: 'demo-token', username: 'demo'}},
        },
        {provide: DoubtfireConstants, useValue: {ExternalName: new BehaviorSubject('OnTrack')}},
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UploadSubmissionModalComponent);
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  it('associates the required comment instructions and exposes the same trimmed validation as Submit', async () => {
    const component = fixture.componentInstance;
    component.onSubmissionTypeChange('need_help');
    component.onReadyChange(true);
    component.goToCommentsStage();
    fixture.detectChanges();
    await fixture.whenStable();
    const comment: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    const hintIds = comment.getAttribute('aria-describedby')!.split(' ');
    const help = hintIds.map((id) => document.getElementById(id)?.textContent).join(' ');
    expect(comment.required).toBe(true);
    expect(help).toContain('at least 25 characters');
    expect(help).toContain('excluding leading and trailing spaces');
    expect(component.shouldDisableSubmit()).toBe(true);

    comment.value = 'short';
    comment.dispatchEvent(new Event('input'));
    comment.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(comment.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('mat-error').textContent).toContain(
      'at least 25 characters',
    );

    comment.value = '   Please help with this demonstration task.   ';
    comment.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.shouldDisableSubmit()).toBe(false);
    expect(comment.getAttribute('aria-invalid')).not.toBe('true');
    expect(fixture.nativeElement.textContent).toContain(
      `Character count: ${comment.value.trim().length}`,
    );
  });

  it('moves focus to the new stage after Next and Back without exposing a hidden heading', async () => {
    const component = fixture.componentInstance;
    component.onSubmissionTypeChange('need_help');
    component.onReadyChange(true);
    fixture.detectChanges();
    await fixture.whenStable();
    component.goToCommentsStage();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement?.textContent).toContain('What do you need help with?');
    expect(document.activeElement?.getAttribute('tabindex')).toBe('-1');

    component.goToDetailsStage();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement?.textContent).toContain('Select files to upload');
  });

  it('keeps optional comments optional and announces upload start in one stable status region', async () => {
    const component = fixture.componentInstance;
    component.onSubmissionTypeChange('ready_for_feedback');
    component.onReadyChange(true);
    component.goToCommentsStage();
    fixture.detectChanges();
    await fixture.whenStable();
    const comment: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(comment.required).toBe(false);
    expect(component.shouldDisableSubmit()).toBe(false);
    const region = fixture.nativeElement.querySelector('mat-dialog-content > [role="status"]');
    expect(region.textContent.trim()).toBe('');
    component.onUploaderReady(component.onBeforeUpload);
    component.uploadButtonClicked();
    fixture.detectChanges();
    expect(region.textContent).toContain('Uploading submission');
    expect(fixture.nativeElement.querySelector('mat-dialog-content > [role="status"]')).toBe(
      region,
    );
    component.onUploadFailure();
    fixture.detectChanges();
    expect(region.textContent).toContain('Submission upload failed');
  });

  it('announces a retry and moves focus away from the removed Retry Upload button', async () => {
    vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(() => {});
    vi.spyOn(XMLHttpRequest.prototype, 'setRequestHeader').mockImplementation(() => {});
    const send = vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => {});
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type=file]');
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [new File(['demo'], 'source.vue')],
    });
    input.dispatchEvent(new Event('change'));
    const component = fixture.componentInstance;
    const uploader = fixture.debugElement.query(By.directive(FileUploaderComponent))
      .componentInstance as FileUploaderComponent;
    component.uploadStarted = true;
    uploader.isUploading = true;
    uploader.uploadingInfo = {
      progress: 100,
      complete: true,
      success: false,
      error: 'Demonstration error',
    };
    uploader.onFailure?.({error: 'Demonstration error'});
    fixture.detectChanges();
    const region = fixture.nativeElement.querySelector('mat-dialog-content > [role="status"]');
    expect(region.textContent).toContain('Retry Upload or Cancel');
    const retry = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'Retry Upload',
    ) as HTMLButtonElement;
    retry.focus();
    retry.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(send).toHaveBeenCalledOnce();
    expect(region.textContent).toContain('Uploading submission');
    expect(retry.isConnected).toBe(false);
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('h2[mat-dialog-title]'),
    );
  });
});
