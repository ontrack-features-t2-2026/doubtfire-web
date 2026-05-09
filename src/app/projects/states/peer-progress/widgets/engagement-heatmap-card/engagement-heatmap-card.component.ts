import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import {Subscription} from 'rxjs';
import {Project} from 'src/app/api/models/doubtfire-model';
import {EngagementHeatmapResponse} from 'src/app/api/models/engagement-heatmap';
import {EngagementHeatmapService} from 'src/app/api/services/engagement-heatmap.service';
import {
  bucketForCount,
  computeHeatmapLayout,
  computeMonthLabels,
  formatCellTooltip,
  HEATMAP_INTENSITY_LEVELS,
  HeatmapLayout,
  HeatmapMonthLabel,
} from './engagement-heatmap.util';

/**
 * Pre-rendered per-cell view model. Bucketing and the tooltip string are
 * derived once when the response arrives rather than on every change-detection
 * pass — for the default 84-day window this cuts work from ~168 function
 * calls/CD down to zero.
 */
interface HeatmapRenderCell {
  date: string;
  bucket: number;
  tooltip: string;
}

/**
 * Engagement heatmap card — first widget on the Peer Progress page.
 *
 * Scope: unit-specific. Receives the currently-selected `Project` from the
 * page container and fetches `GET /api/projects/:id/engagement_heatmap`.
 * Renders:
 *   - a heatmap-shaped skeleton while loading (keeps the card height stable)
 *   - three summary tiles (tasks completed / active days / current streak)
 *   - a GitHub-style heatmap (7 rows × N week columns, Monday-start)
 *   - a month row above the grid and an inline legend below it
 *   - loading / empty / error states
 */
@Component({
  selector: 'f-engagement-heatmap-card',
  templateUrl: 'engagement-heatmap-card.component.html',
  styleUrls: ['engagement-heatmap-card.component.scss'],
})
export class EngagementHeatmapCardComponent implements OnChanges, OnDestroy {
  @Input() project!: Project;

  public data: EngagementHeatmapResponse | null = null;
  public isLoading = false;
  public errorMessage: string | null = null;

  /** Cached grid layout — computed once per successful fetch. */
  public layout: HeatmapLayout = {padCells: 0, weekCount: 0, maxCount: 0};

  /** Zero-filled array whose length equals `layout.padCells`, for `@for` iteration. */
  public padSlots: readonly null[] = [];

  /** Month labels aligned above the grid columns. Empty until data arrives. */
  public monthLabels: readonly HeatmapMonthLabel[] = [];

  /** Pre-rendered cells. Populated once per fetch; iterated by the template. */
  public renderCells: readonly HeatmapRenderCell[] = [];

  /** Legend swatches 0..N (0 = empty, then one per intensity level). */
  public readonly legendLevels: readonly number[] = Array.from(
    {length: HEATMAP_INTENSITY_LEVELS + 1},
    (_v, i) => i,
  );

  /**
   * Fixed-size placeholder array used by the skeleton grid. 13 × 7 = 91 cells
   * matches the typical 12-week window rendered with a Monday-start pad.
   */
  public readonly skeletonCells: readonly null[] = new Array(91).fill(null);

  /** `--hm-weeks` value used while the skeleton is visible. */
  public readonly skeletonWeeks = 13;

  private activeRequest?: Subscription;

  constructor(private engagementHeatmapService: EngagementHeatmapService) {}

  public ngOnChanges(changes: SimpleChanges): void {
    // Re-fetch whenever the project changes (e.g. student switches unit).
    if (changes['project']) {
      this.load();
    }
  }

  public ngOnDestroy(): void {
    this.activeRequest?.unsubscribe();
  }

  /**
   * Whether the 84-day window contains zero activity. Drives the empty state.
   */
  public get isEmpty(): boolean {
    if (!this.data) {
      return false;
    }
    return this.data.summary.active_days === 0;
  }

  /** Manual retry handler for the error state. */
  public retry(): void {
    this.load();
  }

  private load(): void {
    if (!this.project?.id) {
      return;
    }

    this.activeRequest?.unsubscribe();

    this.isLoading = true;
    this.errorMessage = null;
    this.data = null;
    this.layout = {padCells: 0, weekCount: 0, maxCount: 0};
    this.padSlots = [];
    this.monthLabels = [];
    this.renderCells = [];

    this.activeRequest = this.engagementHeatmapService.get(this.project.id).subscribe({
      next: (response) => {
        this.data = response;
        this.layout = computeHeatmapLayout(response.days);
        this.padSlots = new Array(this.layout.padCells).fill(null);
        this.monthLabels = computeMonthLabels(
          response.days,
          this.layout.padCells,
          this.layout.weekCount,
        );
        // Precompute bucket + tooltip for every cell so the template never has
        // to call back into the component during change detection.
        const maxCount = this.layout.maxCount;
        this.renderCells = response.days.map((d) => ({
          date: d.date,
          bucket: bucketForCount(d.activity_count, maxCount),
          tooltip: formatCellTooltip(d),
        }));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Could not load engagement data. Please try again.';
      },
    });
  }
}
