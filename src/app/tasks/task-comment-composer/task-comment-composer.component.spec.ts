import {describe, expect, it, vi} from 'vitest';
import {of} from 'rxjs';
import {TaskCommentComposerComponent} from './task-comment-composer.component';

// Method-level test on a bare instance. The composer's constructor wires up a
// KeyValueDiffer and session storage, so we drive addCommentWithType directly
// with stubbed collaborators.
describe('TaskCommentComposerComponent addCommentWithType', () => {
  it('clears the draft and posts without placeholder debug logging', () => {
    const component = Object.create(TaskCommentComposerComponent.prototype) as {
      taskCommentService: {addComment: ReturnType<typeof vi.fn>};
      task: unknown;
      comment: {text: string; type: string};
      commentsViewer: {scrollDown: ReturnType<typeof vi.fn>};
      alerts: {error: ReturnType<typeof vi.fn>};
      addCommentWithType(comment: string, type: string): void;
    };
    component.taskCommentService = {addComment: vi.fn(() => of({}))};
    component.task = {};
    component.comment = {text: 'hello', type: 'text'};
    component.commentsViewer = {scrollDown: vi.fn()};
    component.alerts = {error: vi.fn()};
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    component.addCommentWithType('hello', 'text');

    expect(logSpy).not.toHaveBeenCalled();
    expect(component.comment.text).toBe('');
    expect(component.commentsViewer.scrollDown).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
