import {beforeEach, describe, expect, it, vi} from 'vitest';
import '@angular/compiler';
import {of, throwError} from 'rxjs';
import {Group, Unit} from 'src/app/api/models/doubtfire-model';
import {GroupService} from 'src/app/api/services/group.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {GroupSetManagerComponent} from './group-set-manager.component';

describe('GroupSetManagerComponent', () => {
  let component: GroupSetManagerComponent;

  let update: ReturnType<typeof vi.fn>;
  let success: ReturnType<typeof vi.fn>;
  let error: ReturnType<typeof vi.fn>;

  let firstGroup: Group;
  let secondGroup: Group;

  beforeEach(() => {
    update = vi.fn();
    success = vi.fn();
    error = vi.fn();

    component = new GroupSetManagerComponent(
      {update} as unknown as GroupService,
      {success, error} as unknown as AlertService,
    );

    component.unit = {
      id: 1,
      studentsForGroupTypeAhead: vi.fn().mockReturnValue([]),
    } as unknown as Unit;

    const groupSet = {id: 10};

    firstGroup = {
      id: 100,
      name: 'Team 1',
      groupSet,
      projects: [],
    } as unknown as Group;

    secondGroup = {
      id: 101,
      name: 'Team 2',
      groupSet,
      projects: [],
    } as unknown as Group;

    component.selectedGroup = firstGroup;
  });

  it('keeps the successfully saved group name when another group is selected', () => {
    update.mockReturnValue(of({}));

    component.startEditingGroupName();
    firstGroup.name = 'Alpha';

    component.updateGroup();
    component.newGroupSelected(secondGroup);

    expect(firstGroup.name).toBe('Alpha');
    expect(component.selectedGroup).toBe(secondGroup);
    expect(success).toHaveBeenCalledWith('Successfully updated group', 3000);
  });

  it('restores the original group name when the update fails', () => {
    update.mockReturnValue(throwError(() => 'network error'));

    component.startEditingGroupName();
    firstGroup.name = 'Alpha';

    component.updateGroup();

    expect(firstGroup.name).toBe('Team 1');
    expect(error).toHaveBeenCalledWith('Failed to update group: network error', 6000);
  });
});
