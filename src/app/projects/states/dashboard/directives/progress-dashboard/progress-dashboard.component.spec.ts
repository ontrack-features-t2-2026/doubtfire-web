import {describe, expect, it, vi} from 'vitest';
import {SimpleChange} from '@angular/core';
import {Project} from 'src/app/api/models/project';
import {ProjectService} from 'src/app/api/services/project.service';
import {UserService} from 'src/app/api/services/user.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {GradeService} from 'src/app/common/services/grade.service';
import {ProgressDashboardComponent} from './progress-dashboard.component';

describe('ProgressDashboardComponent route reuse', () => {
  it('refreshes summary data when the active project changes', () => {
    const gradeValuesFor = vi.fn(() => [0]);
    const component = new ProgressDashboardComponent(
      {
        grades: {0: 'Pass'},
        gradeValues: [0],
        gradeValuesFor,
      } as unknown as GradeService,
      {} as ProjectService,
      {} as AlertService,
      {} as UserService,
    );
    const firstProject = {
      id: 2,
      targetGrade: 0,
      unit: {gradeDefinitions: [{value: 0, label: 'Pass'}]},
      numberTasks: vi.fn(() => 1),
      activeTasks: vi.fn(() => [{}, {}, {}]),
      refreshBurndownChartData: vi.fn(),
    } as unknown as Project;
    const nextProject = {
      id: 18,
      targetGrade: 0,
      unit: {gradeDefinitions: [{value: 0, label: 'Pass'}]},
      numberTasks: vi.fn(() => 2),
      activeTasks: vi.fn(() => [{}, {}, {}, {}]),
      refreshBurndownChartData: vi.fn(),
    } as unknown as Project;
    component.project = firstProject;
    component.ngOnInit();
    vi.clearAllMocks();

    component.project = nextProject;
    component.ngOnChanges({project: new SimpleChange(firstProject, nextProject, false)});

    expect(gradeValuesFor).toHaveBeenCalledWith(nextProject.unit);
    expect(component.numberOfTasks).toEqual({completed: 2, remaining: 2});
    expect(nextProject.refreshBurndownChartData).toHaveBeenCalled();
  });
});
