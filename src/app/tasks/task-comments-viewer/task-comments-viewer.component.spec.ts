import {beforeEach, describe, expect, it} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {EMPTY} from 'rxjs';
import {TaskCommentService, TaskService, UserService} from 'src/app/api/models/doubtfire-model';
import {FeedbackTemplateService} from 'src/app/api/services/feedback-template.service';
import {CommentsModalService} from 'src/app/common/modals/comments-modal/comments-modal.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {TaskCommentsViewerComponent} from './task-comments-viewer.component';

const taskCommentServiceStub = {
  commentAdded$: EMPTY,
};
const taskServiceStub = {
  taskStatusUpdated$: EMPTY,
};
const emptyProvider = {};

const EMPTY_STATE_TEMPLATE = `
  <div>
    @if (!task || task.comments.length === 0) {
      <div fxFlexFill fxLayout="column" fxLayoutAlign="center center">
        <mat-icon id="noView" aria-hidden="true">forum</mat-icon>
        <p>No comments on this task yet.</p>
      </div>
    }
  </div>
`;

describe('TaskCommentsViewerComponent', () => {
  let component: TaskCommentsViewerComponent;
  let fixture: ComponentFixture<TaskCommentsViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskCommentsViewerComponent],
      providers: [
        {provide: TaskCommentService, useValue: taskCommentServiceStub},
        {provide: FeedbackTemplateService, useValue: emptyProvider},
        {provide: UserService, useValue: emptyProvider},
        {provide: TaskService, useValue: taskServiceStub},
        {provide: DoubtfireConstants, useValue: emptyProvider},
        {provide: CommentsModalService, useValue: emptyProvider},
        {provide: AlertService, useValue: emptyProvider},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(TaskCommentsViewerComponent, {set: {template: ''}})
      .compileComponents();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(TaskCommentsViewerComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('renders empty-state text when there is no task or no comments', () => {
    TestBed.overrideComponent(TaskCommentsViewerComponent, {
      set: {template: EMPTY_STATE_TEMPLATE},
    });
    fixture = TestBed.createComponent(TaskCommentsViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const emptyIcon = fixture.nativeElement.querySelector('#noView');
    const emptyText = fixture.nativeElement.querySelector('p');
    expect(emptyIcon).toBeTruthy();
    expect(emptyText.textContent).toContain('No comments on this task yet.');
  });

  it('does not render empty-state text when task has comments', () => {
    TestBed.overrideComponent(TaskCommentsViewerComponent, {
      set: {template: EMPTY_STATE_TEMPLATE},
    });
    fixture = TestBed.createComponent(TaskCommentsViewerComponent);
    component = fixture.componentInstance;
    component.task = {comments: [{}]} as unknown as TaskCommentsViewerComponent['task'];
    fixture.detectChanges();

    const emptyIcon = fixture.nativeElement.querySelector('#noView');
    expect(emptyIcon).toBeFalsy();
  });
});
