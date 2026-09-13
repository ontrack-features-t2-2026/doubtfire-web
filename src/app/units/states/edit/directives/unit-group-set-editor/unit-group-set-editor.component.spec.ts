import {describe, expect, it, vi} from 'vitest';
import {BehaviorSubject, throwError} from 'rxjs';
import {UnitGroupSetEditorComponent} from './unit-group-set-editor.component';

function groupSetEditor() {
  const groupSetService = {delete: vi.fn(), update: vi.fn()};
  const alerts = {success: vi.fn(), error: vi.fn()};
  const csvResultModal = {show: vi.fn()};
  const confirmationModal = {show: vi.fn()};
  const component = new UnitGroupSetEditorComponent(
    groupSetService as never,
    alerts as never,
    {} as never,
    csvResultModal as never,
    confirmationModal as never,
  );
  const unit = {refresh: vi.fn(), groupSets: [], groupSetsCache: {}};
  component.unit = unit as never;
  return {component, groupSetService, alerts, csvResultModal, confirmationModal, unit};
}

describe('UnitGroupSetEditorComponent', () => {
  it('asks before deleting a group set', () => {
    const {component, groupSetService, confirmationModal} = groupSetEditor();

    component.removeGroupSet({name: 'Labs'} as never);

    expect(groupSetService.delete).not.toHaveBeenCalled();
    expect(confirmationModal.show).toHaveBeenCalledWith(
      'Delete Labs',
      expect.any(String),
      expect.any(Function),
    );
  });

  it('reloads the unit after a CSV import adds groups, so they show', () => {
    const {component, unit, csvResultModal} = groupSetEditor();

    component.onGroupCSVSuccess({success: [{}] as never});

    expect(csvResultModal.show).toHaveBeenCalled();
    expect(unit.refresh).toHaveBeenCalled();
  });

  it('follows the open group set to its new object when the unit reloads', () => {
    const {component} = groupSetEditor();
    const labs = {id: 3, name: 'Labs'};
    const projects = {id: 4, name: 'Projects'};
    const groupSets: BehaviorSubject<object[]> = new BehaviorSubject([labs, projects]);
    component.unit = {groupSets: [labs, projects], groupSetsCache: {values: groupSets}} as never;
    component.ngOnInit();
    component.selectGroupSet(projects as never);

    const reloadedProjects = {id: 4, name: 'Projects'};
    groupSets.next([{id: 3, name: 'Labs'}, reloadedProjects]);

    expect(component.selectedGroupSet).toBe(reloadedProjects);
    component.ngOnDestroy();
  });

  it('puts the old values back when saving a group set fails', () => {
    const {component, groupSetService} = groupSetEditor();
    const groupSet = {
      id: 3,
      name: 'Labs',
      capacity: 4,
      allowStudentsToCreateGroups: true,
      allowStudentsToManageGroups: true,
      keepGroupsInSameClass: false,
    };
    groupSetService.update.mockReturnValue(throwError(() => 'Server said no'));

    component.startEditGroupSet(groupSet as never);
    component.editingGroupSetModel.name = 'Projects';
    component.editingGroupSetModel.capacity = 6;
    component.saveGroupSet(groupSet as never);

    expect(groupSet.name).toBe('Labs');
    expect(groupSet.capacity).toBe(4);
  });

  it('will not save a group set without a name', () => {
    const {component, groupSetService} = groupSetEditor();
    const groupSet = {id: 3, name: 'Labs'};

    component.startEditGroupSet(groupSet as never);
    component.editingGroupSetModel.name = '   ';
    component.saveGroupSet(groupSet as never);

    expect(component.canSaveGroupSet).toBe(false);
    expect(groupSetService.update).not.toHaveBeenCalled();
  });
});
