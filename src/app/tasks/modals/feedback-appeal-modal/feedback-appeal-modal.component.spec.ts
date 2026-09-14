import {afterEach, describe, expect, it, vi} from 'vitest';
import {MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import {of, throwError} from 'rxjs';
import {Task} from 'src/app/api/models/task';
import {TaskService} from 'src/app/api/services/task.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {FeedbackAppealModalComponent} from './feedback-appeal-modal.component';
import {FeedbackAppealModalService} from './feedback-appeal-modal.service';

function buildComponent(requestFeedbackReview = vi.fn(() => of({}))) {
  const close = vi.fn();
  const addComment = vi.fn();
  const task = {
    definition: {abbreviation: '1.1P', name: 'Hello World'},
    requestFeedbackReview,
    addComment,
  } as unknown as Task;
  const alerts = {success: vi.fn(), error: vi.fn()};
  const notifyStatusChange = vi.fn();
  const component = new FeedbackAppealModalComponent(
    {close} as unknown as MatDialogRef<FeedbackAppealModalComponent>,
    {task},
    alerts as unknown as AlertService,
    {notifyStatusChange} as unknown as TaskService,
  );
  component.ngOnInit();

  return {component, close, addComment, requestFeedbackReview, notifyStatusChange, alerts};
}

describe('FeedbackAppealModalComponent', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('confirms dirty dismissal but lets a pristine dialog close', () => {
    const {component} = buildComponent();
    const confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);

    expect(component.canClose()).toBe(true);
    component.reviewComment = 'Please review this criterion';
    expect(component.canClose()).toBe(false);
    expect(confirm).toHaveBeenCalled();
  });

  it('submits trimmed text once and keeps controlled failures open', () => {
    const success = buildComponent();
    success.component.reviewComment = '  Please review criterion one.  ';
    success.component.submit();

    expect(success.requestFeedbackReview).toHaveBeenCalledTimes(1);
    expect(success.notifyStatusChange).toHaveBeenCalledTimes(1);
    expect(success.addComment).toHaveBeenCalledWith('Please review criterion one.');
    expect(success.close).toHaveBeenCalledTimes(1);

    const failure = buildComponent(
      vi.fn(() => throwError(() => new Error('sensitive transport detail'))),
    );
    failure.component.reviewComment = 'Please review criterion two.';
    failure.component.submit();

    expect(failure.close).not.toHaveBeenCalled();
    expect(failure.component.errorMessage).toBe(
      'The feedback review request could not be sent. Please try again.',
    );
  });
});

describe('FeedbackAppealModalService', () => {
  it('uses the shared responsive/focus-safe dialog contract', () => {
    const dialogRef = {};
    const open = vi.fn((_component: unknown, _config: MatDialogConfig) => dialogRef);
    const service = new FeedbackAppealModalService({open} as unknown as MatDialog);

    expect(service.show({} as Task)).toBe(dialogRef);
    const config = open.mock.calls[0][1] as MatDialogConfig;

    expect(config).toMatchObject({
      autoFocus: 'dialog',
      closeOnNavigation: true,
      maxHeight: 'calc(100dvh - 2rem)',
      maxWidth: '700px',
      restoreFocus: true,
      width: 'calc(100vw - 2rem)',
    });
    expect(config.position).toBeUndefined();
    expect(
      config.closePredicate(undefined, config, {
        canClose: () => false,
      } as unknown as FeedbackAppealModalComponent),
    ).toBe(false);
  });
});
