import {describe, expect, it} from 'vitest';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';
import {GroupSet, Project} from 'src/app/api/models/doubtfire-model';
import {ProjectGroupsStateComponent} from './project-groups-state.component';

describe('ProjectGroupsStateComponent group-set selection', () => {
  const route = {parent: {snapshot: {data: {}}}} as unknown as ActivatedRoute;

  it("selects the student's real group set before an empty first set", () => {
    const empty = {id: 1, groups: []} as unknown as GroupSet;
    const enrolled = {id: 2, groups: [{id: 20}]} as unknown as GroupSet;
    const project = {
      unit: {groupSets: [empty, enrolled]},
      groups: [{groupSet: enrolled}],
    } as unknown as Project;
    const component = new ProjectGroupsStateComponent(route);
    component.project$ = of(project);

    component.ngOnInit();

    expect(component.selectedGroupSet).toBe(enrolled);
  });

  it('falls back to the first non-empty configured set when the student has no group', () => {
    const empty = {id: 1, groups: []} as unknown as GroupSet;
    const published = {id: 2, groups: [{id: 20}]} as unknown as GroupSet;
    const project = {
      unit: {groupSets: [empty, published]},
      groups: [],
    } as unknown as Project;
    const component = new ProjectGroupsStateComponent(route);
    component.project$ = of(project);

    component.ngOnInit();

    expect(component.selectedGroupSet).toBe(published);
  });
});
