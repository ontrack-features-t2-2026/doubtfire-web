import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

import API_URL from 'src/app/config/constants/apiUrl';
import {Project} from 'src/app/api/models/doubtfire-model';
import {EngagementHeatmapResponse} from 'src/app/api/models/engagement-heatmap';
import {EngagementHeatmapCardComponent} from './engagement-heatmap-card.component';

function buildDayList(): EngagementHeatmapResponse['days'] {
  // 84 consecutive days starting on a Wednesday (2026-01-21).
  // Build the ISO string from local Date parts so the test is
  // not sensitive to the runner's timezone (toISOString → UTC shift).
  return Array.from({length: 84}, (_v, i) => {
    const d = new Date(2026, 0, 21 + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    return {date: iso, activity_count: i % 10 === 0 ? i % 5 : 0};
  });
}

function buildResponse(overrides?: Partial<EngagementHeatmapResponse>): EngagementHeatmapResponse {
  return {
    project_id: 42,
    unit_id: 7,
    range: {start_date: '2026-01-21', end_date: '2026-04-14', days: 84},
    days: buildDayList(),
    summary: {tasks_completed: 5, active_days: 3, current_streak: 2},
    ...overrides,
  };
}

function buildEmptyResponse(): EngagementHeatmapResponse {
  return buildResponse({
    days: buildDayList().map((d) => ({...d, activity_count: 0})),
    summary: {tasks_completed: 0, active_days: 0, current_streak: 0},
  });
}

describe('EngagementHeatmapCardComponent', () => {
  let component: EngagementHeatmapCardComponent;
  let fixture: ComponentFixture<EngagementHeatmapCardComponent>;
  let httpMock: HttpTestingController;

  const stubProject = {id: 42, unit: {code: 'UNIT101', name: 'Test Unit'}} as unknown as Project;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EngagementHeatmapCardComponent],
      imports: [
        HttpClientTestingModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EngagementHeatmapCardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('shows the heatmap-shaped skeleton while the request is in flight', () => {
    component.project = stubProject;
    component.ngOnChanges({
      project: {
        currentValue: stubProject,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();

    // Skeleton is visible before the backend responds.
    const skeleton = fixture.nativeElement.querySelector('[data-testid="hm-skeleton"]');
    expect(skeleton).toBeTruthy();
    const skeletonCells: NodeListOf<HTMLElement> =
      skeleton.querySelectorAll('.hm-skeleton-cell');
    expect(skeletonCells.length).toBeGreaterThan(0);

    // Flush the request so httpMock.verify() in afterEach is satisfied.
    const req = httpMock.expectOne(`${API_URL}/projects/42/engagement_heatmap`);
    req.flush(buildResponse());

    fixture.detectChanges();

    // Once data arrives the skeleton is replaced by the real grid.
    expect(fixture.nativeElement.querySelector('[data-testid="hm-skeleton"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="hm-grid"]')).toBeTruthy();
  });

  it('renders the heatmap grid with one cell per day plus pad cells when data loads', () => {
    component.project = stubProject;
    component.ngOnChanges({
      project: {
        currentValue: stubProject,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();

    const req = httpMock.expectOne(`${API_URL}/projects/42/engagement_heatmap`);
    expect(req.request.method).toBe('GET');
    req.flush(buildResponse());

    fixture.detectChanges();

    const dayCells: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll(
      '[data-testid="hm-cell"]',
    );
    expect(dayCells.length).toBe(84);

    const padCells: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.hm-pad');
    // 2026-01-21 is a Wednesday → 2 pad cells to align to Monday-start.
    expect(padCells.length).toBe(2);

    const summary = fixture.nativeElement.querySelector('[data-testid="hm-summary"]');
    expect(summary).toBeTruthy();
    expect(summary?.textContent).toContain('5'); // tasks completed
    expect(summary?.textContent).toContain('3'); // active days
    expect(summary?.textContent).toContain('2'); // current streak

    // All seven weekday labels are rendered (Mon…Sun), plus the top spacer.
    const dayLabelSpans: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll(
      '.hm-day-labels > span',
    );
    expect(dayLabelSpans.length).toBe(8); // 1 spacer + 7 days
    const labelText = Array.from(dayLabelSpans)
      .map((el) => el.textContent?.trim())
      .filter((s) => s && s.length > 0);
    expect(labelText).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

    // Month row renders one label per calendar month crossed by the window.
    // The 84-day fixture (2026-01-21 → 2026-04-14) spans Jan → Apr.
    const monthRow = fixture.nativeElement.querySelector('[data-testid="hm-month-row"]');
    expect(monthRow).toBeTruthy();
    const monthLabels: NodeListOf<HTMLElement> =
      monthRow.querySelectorAll('.hm-month-label');
    expect(monthLabels.length).toBe(4);

    // Legend sits alongside the grid and always exposes 5 swatches (levels 0..4).
    const legend = fixture.nativeElement.querySelector('[data-testid="hm-legend"]');
    expect(legend).toBeTruthy();
    const legendSwatches: NodeListOf<HTMLElement> =
      legend.querySelectorAll('.hm-legend-cell');
    expect(legendSwatches.length).toBe(5);
  });

  it('precomputes a render cell per day so the template does not call into the component for each cell', () => {
    component.project = stubProject;
    component.ngOnChanges({
      project: {
        currentValue: stubProject,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();
    httpMock.expectOne(`${API_URL}/projects/42/engagement_heatmap`).flush(buildResponse());
    fixture.detectChanges();

    expect(component.renderCells.length).toBe(84);
    // Each render cell carries its precomputed bucket and tooltip, so the
    // template binds plain data instead of invoking methods per cell.
    for (const cell of component.renderCells) {
      expect(cell.date).toBeTruthy();
      expect(cell.bucket).toBeGreaterThanOrEqual(0);
      expect(cell.bucket).toBeLessThanOrEqual(4);
      expect(cell.tooltip).toContain('—');
    }
  });

  it('shows the empty state when summary.active_days is zero', () => {
    component.project = stubProject;
    component.ngOnChanges({
      project: {
        currentValue: stubProject,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();

    const req = httpMock.expectOne(`${API_URL}/projects/42/engagement_heatmap`);
    req.flush(buildEmptyResponse());

    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('[data-testid="hm-empty"]');
    expect(emptyState).toBeTruthy();

    const grid = fixture.nativeElement.querySelector('[data-testid="hm-grid"]');
    expect(grid).toBeFalsy();
  });

  it('shows an error message and a Retry button if the request fails', () => {
    component.project = stubProject;
    component.ngOnChanges({
      project: {
        currentValue: stubProject,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();

    const req = httpMock.expectOne(`${API_URL}/projects/42/engagement_heatmap`);
    req.flush('boom', {status: 500, statusText: 'Server Error'});

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not load engagement data');
    const retryBtn = fixture.nativeElement.querySelector('button');
    expect(retryBtn).toBeTruthy();
  });
});
