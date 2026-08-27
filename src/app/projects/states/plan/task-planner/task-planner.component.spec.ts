import {describe, expect, it} from 'vitest';
import {Project, TaskDefinition} from 'src/app/api/models/doubtfire-model';
import {TaskPlannerComponent} from './task-planner.component';

const taskDefinition = (id: number, targetGrade: number): TaskDefinition =>
  ({
    id,
    targetGrade,
    startDate: new Date(2026, 0, id),
  }) as TaskDefinition;

describe('TaskPlannerComponent target-grade filtering', () => {
  it('shows tasks beyond the target grade only when the student opts in', () => {
    const passTask = taskDefinition(1, 0);
    const creditTask = taskDefinition(2, 1);
    const component = Object.create(TaskPlannerComponent.prototype) as TaskPlannerComponent;
    component.project = {
      unit: {taskDefinitions: [passTask, creditTask]},
      findTaskForDefinition: () => null,
    } as unknown as Project;
    component.targetGrade = 0;
    component.showTasksAboveTargetGrade = false;

    expect(component.taskDefs()).toEqual([passTask]);

    component.showTasksAboveTargetGrade = true;

    expect(component.taskDefs()).toEqual([passTask, creditTask]);
  });

  it('reveals an above-target task requested by a direct planner link', () => {
    const passTask = taskDefinition(1, 0);
    const creditTask = taskDefinition(2, 1);
    const component = Object.create(TaskPlannerComponent.prototype) as TaskPlannerComponent;
    component.project = {
      id: 15,
      unit: {taskDefinitions: [passTask, creditTask]},
      findTaskForDefinition: () => null,
    } as unknown as Project;
    component.targetGrade = 0;
    component.showTasksAboveTargetGrade = false;

    const plannerInternals = component as unknown as {
      revealRequestedTaskDefinition(taskDefinitionId: string | null): void;
    };
    plannerInternals.revealRequestedTaskDefinition('2');

    expect(component.showTasksAboveTargetGrade).toBe(true);
    expect(component.taskDefs()).toEqual([passTask, creditTask]);
  });
});
