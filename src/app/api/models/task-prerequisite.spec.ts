import {describe, expect, it, vi} from 'vitest';
import {Project} from './project';
import {TaskDefinition} from './task-definition';
import {TaskPrerequisite} from './task-prerequisite';

describe('TaskPrerequisite', () => {
  it('treats rediscuss as satisfying a discussion-level prerequisite', () => {
    const project = {} as Project;
    const prerequisiteDefinition = {
      projectTask: vi.fn().mockReturnValue({status: 'rediscuss'}),
    } as unknown as TaskDefinition;
    const prerequisite = new TaskPrerequisite({
      taskDefinitionId: 2,
      prerequisiteId: 1,
      taskStatus: 'discuss',
    });
    prerequisite.prerequisite = prerequisiteDefinition;

    expect(prerequisite.STATES.rediscuss).toBe(prerequisite.STATES.discuss);
    expect(prerequisite.hasMetRequiredState(project)).toBe(true);
  });

  it('does not treat attention required as satisfying a prerequisite', () => {
    const project = {} as Project;
    const prerequisiteDefinition = {
      projectTask: vi.fn().mockReturnValue({status: 'attention_required'}),
    } as unknown as TaskDefinition;
    const prerequisite = new TaskPrerequisite({
      taskDefinitionId: 2,
      prerequisiteId: 1,
      taskStatus: 'attention_required',
    });
    prerequisite.prerequisite = prerequisiteDefinition;

    expect(prerequisite.hasMetRequiredState(project)).toBe(false);
  });
});
