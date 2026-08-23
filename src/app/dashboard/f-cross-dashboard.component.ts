import {EntityCache} from 'ngx-entity-service';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {GlobalStateService} from 'src/app/projects/states/index/global-state.service';
import {Project} from '../api/models/project';
import {Task} from '../api/models/task';
import {TaskStatus, TaskStatusEnum} from '../api/models/task-status';
import {ProjectService} from '../api/services/project.service';
import {
  TaskRecommendation,
  TaskRecommendationService,
} from '../api/services/task-recommendation.service';
import {DashboardTask} from './list-item/dashboard-list-item.component';

type UnitScope = 'active' | 'previous' | 'all';

enum Filter {
  HideCompleted = 'Hide Completed',
}

enum SortMode {
  Recommended = 'Recommended',
  SubmissionDate = 'Due Date',
  Default = 'Default',
}

const completedTypes: readonly TaskStatusEnum[] = ['complete'];

const displayedDueDateFormatter = new Intl.DateTimeFormat('en-AU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

type DashboardUnit = {
  projectId: number;
  code: string;
  name: string;
  tasks: DashboardTask[];
  isPrevious: boolean;
};

@Component({
  selector: 'f-cross-dashboard',
  templateUrl: './f-cross-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class CrossDashboardComponent implements OnInit {
  activeUnits: DashboardUnit[] = [];
  previousUnits: DashboardUnit[] = [];

  unitScope: UnitScope = 'active';

  startDate = '';
  endDate = '';

  previousUnitsLoaded = false;
  loadingPreviousUnits = false;
  previousUnitsLoadError = false;

  filterOptions = Object.values(Filter);
  sortOptions = Object.values(SortMode);
  unitsProcessed: DashboardUnit[] = [];

  private readonly previousProjectsCache: EntityCache<Project> = new EntityCache();
  private filters: Map<number, Filter[]> = new Map();
  private sorting: Map<number, SortMode> = new Map();
  private searchTerms: Map<number, string> = new Map();
  private recommendationScores: Map<number, number> = new Map();

  constructor(
    private globalStateService: GlobalStateService,
    private projectService: ProjectService,
    private taskRecommendationService: TaskRecommendationService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.globalStateService.onLoad(() => {
      this.taskRecommendationService.getAll().subscribe({
        next: (recommendations) => {
          this.setRecommendationScores(recommendations);
          this.processTasks();
        },
        error: () => {
          this.recommendationScores.clear();
          this.processTasks();
        },
      });

      this.globalStateService.currentUserProjects.values.subscribe((projects) => {
        const activeProjects = projects.filter((project) => project.unit.isActive);
        this.activeUnits = this.mapProjects(activeProjects);
        this.processTasks();
      });
    });
  }

  get displayedUnits(): DashboardUnit[] {
    return this.unitsProcessed;
  }

  get isDateRangeInvalid(): boolean {
    return !!this.startDate && !!this.endDate && this.startDate > this.endDate;
  }

  get isDateFilterActive(): boolean {
    return !this.isDateRangeInvalid && (!!this.startDate || !!this.endDate);
  }

  setUnitScope(scope: UnitScope): void {
    this.unitScope = scope;
    this.processTasks();

    const needsPreviousUnits = scope === 'previous' || scope === 'all';

    if (needsPreviousUnits && !this.previousUnitsLoaded && !this.loadingPreviousUnits) {
      this.loadPreviousUnits();
    }
  }

  setStartDate(value: string): void {
    this.startDate = value;
    this.processTasks();
  }

  setEndDate(value: string): void {
    this.endDate = value;
    this.processTasks();
  }

  clearDateRange(): void {
    this.startDate = '';
    this.endDate = '';
    this.processTasks();
  }

  setSort(project: number, mode: SortMode): void {
    this.sorting.set(project, mode);
    this.processTasks();
  }

  toggleFilter(project: number, filter: Filter): void {
    let filters = this.filters.get(project) ?? [];
    if (filters.includes(filter)) {
      filters = filters.filter((currentFilter) => currentFilter !== filter);
    } else {
      filters = [...filters, filter];
    }
    this.filters.set(project, filters);
    this.processTasks();
  }

  isFilterEnabled(project: number, filter: Filter): boolean {
    return this.filters.get(project)?.includes(filter) === true;
  }

  setSearch(project: number, value: string): void {
    this.searchTerms.set(project, value ?? '');
    this.processTasks();
  }

  getSearchTerm(project: number): string {
    return this.searchTerms.get(project) ?? '';
  }

  hasSearchTerm(project: number): boolean {
    return this.normaliseSearchText(this.getSearchTerm(project)).length > 0;
  }

  hasActiveTaskCriteria(project: number): boolean {
    return (
      this.isDateFilterActive ||
      this.hasSearchTerm(project) ||
      (this.filters.get(project)?.length ?? 0) > 0
    );
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
          this.processTasks();

          this.changeDetectorRef.detectChanges();
        },
        error: () => {
          this.previousUnitsLoadError = true;
          this.loadingPreviousUnits = false;
          this.processTasks();

          this.changeDetectorRef.detectChanges();
        },
      });
  }

  private processTasks(): void {
    const units = this.getUnitsForCurrentScope();

    this.unitsProcessed = units.map((unit) => ({
      ...unit,
      tasks: unit.tasks
        .filter((task) => {
          const filters = this.filters.get(unit.projectId) ?? [];
          const isHiddenCompletedTask =
            filters.includes(Filter.HideCompleted) && completedTypes.includes(task.status);

          return (
            !isHiddenCompletedTask &&
            this.taskMatchesDateRange(task) &&
            this.taskMatchesSearch(task, unit.projectId)
          );
        })
        .sort((a, b) => {
          const sort = this.sorting.get(unit.projectId) ?? SortMode.Recommended;

          if (completedTypes.includes(a.status) && !completedTypes.includes(b.status)) {
            return 1;
          }

          if (!completedTypes.includes(a.status) && completedTypes.includes(b.status)) {
            return -1;
          }

          switch (sort) {
            case SortMode.Recommended:
              return this.compareRecommendations(a, b);
            case SortMode.SubmissionDate:
              return this.compareDueDates(a.dueDate, b.dueDate);
            case SortMode.Default:
              return a.weight - b.weight;
          }

          return 0;
        }),
    }));

    this.changeDetectorRef.markForCheck();
  }

  private setRecommendationScores(recommendations: readonly TaskRecommendation[]): void {
    this.recommendationScores = new Map(
      recommendations
        .filter((recommendation) => Number.isFinite(recommendation.priority_score))
        .map((recommendation) => [recommendation.task_id, recommendation.priority_score]),
    );
  }

  private compareRecommendations(first: DashboardTask, second: DashboardTask): number {
    const firstScore = this.recommendationScores.get(first.id);
    const secondScore = this.recommendationScores.get(second.id);

    if (firstScore !== undefined && secondScore !== undefined) {
      return secondScore - firstScore || first.weight - second.weight;
    }

    if (firstScore !== undefined) {
      return -1;
    }

    if (secondScore !== undefined) {
      return 1;
    }

    return first.weight - second.weight;
  }

  private taskMatchesDateRange(task: DashboardTask): boolean {
    if (!this.isDateFilterActive) {
      return true;
    }

    const taskDate = this.formatDateAsIso(task.dueDate);

    if (!taskDate) {
      return false;
    }

    if (this.startDate && taskDate < this.startDate) {
      return false;
    }

    if (this.endDate && taskDate > this.endDate) {
      return false;
    }

    return true;
  }

  private compareDueDates(
    firstDate: Date | null | undefined,
    secondDate: Date | null | undefined,
  ): number {
    const firstTime =
      firstDate instanceof Date && !Number.isNaN(firstDate.getTime()) ? firstDate.getTime() : null;

    const secondTime =
      secondDate instanceof Date && !Number.isNaN(secondDate.getTime())
        ? secondDate.getTime()
        : null;

    if (firstTime === null && secondTime === null) {
      return 0;
    }

    if (firstTime === null) {
      return 1;
    }

    if (secondTime === null) {
      return -1;
    }

    return firstTime - secondTime;
  }

  private taskMatchesSearch(task: DashboardTask, projectId: number): boolean {
    const rawSearchTerm = this.getSearchTerm(projectId);
    const searchTerm = this.normaliseSearchText(rawSearchTerm);

    if (!searchTerm) {
      return true;
    }

    const {numericDates, remainingText} = this.extractNumericDateSearches(rawSearchTerm);
    const taskDate = this.formatDateAsIso(task.dueDate);

    if (numericDates.some((date) => date !== taskDate)) {
      return false;
    }

    const remainingSearchTerm = this.normaliseSearchText(remainingText);

    if (!remainingSearchTerm) {
      return numericDates.length > 0;
    }

    const searchableText = this.normaliseSearchText(
      [
        task.title,
        task.subtitle,
        task.description,
        task.abbreviation,
        task.statusLabel,
        task.unitCode,
        this.formatDateForSearch(task.dueDate),
      ].join(' '),
    );

    return remainingSearchTerm.split(' ').every((term) => searchableText.includes(term));
  }

  private extractNumericDateSearches(value: string): {
    numericDates: string[];
    remainingText: string;
  } {
    const numericDates: string[] = [];
    let remainingText = value;

    remainingText = remainingText.replace(
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g,
      (_match: string, year: string, month: string, day: string) => {
        numericDates.push(this.normaliseNumericDate(year, month, day));
        return ' ';
      },
    );

    remainingText = remainingText.replace(
      /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
      (_match: string, day: string, month: string, year: string) => {
        numericDates.push(this.normaliseNumericDate(year, month, day));
        return ' ';
      },
    );

    return {numericDates, remainingText};
  }

  private normaliseNumericDate(year: string, month: string, day: string): string {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  private normaliseSearchText(value: string): string {
    return value
      .toLocaleLowerCase('en-AU')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }

  private formatDateAsIso(date: Date | null | undefined): string {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return '';
    }

    return this.normaliseNumericDate(
      String(date.getFullYear()),
      String(date.getMonth() + 1),
      String(date.getDate()),
    );
  }

  private formatDateForSearch(date: Date): string {
    const isoDate = this.formatDateAsIso(date);

    if (!isoDate) {
      return '';
    }

    const [year, month, day] = isoDate.split('-');

    return [displayedDueDateFormatter.format(date), `${day}/${month}/${year}`, isoDate].join(' ');
  }

  private getUnitsForCurrentScope(): DashboardUnit[] {
    if (this.unitScope === 'previous') {
      return this.previousUnits;
    }

    if (this.unitScope === 'all') {
      return [...this.activeUnits, ...this.previousUnits];
    }

    return this.activeUnits;
  }

  private mapProjects(projects: readonly Project[]): DashboardUnit[] {
    return projects.map((project) => {
      project.calcTopTasks();
      const unit = project.unit;

      return {
        projectId: project.id,
        code: unit.code,
        name: unit.name,
        tasks: this.mapTasks(project.activeTasks(), project.id, unit.code),
        isPrevious: !unit.isActive,
      };
    });
  }

  private mapTasks(tasks: readonly Task[], projectId: number, unitCode: string): DashboardTask[] {
    return tasks.map((task) => {
      const def = task.definition;

      return {
        id: task.id,
        title: def.name,
        subtitle: `${def.abbreviation} - ${def.targetGradeText} Task`,
        statusLabel: TaskStatus.STATUS_LABELS.get(task.status),
        abbreviation: def.abbreviation,
        color: TaskStatus.STATUS_COLORS.get(task.status),
        comments: task.numNewComments ?? 0,
        status: task.status,
        weight: task.topWeight,
        projectId,
        description: def.description,
        taskDef: def,
        unitCode,
        dueDate: def.targetDate,
      };
    });
  }
}
