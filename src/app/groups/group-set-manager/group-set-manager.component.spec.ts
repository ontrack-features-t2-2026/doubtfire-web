import {describe, expect, it} from 'vitest';
import {type Observable, Subject, of, throwError} from 'rxjs';
import {GroupSetManagerComponent} from './group-set-manager.component';

// updateGroup() saved the new name but never moved originalGroupName off the old value.
// newGroupSelected then rewrites selectedGroup.name = originalGroupName when you switch
// groups, so a successful rename silently reverted on screen. The next handler now
// refreshes the baseline.
type Bag = {
  groupService: {update: () => Observable<unknown>};
  alertService: {success: () => void; error: (m: string) => void};
  unit: {id: number; studentsForGroupTypeAhead: () => unknown[]};
  selectedGroup: {name: string; groupSet: {id: number}; id: number};
  originalGroupName: string;
};

function makeComponent(update: () => Observable<unknown>): {c: GroupSetManagerComponent; bag: Bag} {
  const c = Object.create(GroupSetManagerComponent.prototype) as GroupSetManagerComponent;
  const bag = c as unknown as Bag;
  bag.groupService = {update};
  bag.alertService = {success: () => {}, error: () => {}};
  bag.unit = {id: 1, studentsForGroupTypeAhead: () => []};
  return {c, bag};
}

describe('GroupSetManagerComponent.updateGroup', () => {
  it('refreshes the rename baseline after a successful save', () => {
    const {c, bag} = makeComponent(() => of({}));
    bag.selectedGroup = {name: 'New name', groupSet: {id: 3}, id: 7};
    bag.originalGroupName = 'Old name';

    c.updateGroup();

    expect(bag.originalGroupName).toBe('New name');
  });

  it('keeps the saved name when another group is then selected', () => {
    const {c, bag} = makeComponent(() => of({}));
    const renamed = {name: 'New name', groupSet: {id: 3}, id: 7};
    bag.selectedGroup = renamed;
    bag.originalGroupName = 'Old name';

    c.updateGroup();
    c.newGroupSelected({name: 'Other', projects: []} as never);

    expect(renamed.name).toBe('New name');
  });

  it('restores the name and reports a clear error when the save fails', () => {
    let message = '';
    const {c, bag} = makeComponent(() => throwError(() => 'boom'));
    bag.alertService = {success: () => {}, error: (m: string) => (message = m)};
    bag.selectedGroup = {name: 'Half typed', groupSet: {id: 3}, id: 7};
    bag.originalGroupName = 'Original';

    c.updateGroup();

    expect(bag.selectedGroup.name).toBe('Original');
    expect(message).toContain('Failed to update group');
  });

  it("does not clobber another group's baseline if the save resolves after switching", () => {
    const result: Subject<unknown> = new Subject();
    const {c, bag} = makeComponent(() => result.asObservable());
    const groupA = {name: 'A renamed', groupSet: {id: 3}, id: 7};
    bag.selectedGroup = groupA;
    bag.originalGroupName = 'A original';

    c.updateGroup(); // group A's save is now in flight
    c.newGroupSelected({name: 'B', projects: []} as never); // user switches to B first
    result.next({}); // group A's save resolves afterwards
    result.complete();

    // B's baseline must survive; A's late callback must not write over it.
    expect(bag.originalGroupName).toBe('B');
  });
});
