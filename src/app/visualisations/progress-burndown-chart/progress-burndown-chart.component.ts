import {Color, LegendPosition, ScaleType} from '@swimlane/ngx-charts';
import {formatDate} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  LOCALE_ID,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewContainerRef,
} from '@angular/core';
import {Subscription} from 'rxjs';
import {
  PeerMedianPoint,
  PeerProgressResponse,
  PeerProgressService,
  PeerProgressState,
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

type PeerMedianState = 'loading' | 'error' | PeerProgressState;

@Component({
  selector: 'f-progress-burndown-chart',
  templateUrl: './progress-burndown-chart.component.html',
  styleUrls: ['./progress-burndown-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ProgressBurndownChartComponent
  extends ChartBaseComponent
  implements OnChanges, OnDestroy, OnInit
{
  @Input() project: Project;
  @Input() unit: Unit;
  @Input() grade: number;

  data: BurndownSeries[] = [];
  temp: BurndownSeries[] = [];

  // Chart options
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
    // Target, Projected, To Submit, To Complete, Peer median (demo).
    domain: ['#AAAAAA', '#777777', '#0079d8', '#E01B5D', '#7C3AED', 'transparent'],
  };

  yScaleMin: number = 0;
  yScaleMax: number = 100;

  /** Drives the privacy-safe status message below the chart. */
  peerMedianState: PeerMedianState = 'loading';

  private seriesVisibility: Record<string, boolean> = {};
  private peerMedian: PeerMedianPoint[] = [];
  private activePeerMedianRequest?: Subscription;
  private peerMedianRequestVersion: number = 0;
  private initialised: boolean = false;

  constructor(
    public viewContainerRef: ViewContainerRef,
    private peerProgressService: PeerProgressService,
  ) {
    super(viewContainerRef);
    this.data = [];
    this.temp = [];
  }

  ngOnInit(): void {
    this.initialised = true;

    this.project.refreshBurndownChartData();
    this.updateData();

    this.data.forEach((item) => {
      this.seriesVisibility[item.name] = true;
    });

    this.loadPeerMedian();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const gradeChange = changes.grade;

    // Angular calls ngOnChanges before ngOnInit. Ignore that first call so the
    // initial peer request is made exactly once from ngOnInit.
    if (
      !this.initialised ||
      !gradeChange ||
      gradeChange.firstChange ||
      gradeChange.currentValue === undefined ||
      gradeChange.currentValue === gradeChange.previousValue
    ) {
      return;
    }

    this.project.refreshBurndownChartData();
    this.updateData();

    // The comparison cohort changes when the selected target grade changes.
    this.loadPeerMedian();
  }

  ngOnDestroy(): void {
    this.peerMedianRequestVersion++;
    this.activePeerMedianRequest?.unsubscribe();
  }

  private loadPeerMedian(): void {
    const requestVersion = ++this.peerMedianRequestVersion;
    const requestedProjectId = this.project.id;
    const requestedGrade = this.grade ?? this.project.targetGrade;

    // Remove the old peer line immediately and cancel the previous request.
    // This prevents an old grade result from overwriting the current grade.
    this.activePeerMedianRequest?.unsubscribe();

    this.peerMedianState = 'loading';
    this.peerMedian = [];
    this.updateData();

    this.activePeerMedianRequest = this.peerProgressService
      .getCohortMedian(this.project, requestedGrade)
      .subscribe({
        next: (response) => {
          if (requestVersion !== this.peerMedianRequestVersion) {
            return;
          }

          // Fail safely if an adapter returns data for a different project or
          // grade than the one currently displayed.
          if (
            response.project_id !== requestedProjectId ||
            response.target_grade !== requestedGrade
          ) {
            this.peerMedian = [];
            this.peerMedianState = 'unavailable';
            this.updateData();
            return;
          }

          this.applyPeerMedianResponse(response);
          this.updateData();
        },

        error: () => {
          if (requestVersion !== this.peerMedianRequestVersion) {
            return;
          }

          this.peerMedian = [];
          this.peerMedianState = 'error';
          this.updateData();
        },
      });
  }

  private applyPeerMedianResponse(response: PeerProgressResponse): void {
    this.peerMedian = [];

    switch (response.state) {
      case 'ready':
        if (response.median_burndown.length === 0) {
          this.peerMedianState = 'unavailable';
          return;
        }

        this.peerMedian = [...response.median_burndown];
        this.peerMedianState = 'ready';
        return;

      case 'suppressed':
      case 'unavailable':
      case 'disabled':
        this.peerMedianState = response.state;
        return;
    }
  }

  updateData(): void {
    const chartData = this.project?.burndownChartData;
    const locale: string = AppInjector.get(LOCALE_ID);
    const startDate: Date = this.project.unit.startDate;
    const endDate: Date = this.project.unit.endDate;

    if (!chartData) {
      this.temp = [];
      this.data = [];
      return;
    }

    // Preserve the existing OnTrack burndown series. New chart values are
    // created instead of changing project.burndownChartData in place.
    const formattedData: BurndownSeries[] = chartData.map((series) => ({
      name: series.key,
      series: series.values
        .filter((value) => value[0] >= startDate.getTime() && value[0] <= endDate.getTime())
        .map((value) => ({
          name: formatDate(new Date(value[0]), 'd MMM', locale),
          value: Math.round(Math.max(0, value[1]) * 100),
        })),
    }));

    // Keep the existing workaround for the chart's y-axis bounds.
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
      }

      if (end) {
        end.value = 0;
      }
    }

    // This label is intentionally explicit while the adapter uses mock data.
    if (this.peerMedianState === 'ready' && this.peerMedian.length > 0) {
      formattedData.push(
        this.toSeries('Peer median (demo)', this.peerMedian, startDate, endDate, locale),
      );
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
    if (!this.isLegend(event)) {
      return;
    }

    const tempData: BurndownSeries[] = JSON.parse(JSON.stringify(this.data));

    if (this.isDataShown(event)) {
      tempData.forEach((series) => {
        if (series.name === event) {
          series.series.forEach((point) => {
            point.value = 0;
          });
        }
      });
    } else {
      const originalSeries = this.temp.find((series) => series.name === event);

      const seriesIndex = tempData.findIndex((series) => series.name === event);

      if (originalSeries && seriesIndex >= 0) {
        tempData[seriesIndex] = JSON.parse(JSON.stringify(originalSeries));
      }
    }

    this.data = tempData;
  }

  isLegend(event: string | BurndownPoint): event is string {
    return typeof event === 'string';
  }

  isDataShown(name: string): boolean {
    return Boolean(
      this.data.find((series) => series.name === name)?.series.some((point) => point.value !== 0),
    );
  }

  public formatPerc(input: number): string {
    return `${input}%`;
  }
}
