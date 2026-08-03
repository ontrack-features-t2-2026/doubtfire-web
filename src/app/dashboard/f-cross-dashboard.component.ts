import {EntityCache} from 'ngx-entity-service';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {GlobalStateService} from 'src/app/projects/states/index/global-state.service';
import {Project} from '../api/models/project';
import {Task} from '../api/models/task';
import {TaskDefinition} from '../api/models/task-definition';
import {TaskStatus} from '../api/models/task-status';
import {ProjectService} from '../api/services/project.service';
import {DashboardTask} from './list-item/dashboard-list-item.component';

type UnitScope = 'active' | 'previous' | 'all';

type DashboardUnit = {
  projectId: number;
  code: string;
  name: string;
  tasks: DashboardTask[];
  isPrevious: boolean;
};

@Component({
  selector: 'f-cross-dashboard',
  standalone: false,
  templateUrl: './f-cross-dashboard.component.html',
})
export class CrossDashboardComponent implements OnInit {
  activeUnits: DashboardUnit[] = [];
  previousUnits: DashboardUnit[] = [];

  unitScope: UnitScope = 'active';

  previousUnitsLoaded = false;
  loadingPreviousUnits = false;
  previousUnitsLoadError = false;

  private readonly previousProjectsCache: EntityCache<Project> = new EntityCache();

  constructor(
    private globalStateService: GlobalStateService,
    private projectService: ProjectService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.globalStateService.onLoad(() => {
      this.globalStateService.currentUserProjects.values.subscribe((projects) => {
        const activeProjects = projects.filter((project) => project.unit.isActive);
        this.activeUnits = this.mapProjects(activeProjects);
      });
    });
  }

  get displayedUnits(): DashboardUnit[] {
    if (this.unitScope === 'previous') {
      return this.previousUnits;
    }

    if (this.unitScope === 'all') {
      return [...this.activeUnits, ...this.previousUnits];
    }

    return this.activeUnits;
  }

  setUnitScope(scope: UnitScope): void {
    this.unitScope = scope;

    const needsPreviousUnits = scope === 'previous' || scope === 'all';

    if (needsPreviousUnits && !this.previousUnitsLoaded && !this.loadingPreviousUnits) {
      this.loadPreviousUnits();
    }
  }

  private loadPreviousUnits(): void {
    this.loadingPreviousUnits = true;
    this.previousUnitsLoadError = false;

    this.projectService
      .query(undefined, {
        cache: this.previousProjectsCache,
        params: {
          include_inactive: true,
          include_task_definitions: true,
        },
      })
      .subscribe({
        next: (projects: Project[]) => {
          const previousProjects = projects.filter((project) => !project.unit.isActive);

          this.previousUnits = this.mapProjects(previousProjects);
          this.previousUnitsLoaded = true;
          this.loadingPreviousUnits = false;

          this.changeDetectorRef.detectChanges();
        },
        error: () => {
          this.previousUnitsLoadError = true;
          this.loadingPreviousUnits = false;

          this.changeDetectorRef.detectChanges();
        },
      });
  }

  mapProjects(projects: readonly Project[]): DashboardUnit[] {
    return projects.map((project) => {
      const unit = project.unit;

      return {
        projectId: project.id,
        code: unit.code,
        name: unit.name,
        tasks: this.mapTasks(project.tasks, unit.taskDefinitions, project.id, unit.code),
        isPrevious: !unit.isActive,
      };
    });
  }

  mapTasks(
    tasks: readonly Task[],
    taskDefs: readonly TaskDefinition[],
    projectId: number,
    unitCode: string,
  ): DashboardTask[] {
    return taskDefs.map((def) => {
      const task = tasks.find((t) => t.taskDefId == def.id);

      return {
        title: def.name,
        subtitle: `${def.abbreviation} - ${def.targetGradeText} Task`,
        abbreviation: def.abbreviation,
        color: TaskStatus.STATUS_COLORS.get(task?.status ?? 'not_started'),
        comments: task?.numNewComments ?? 0,
        projectId: projectId,
        statusLabel: TaskStatus.STATUS_LABELS.get(task?.status ?? 'not_started'),
        description: def.description,
        unitCode: unitCode,
        dueDate: def.targetDate,
        taskDef: def,
      };
    });
  }
}
