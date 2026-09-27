import {describe, expect, it, vi} from 'vitest';
import {of} from 'rxjs';
import {Task} from 'src/app/api/models/task';
import {UploadSubmissionModalComponent} from './upload-submission-modal.component';
import {UploadSubmissionModalService} from './upload-submission-modal.service';

describe('UploadSubmissionModalService', () => {
  it('uses responsive geometry and a dirty-aware close predicate', () => {
    const open = vi.fn().mockReturnValue({afterClosed: () => of({value: {}})});
    const service = new UploadSubmissionModalService({open} as never, {error: vi.fn()} as never);
    const task = {
      isGroupTask: () => false,
      definition: {groupSet: {name: 'Team'}},
    } as unknown as Task;

    service.show(task, false);

    const config = open.mock.calls[0][1];
    expect(config.disableClose).toBe(false);
    expect(config.closeOnNavigation).toBe(true);
    expect(config.restoreFocus).toBe(true);
    expect(config.maxHeight).toContain('100dvh');
    expect(config.position).toBeUndefined();
    expect(
      config.closePredicate(undefined, undefined, {
        canClose: () => false,
      } as UploadSubmissionModalComponent),
    ).toBe(false);
  });
});
