import {Component, OnInit} from '@angular/core';
import {GlobalStateService} from 'src/app/projects/states/index/global-state.service';
import {Project} from '../api/models/project';
import {TaskStatus, TaskStatusEnum} from '../api/models/task-status';
import {DashboardTask} from './dashboard-list-item.component';
import {Task} from '../api/models/task';

enum Filter {
  HideCompleted = 'Hide Completed',
}

enum SortMode {
  Recommended = 'Recommended',
  SubmissionDate = 'Due Date',
  Default = 'Default',
}

const completedTypes: readonly TaskStatusEnum[] = ['complete'];

type DashboardUnit = {
  projectId: number;
  code: string;
  name: string;
  tasks: DashboardTask[];
};

@Component({
  selector: 'f-cross-dashboard',
  templateUrl: './f-cross-dashboard.component.html',
})
export class CrossDashboardComponent implements OnInit {
  constructor(private globalStateService: GlobalStateService) {}

  filterOptions = Object.values(Filter);
  sortOptions = Object.values(SortMode);

  private units: DashboardUnit[] = [];
  unitsProcessed: DashboardUnit[] = [];

  private filters = new Map<number, Filter[]>();
  private sorting = new Map<number, SortMode>();

  ngOnInit(): void {
    this.globalStateService.onLoad(() => {
      this.globalStateService.currentUserProjects.values.subscribe((projects) => {
        this.units = this.mapProjects(projects);
        this.processTasks();
      });
    });
  }

  unitIdentify(_index: number, item: DashboardUnit) {
    return item.projectId;
  }

  setSort(project: number, mode: SortMode) {
    this.sorting.set(project, mode);
    this.processTasks();
  }

  toggleFilter(project: number, filter: Filter) {
    let filters = this.filters.get(project) ?? [];
    if (filters.includes(filter)) {
      filters = filters.filter((f) => f != filter);
    } else {
      filters = [...filters, filter];
    }
    this.filters.set(project, filters);
    this.processTasks();
  }

  private processTasks() {
    this.unitsProcessed = this.units.map((unit) => ({
      ...unit,
      tasks: unit.tasks
        .filter((task) => {
          const filters = this.filters.get(unit.projectId) ?? [];
          if (filters.includes(Filter.HideCompleted) && completedTypes.includes(task.status)) {
            return false;
          } else {
            return true;
          }
        })
        .sort((a, b) => {
          const sort = this.sorting.get(unit.projectId) ?? 'recommended';
          if (completedTypes.includes(a.status) && !completedTypes.includes(b.status)) {
            return -1;
          } else if (!completedTypes.includes(a.status) && completedTypes.includes(b.status)) {
            return 1;
          }
          switch (sort) {
            case SortMode.Recommended: {
              // TODO: Connect to recommender's points
              return 0;
            }
            case SortMode.SubmissionDate:
              return a.date.getTime() - b.date.getTime();
            case SortMode.Default:
              return a.weight - b.weight;
          }
        }),
    }));
  }

  private mapProjects(projects: readonly Project[]): DashboardUnit[] {
    return projects.map((project) => {
      project.calcTopTasks();
      const unit = project.unit;
      return {
        projectId: project.id,
        code: unit.code,
        name: unit.name,
        tasks: this.mapTasks(project.activeTasks()),
      };
    });
  }

  private mapTasks(tasks: readonly Task[]): DashboardTask[] {
    return tasks.map((task) => {
      const def = task.definition;
      return {
        title: def.name,
        subtitle: `${def.abbreviation} - ${def.targetGradeText} Task`,
        abbreviation: def.abbreviation,
        color: TaskStatus.STATUS_COLORS.get(task.status),
        comments: task.numNewComments ?? 0,
        status: task.status,
        date: def.targetDate,
        weight: task.topWeight,
      };
    });
  }
}
