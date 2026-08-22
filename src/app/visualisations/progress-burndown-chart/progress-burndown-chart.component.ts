import {Color, ScaleType} from '@swimlane/ngx-charts';
import {formatDate} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  LOCALE_ID,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewContainerRef,
} from '@angular/core';
import {Project, Unit} from 'src/app/api/models/doubtfire-model';
import {AppInjector} from 'src/app/app-injector';
import {ChartBaseComponent} from 'src/app/common/chart-base/chart-base-component/chart-base-component.component';

interface BurndownPoint {
  name: string;
  value: number;
}

interface BurndownSeries {
  name: string;
  series: BurndownPoint[];
}

@Component({
  selector: 'f-progress-burndown-chart',
  templateUrl: './progress-burndown-chart.component.html',
  styleUrls: ['./progress-burndown-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ProgressBurndownChartComponent
  extends ChartBaseComponent
  implements OnChanges, OnInit
{
  @Input() project: Project;
  @Input() unit: Unit;
  @Input() grade: number;

  data: BurndownSeries[] = [];
  temp: BurndownSeries[] = [];

  // options
  legend: boolean = false;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Time';
  yAxisLabel: string = 'Tasks Remaining';
  colorScheme: Color = {
    name: 'Burndown',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#AAAAAA', '#777777', '#0079d8', '#E01B5D', 'transparent'],
  };
  yScaleMin: number = 0;
  yScaleMax: number = 100;

  private seriesVisibility: Record<string, boolean> = {};

  constructor(public viewContainerRef: ViewContainerRef) {
    super(viewContainerRef);
    this.data = [];
    this.temp = [];
  }

  ngOnInit(): void {
    this.project.refreshBurndownChartData();
    this.updateData();
    this.data.forEach((item) => {
      this.seriesVisibility[item.name] = true;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('grade' in changes && changes.grade.currentValue !== undefined) {
      this.project.refreshBurndownChartData();
      this.updateData();
    }
  }

  updateData(): void {
    const chartData = this.project?.burndownChartData;
    const locale: string = AppInjector.get(LOCALE_ID);
    const startDate: Date = this.project.unit.startDate;
    const endDate: Date = this.project.unit.endDate;

    if (!chartData) {
      this.data = [];
      return;
    }

    const formattedData = chartData.map((series) => ({
      name: series.key, // Use the "key" as the "name"
      series: series.values
        .filter((value) => value[0] >= startDate.getTime() && value[0] <= endDate.getTime()) // Filter values based on the date range
        .map((value) => {
          if (value[1] < 0) {
            value[1] = 0; // If the value is negative, set it to 0
          }
          value[1] = Math.round(value[1] * 100); // Round the value to 2 decimal places
          return {
            name: formatDate(new Date(value[0]), 'd MMM', locale), // Format the timestamp as a date
            value: value[1],
          };
        }),
    }));

    // Hack to get around yScaleMin and yScaleMax not working.
    const target = formattedData.find((series) => series.name === 'Target');
    if (target) {
      const start = target.series.find(
        (point) => point.name === formatDate(new Date(startDate), 'd MMM', locale),
      );
      const end = target.series.find(
        (point) => point.name === formatDate(new Date(endDate), 'd MMM', locale),
      );

      if (start) {
        start.value = 100;
      } // Update start
      if (end) {
        end.value = 0;
      } // Update end
    }

    this.temp = JSON.parse(JSON.stringify(formattedData));
    this.data = formattedData;
    this.seriesVisibility = Object.fromEntries(formattedData.map((series) => [series.name, true]));
  }

  onSelect(event: string | BurndownPoint): void {
    if (this.isLegend(event)) {
      this.toggleSeries(event);
    }
  }

  toggleSeries(name: string): void {
    if (!this.temp.some((series) => series.name === name)) {
      return;
    }

    this.seriesVisibility[name] = !this.isDataShown(name);
    this.data = this.temp.map((series) => ({
      name: series.name,
      series: series.series.map((point) => ({
        ...point,
        value: this.seriesVisibility[series.name] === false ? 0 : point.value,
      })),
    }));
  }

  isLegend(event: string | BurndownPoint): event is string {
    return typeof event === 'string';
  }

  isDataShown(name: string): boolean {
    return this.seriesVisibility[name] !== false;
  }

  seriesColor(index: number): string {
    return this.colorScheme.domain[index % this.colorScheme.domain.length] as string;
  }

  public formatPerc(input: number) {
    return `${input}%`;
  }
}
