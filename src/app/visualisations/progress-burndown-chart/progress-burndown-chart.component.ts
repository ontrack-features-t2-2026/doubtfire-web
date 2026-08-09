import {Color, LegendPosition, ScaleType} from '@swimlane/ngx-charts';
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
import {
  PeerMedianPoint,
  PeerProgressService,
  Project,
  Unit,
} from 'src/app/api/models/doubtfire-model';
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

type PeerMedianState = 'loading' | 'ready' | 'unavailable' | 'insufficient';

/**
 * Fewest students the median may be drawn from. Below this a "middle student" is
 * identifiable enough that the comparison stops being anonymous. The endpoint has
 * to enforce this too; the check here only decides what to render.
 */
const MINIMUM_COHORT_SIZE = 5;

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
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Time';
  yAxisLabel: string = 'Tasks Remaining';
  legendPosition: LegendPosition = LegendPosition.Below;
  colorScheme: Color = {
    name: 'Burndown',
    selectable: true,
    group: ScaleType.Ordinal,
    // My progress, Peer median.
    domain: ['#E01B5D', '#0079d8'],
  };
  yScaleMin: number = 0;
  yScaleMax: number = 100;

  /** Drives the status note under the chart. Read by the template. */
  peerMedianState: PeerMedianState = 'loading';

  private seriesVisibility: Record<string, boolean> = {};
  private peerMedian: PeerMedianPoint[] = [];
  private myProgress: PeerMedianPoint[] = [];

  constructor(
    public viewContainerRef: ViewContainerRef,
    private peerProgressService: PeerProgressService,
  ) {
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
    this.loadPeerMedian();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('grade' in changes && changes.grade.currentValue !== undefined) {
      this.project.refreshBurndownChartData();
      this.updateData();
      // The cohort is the students on this target grade, so it moves with it.
      this.loadPeerMedian();
    }
  }

  private loadPeerMedian(): void {
    this.peerMedianState = 'loading';
    this.peerMedian = [];

    this.peerProgressService.getCohortMedian(this.project).subscribe({
      next: (response) => {
        if (response.cohort_size < MINIMUM_COHORT_SIZE) {
          // Withhold the line rather than identify the few students behind it.
          this.peerMedianState = 'insufficient';
        } else if (response.median_burndown.length === 0) {
          this.peerMedianState = 'unavailable';
        } else {
          this.peerMedian = response.median_burndown;
          this.peerMedianState = 'ready';
        }
        this.updateData();
      },
      error: () => {
        this.peerMedianState = 'unavailable';
        this.updateData();
      },
    });

    // Demo data. See PeerProgressService.getMyProgressMock -- the real source for
    // this line is the 'To Complete' series in this.project.burndownChartData.
    this.peerProgressService.getMyProgressMock(this.project).subscribe((points) => {
      this.myProgress = points;
      this.updateData();
    });
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

    const formattedData: BurndownSeries[] = [];

    if (this.myProgress.length > 0) {
      formattedData.push(this.toSeries('My progress', this.myProgress, startDate, endDate, locale));
    }

    if (this.peerMedian.length > 0) {
      formattedData.push(this.toSeries('Peer median', this.peerMedian, startDate, endDate, locale));
    }

    this.temp = JSON.parse(JSON.stringify(formattedData));
    this.data = formattedData;
  }

  private toSeries(
    name: string,
    points: PeerMedianPoint[],
    startDate: Date,
    endDate: Date,
    locale: string,
  ): BurndownSeries {
    return {
      name,
      series: points
        .filter((point) => {
          const time = new Date(point.date).getTime();
          return time >= startDate.getTime() && time <= endDate.getTime();
        })
        .map((point) => ({
          name: formatDate(new Date(point.date), 'd MMM', locale),
          value: Math.round(point.remaining * 100),
        })),
    };
  }

  onSelect(event: string | BurndownPoint): void {
    if (this.isLegend(event)) {
      const tempData = JSON.parse(JSON.stringify(this.data));
      if (this.isDataShown(event)) {
        tempData.forEach((series) => {
          if (series.name === event) {
            series.series.forEach((point) => (point.value = 0));
          }
        });
      } else {
        const originalSeries = this.temp.find((series) => series.name === event);
        const seriesIndex = tempData.findIndex((series) => series.name === event);
        if (seriesIndex >= 0) {
          tempData[seriesIndex] = JSON.parse(JSON.stringify(originalSeries));
        }
      }
      this.data = tempData;
    }
  }

  isLegend(event: string | BurndownPoint): event is string {
    return typeof event === 'string';
  }

  isDataShown(name: string): boolean {
    const series = this.data.find((series) => series.name === name);
    return series && series.series.some((point) => point.value !== 0);
  }

  public formatPerc(input: number) {
    return `${input}%`;
  }
}
