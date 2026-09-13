import {describe, expect, it, vi} from 'vitest';
import {SimpleChange} from '@angular/core';
import {BehaviorSubject, of} from 'rxjs';
import {TaskDefinitionPrerequisitesComponent} from './task-definition-prerequisites.component';

function taskDefinition(id: number, abbreviation: string, targetGrade = 0) {
  return {id, abbreviation, name: `Task ${abbreviation}`, targetGrade};
}

function prerequisitesEditor() {
  const first = taskDefinition(1, '1.1P');
  const second = taskDefinition(2, '1.2P');
  const third = taskDefinition(3, '2.1P');
  // A link read from the cache before the linked task was filled in.
  const link = {id: 40, prerequisiteId: 2, taskDefinitionId: 3, prerequisite: undefined};
  const prerequisites = new BehaviorSubject([link]);
  const current = {
    ...third,
    unit: {
      id: 9,
      taskDefinitions: [first, second, third],
      taskDefinitionCache: {currentValues: [first, second, third]},
    },
    taskPrerequisitesCache: {currentValues: [link], values: prerequisites, delete: vi.fn()},
  };

  const alerts = {success: vi.fn(), error: vi.fn()};
  const taskPrerequisiteService = {
    query: vi.fn(() => of([])),
    delete: vi.fn(() => of(undefined)),
  };
  const component = new TaskDefinitionPrerequisitesComponent(
    {} as never,
    alerts as never,
    taskPrerequisiteService as never,
  );
  component.staffView = true;
  component.taskDefinition = current as never;
  component.ngOnChanges({taskDefinition: new SimpleChange(undefined, current, true)});
  component.ngOnInit();

  return {component, alerts, taskPrerequisiteService, link, current};
}

describe('TaskDefinitionPrerequisitesComponent', () => {
  it('offers the tasks that are not linked yet, even before the links are filled in', () => {
    const {component} = prerequisitesEditor();

    expect(component.filteredTaskDefs.map((td) => td.abbreviation)).toEqual(['1.1P']);
    component.ngOnDestroy();
  });

  it('reports a removed prerequisite as a success', () => {
    const {component, alerts, taskPrerequisiteService, link, current} = prerequisitesEditor();

    component.removePrerequisite(link as never);

    expect(taskPrerequisiteService.delete).toHaveBeenCalledWith(
      {unitId: 9, taskDefId: 3, prerequisiteId: 2},
      expect.anything(),
    );
    expect(current.taskPrerequisitesCache.delete).toHaveBeenCalledWith(40);
    expect(alerts.success).toHaveBeenCalled();
    expect(alerts.error).not.toHaveBeenCalled();
    component.ngOnDestroy();
  });

  it('forgets a picked task once the search text changes again', () => {
    const {component, current} = prerequisitesEditor();

    component.searchCtrl.setValue(current.unit.taskDefinitionCache.currentValues[0] as never);
    component.selectedTaskPrerequisite = current.unit.taskDefinitionCache.currentValues[0] as never;
    component.searchCtrl.setValue('2.');

    expect(component.selectedTaskPrerequisite).toBeNull();
    component.ngOnDestroy();
  });
});
