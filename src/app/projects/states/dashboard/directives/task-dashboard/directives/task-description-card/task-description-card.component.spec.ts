import {describe, expect, it} from 'vitest';
import {Task, TaskDefinition} from 'src/app/api/models/doubtfire-model';
import {TaskDescriptionCardComponent} from './task-description-card.component';

// The template guards the feedback deadline line on feedbackDate() and
// emphasises it with shouldShowDeadline(). Rendering the real template in a
// unit test is avoided here for the same reason the header spec blanks its
// own: the template calls a migration-shim global and pulls in DI-heavy
// children, and standing that up pollutes the shared vitest worker. Build a
// bare instance instead so the delegation those bindings rely on is locked in.
function bareCard(): TaskDescriptionCardComponent {
  return Object.create(TaskDescriptionCardComponent.prototype) as TaskDescriptionCardComponent;
}

describe('TaskDescriptionCardComponent', () => {
  const deadline = new Date('2026-09-01T00:00:00Z');

  it('feedbackDate reads the task deadline when a task is present', () => {
    const component = bareCard();
    component.task = {localDeadlineDate: () => deadline} as unknown as Task;

    expect(component.feedbackDate()).toBe(deadline);
  });

  it('feedbackDate falls back to the task definition deadline with no task', () => {
    const component = bareCard();
    component.task = undefined;
    component.taskDef = {localDeadlineDate: () => deadline} as unknown as TaskDefinition;

    expect(component.feedbackDate()).toBe(deadline);
  });

  it('feedbackDate is undefined when neither carries a deadline', () => {
    const component = bareCard();
    component.task = undefined;
    component.taskDef = undefined;

    expect(component.feedbackDate()).toBeUndefined();
  });

  it('shouldShowDeadline is true only within 14 days of the deadline', () => {
    const near = bareCard();
    near.task = {daysUntilDeadlineDate: () => 10} as unknown as Task;
    expect(near.shouldShowDeadline()).toBe(true);

    const far = bareCard();
    far.task = {daysUntilDeadlineDate: () => 21} as unknown as Task;
    expect(far.shouldShowDeadline()).toBe(false);
  });

  it('shouldShowDeadline is falsy with no task', () => {
    const component = bareCard();
    component.task = undefined;

    expect(component.shouldShowDeadline()).toBeFalsy();
  });
});
