import {afterEach, describe, expect, it, vi} from 'vitest';
import {MatDialogRef} from '@angular/material/dialog';
import {of, throwError} from 'rxjs';
import {Task, TaskCommentService} from 'src/app/api/models/doubtfire-model';
import {AlertService} from '../../services/alert.service';
import {ExtensionModalComponent} from './extension-modal.component';

function buildComponent(requestExtension = vi.fn(() => of({}))) {
  const close = vi.fn();
  const afterApplication = vi.fn();
  const task = {
    localDueDate: () => new Date('2026-09-01T00:00:00Z'),
    localDeadlineDate: () => new Date('2026-10-01T00:00:00Z'),
  } as Task;
  const alerts = {success: vi.fn(), error: vi.fn()};
  const component = new ExtensionModalComponent(
    {close} as unknown as MatDialogRef<ExtensionModalComponent>,
    {task, afterApplication},
    'en-AU',
    alerts as unknown as AlertService,
    {requestExtension} as unknown as TaskCommentService,
  );

  return {component, close, afterApplication, requestExtension, alerts, task};
}

describe('ExtensionModalComponent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('closes without prompting while pristine and confirms before discarding entered text', () => {
    const {component} = buildComponent();
    const confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);

    expect(component.canClose()).toBe(true);

    component.extensionData.controls.extensionReason.setValue(
      'A sufficiently detailed reason for the request',
    );
    component.extensionData.controls.extensionReason.markAsDirty();

    expect(component.canClose()).toBe(false);
    expect(confirm).toHaveBeenCalledWith(
      'Discard this extension request? Your entered details will be lost.',
    );

    confirm.mockReturnValue(true);
    expect(component.canClose()).toBe(true);
  });

  it('keeps the dialog open on a controlled error and closes only after success', () => {
    const failure = buildComponent(
      vi.fn(() => throwError(() => new Error('sensitive transport detail'))),
    );
    failure.component.extensionData.controls.extensionReason.setValue(
      'A sufficiently detailed reason for the request',
    );

    failure.component.submitApplication();

    expect(failure.close).not.toHaveBeenCalled();
    expect(failure.component.errorMessage).toBe(
      'The extension request could not be sent. Please try again.',
    );
    expect(failure.alerts.error).not.toHaveBeenCalledWith(
      expect.stringContaining('sensitive transport detail'),
      expect.anything(),
    );

    const success = buildComponent();
    success.component.extensionData.controls.extensionReason.setValue(
      'A sufficiently detailed reason for the request',
    );
    success.component.submitApplication();

    expect(success.requestExtension).toHaveBeenCalled();
    expect(success.afterApplication).toHaveBeenCalled();
    expect(success.close).toHaveBeenCalled();
    expect(success.component.canClose()).toBe(true);
  });

  it('does not throw when the comments panel is not on the page', () => {
    vi.useFakeTimers();
    const component = Object.create(ExtensionModalComponent.prototype) as {
      scrollCommentsDown(): void;
    };

    expect(() => {
      component.scrollCommentsDown();
      vi.runAllTimers();
    }).not.toThrow();

    vi.useRealTimers();
  });
});
