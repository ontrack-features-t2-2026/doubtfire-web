import {beforeEach, describe, expect, it, vi} from 'vitest';
import {CommonModule} from '@angular/common';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {BehaviorSubject} from 'rxjs';
import {Task} from 'src/app/api/models/task';
import {ProjectService} from 'src/app/api/services/project.service';
import {TaskService} from 'src/app/api/services/task.service';
import {UserService} from 'src/app/api/services/user.service';
import {SelectedTaskService} from 'src/app/projects/states/dashboard/selected-task.service';
import {FileDownloaderService} from '../file-downloader/file-downloader.service';
import {ConfirmationModalService} from '../modals/confirmation-modal/confirmation-modal.service';
import {DiscussedInClassReasonModalService} from '../modals/discussed-in-class-reason-modal/discussed-in-class-reason-modal.service';
import {TaskAssessmentModalService} from '../modals/task-assessment-modal/task-assessment-modal.service';
import {ProjectProgressBarComponent} from '../project-progress-bar/project-progress-bar.component';
import {AlertService} from '../services/alert.service';
import {FooterComponent} from './footer.component';

const emptyProvider = {};

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  let selectedTask: BehaviorSubject<Task>;

  beforeEach(async () => {
    selectedTask = new BehaviorSubject<Task>({
      definition: {assessInPortfolioOnly: false},
      project: {},
      suggestedTaskStatus: 'redo',
      canMarkComplete: false,
      updateTaskStatus: vi.fn(),
      hasReadyForFeedbackDependents: vi.fn().mockResolvedValue(false),
    } as unknown as Task);
    await TestBed.configureTestingModule({
      declarations: [FooterComponent, ProjectProgressBarComponent],
      imports: [CommonModule, MatMenuModule, MatProgressBarModule],
      providers: [
        {provide: SelectedTaskService, useValue: {selectedTask$: selectedTask}},
        {
          provide: TaskService,
          useValue: {
            statusData: (status: string) => ({
              label: status === 'redo' ? 'Redo' : 'Complete',
              materialIcon: 'done',
              class: '',
            }),
          },
        },
        {provide: FileDownloaderService, useValue: emptyProvider},
        {provide: TaskAssessmentModalService, useValue: emptyProvider},
        {provide: UserService, useValue: emptyProvider},
        {provide: ProjectService, useValue: emptyProvider},
        {provide: ConfirmationModalService, useValue: emptyProvider},
        {provide: DiscussedInClassReasonModalService, useValue: emptyProvider},
        {provide: AlertService, useValue: emptyProvider},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    component.viewType = 'inbox';
    fixture.detectChanges();
  });

  it('names grading actions and keeps the names connected to the correct status changes', async () => {
    const redo: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Mark as Redo"]',
    );
    const resubmit: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Mark as Resubmit"]',
    );
    redo.click();
    resubmit.click();
    await fixture.whenStable();
    expect(selectedTask.value.updateTaskStatus).toHaveBeenCalledWith('redo');
    expect(selectedTask.value.updateTaskStatus).toHaveBeenCalledWith('fix_and_resubmit');
  });

  it('updates the recommended action name when its status changes', () => {
    const recommended: HTMLButtonElement =
      fixture.nativeElement.querySelector('.suggested-task-status');
    expect(recommended.getAttribute('aria-label')).toBe('Recommended: Mark as Redo');
    selectedTask.next({...selectedTask.value, suggestedTaskStatus: 'complete'} as Task);
    fixture.detectChanges();
    expect(recommended.getAttribute('aria-label')).toBe('Recommended: Mark as Complete');
    expect(recommended.disabled).toBe(true);
  });

  it('keeps unavailable file and status controls named without a selected task', () => {
    selectedTask.next(undefined);
    fixture.detectChanges();
    for (const label of [
      'Mark as Redo',
      'Mark as Resubmit',
      'Submission Options',
      'Download submitted files',
      'Download Submission',
    ]) {
      const button: HTMLButtonElement = fixture.nativeElement.querySelector(
        `[aria-label="${label}"]`,
      );
      expect(button).not.toBeNull();
      expect(button.disabled).toBe(true);
    }
    expect(fixture.nativeElement.querySelector('f-user-badge')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('mat-chip-listbox')).toBeNull();
  });

  it('shows the selected project target as text rather than a selection control', () => {
    selectedTask.next({
      ...selectedTask.value,
      project: {
        targetGradeWord: 'Pass',
        targetGradeAcronym: 'P',
        taskStats: [{value: 0}, {value: 0}, {value: 0}, {value: 0}, {value: 42}],
      },
    } as Task);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Target grade: Pass');
    expect(fixture.nativeElement.querySelector('mat-chip-option, [role="listbox"]')).toBeNull();
    const progress = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(progress.getAttribute('aria-label')).toBe('Project progress towards target grade');
    expect(progress.getAttribute('aria-valuenow')).toBe('42');
  });

  it('names the moderation action menu', () => {
    component.viewType = 'moderation';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-label="Action options"]')).not.toBeNull();
  });
});
