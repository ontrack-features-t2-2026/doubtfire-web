import {describe, expect, it} from 'vitest';
import {SimpleChange} from '@angular/core';
import {Project} from 'src/app/api/models/doubtfire-model';
import {TaskVisualisationComponent} from './task-visualisation.component';

describe('TaskVisualisationComponent route reuse', () => {
  it('updates counts for a different project at the same grade', () => {
    const firstProject = {
      id: 2,
      activeTasks: () => [{status: 'complete'}],
    } as unknown as Project;
    const nextProject = {
      id: 18,
      activeTasks: () => [{status: 'ready_for_feedback'}],
    } as unknown as Project;
    const component = new TaskVisualisationComponent();
    component.project = firstProject;
    component.grade = 0;
    component.ngOnInit();

    component.project = nextProject;
    component.ngOnChanges({project: new SimpleChange(firstProject, nextProject, false)});

    expect(component.data.find(({name}) => name === 'Awaiting Feedback')?.value).toBe(1);
    expect(component.data.find(({name}) => name === 'Complete')?.value).toBe(0);
  });
});
