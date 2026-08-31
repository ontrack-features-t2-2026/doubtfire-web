import {beforeEach, describe, expect, it} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute} from '@angular/router';
import {EMPTY} from 'rxjs';
import {Task} from 'src/app/api/models/task';
import {TaskService} from 'src/app/api/services/task.service';
import {UserService} from 'src/app/api/services/user.service';
import {ExtensionModalService} from 'src/app/common/modals/extension-modal/extension-modal.service';
import {QrModalService} from 'src/app/common/modals/qr-modal/qr-modal.service';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {FeedbackAppealModalService} from 'src/app/tasks/modals/feedback-appeal-modal/feedback-appeal-modal.service';
import {SubmissionTypeModalService} from 'src/app/tasks/modals/submission-type-modal/submission-type-modal.service';
import {TaskStatusCardComponent} from './task-status-card.component';

const taskServiceStub = {
  taskStatusUpdated$: EMPTY,
};
const emptyProvider = {};

describe('TaskStatusCardComponent', () => {
  let component: TaskStatusCardComponent;
  let fixture: ComponentFixture<TaskStatusCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskStatusCardComponent],
      providers: [
        {provide: ExtensionModalService, useValue: emptyProvider},
        {provide: TaskService, useValue: taskServiceStub},
        {provide: ActivatedRoute, useValue: emptyProvider},
        {provide: QrModalService, useValue: emptyProvider},
        {provide: DoubtfireConstants, useValue: emptyProvider},
        {provide: SubmissionTypeModalService, useValue: emptyProvider},
        {provide: UserService, useValue: emptyProvider},
        {provide: FeedbackAppealModalService, useValue: emptyProvider},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(TaskStatusCardComponent, {set: {template: ''}})
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskStatusCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it.each([
    {history: false, requiresFiles: true, first: true, replacement: false},
    {history: true, requiresFiles: true, first: false, replacement: true},
    {history: true, requiresFiles: false, first: false, replacement: false},
  ])(
    'shows exactly one appropriate upload action for $history/$requiresFiles',
    ({history, requiresFiles, first, replacement}) => {
      component.task = {
        hasSubmissionHistory: () => history,
        requiresFileUpload: () => requiresFiles,
      } as unknown as Task;

      expect(component.showUploadSubmission).toBe(first);
      expect(component.showUploadNewFiles).toBe(replacement);
    },
  );

  it('marks the replacement action pending while details or PDF processing is unresolved', () => {
    component.task = {processingPdf: true, loadingSubmissionDetails: false} as Task;
    expect(component.submissionActionPending).toBe(true);

    component.task = {processingPdf: false, loadingSubmissionDetails: true} as Task;
    expect(component.submissionActionPending).toBe(true);
  });
});
