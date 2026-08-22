import {describe, expect, it, vi} from 'vitest';
import {SimpleChange} from '@angular/core';
import {Project} from 'src/app/api/models/doubtfire-model';
import {ProgressBurndownChartComponent} from './progress-burndown-chart.component';

describe('ProgressBurndownChartComponent route reuse', () => {
  it('refreshes chart data for a different project at the same grade', () => {
    const previousProject = {id: 2} as Project;
    const refreshBurndownChartData = vi.fn();
    const nextProject = {id: 18, refreshBurndownChartData} as unknown as Project;
    const component = Object.create(
      ProgressBurndownChartComponent.prototype,
    ) as ProgressBurndownChartComponent;
    component.project = nextProject;
    component.grade = 0;
    const updateData = vi.spyOn(component, 'updateData').mockImplementation(() => undefined);

    component.ngOnChanges({project: new SimpleChange(previousProject, nextProject, false)});

    expect(refreshBurndownChartData).toHaveBeenCalled();
    expect(updateData).toHaveBeenCalled();
  });
});
