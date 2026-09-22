import {beforeEach, describe, expect, it, vi} from 'vitest';
import {OverlayContainer} from '@angular/cdk/overlay';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import {ActivatedRoute} from '@angular/router';
import {EMPTY} from 'rxjs';
import {Task} from 'src/app/api/models/task';
import {TaskStatus} from 'src/app/api/models/task-status';
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
      imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatMenuModule, MatSelectModule],
      providers: [
        {provide: ExtensionModalService, useValue: emptyProvider},
        {provide: TaskService, useValue: taskServiceStub},
        {provide: ActivatedRoute, useValue: emptyProvider},
        {provide: QrModalService, useValue: emptyProvider},
        {provide: DoubtfireConstants, useValue: emptyProvider},
        {provide: SubmissionTypeModalService, useValue: emptyProvider},
        {provide: UserService, useValue: {currentUser: {systemRole: 'Student'}}},
        {provide: FeedbackAppealModalService, useValue: emptyProvider},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskStatusCardComponent);
    component = fixture.componentInstance;
    component.task = {
      status: 'working_on_it',
      statusLabel: () => 'Working On It',
      statusHelp: () => ({reason: 'Keep working.', action: ''}),
      blockedByPrerequisiteTasks: vi.fn().mockReturnValue(false),
      canApplyForExtension: () => false,
      inSubmittedState: () => false,
      triggerTransition: vi.fn(),
    } as unknown as Task;
    component.triggers = [
      TaskStatus.statusData('working_on_it'),
      TaskStatus.statusData('need_help'),
    ];
    fixture.detectChanges();
  });

  const combobox = (): HTMLElement => fixture.nativeElement.querySelector('[role="combobox"]');

  const accessibleLabel = (): string =>
    combobox()
      .getAttribute('aria-labelledby')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent)
      .join(' ');

  it('names the status combobox and keeps status text out of the heading list', async () => {
    expect(accessibleLabel()).toContain('Task status');
    expect(fixture.nativeElement.querySelector('h2, h5')).toBeNull();

    combobox().click();
    fixture.detectChanges();
    await fixture.whenStable();

    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    expect(overlay.querySelector('h2, h5')).toBeNull();
    const options = Array.from(overlay.querySelectorAll<HTMLElement>('[role="option"]'));
    expect(options).toHaveLength(2);
    expect(options[1].textContent).toContain('Need Help');
    options[1].click();
    fixture.detectChanges();

    expect(component.task.triggerTransition).toHaveBeenCalledWith('need_help');
  });

  it('keeps the label available when prerequisites disable the selector', () => {
    vi.mocked(component.task.blockedByPrerequisiteTasks).mockReturnValue(true);
    fixture.detectChanges();

    expect(accessibleLabel()).toContain('Task status');
    expect(combobox().getAttribute('aria-disabled')).toBe('true');
    combobox().click();
    fixture.detectChanges();
    expect(
      TestBed.inject(OverlayContainer).getContainerElement().querySelector('[role="listbox"]'),
    ).toBeNull();
    expect(component.task.triggerTransition).not.toHaveBeenCalled();
  });
});
