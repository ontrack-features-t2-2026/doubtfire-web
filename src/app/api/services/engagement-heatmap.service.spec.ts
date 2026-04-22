import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';

import API_URL from 'src/app/config/constants/apiUrl';
import {EngagementHeatmapResponse} from '../models/engagement-heatmap';
import {EngagementHeatmapService} from './engagement-heatmap.service';

function buildResponse(projectId: number): EngagementHeatmapResponse {
  return {
    project_id: projectId,
    unit_id: 7,
    range: {start_date: '2026-01-21', end_date: '2026-04-14', days: 84},
    days: [],
    summary: {tasks_completed: 0, active_days: 0, current_streak: 0},
  };
}

describe('EngagementHeatmapService', () => {
  let service: EngagementHeatmapService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EngagementHeatmapService],
    });
    service = TestBed.inject(EngagementHeatmapService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches from the backend on a cold cache and emits the response', () => {
    const received: EngagementHeatmapResponse[] = [];
    service.get(42).subscribe((r) => received.push(r));

    const req = httpMock.expectOne(`${API_URL}/projects/42/engagement_heatmap`);
    expect(req.request.method).toBe('GET');
    req.flush(buildResponse(42));

    expect(received.length).toBe(1);
    expect(received[0].project_id).toBe(42);
  });

  it('serves a subsequent call from cache without a second HTTP request', () => {
    service.get(42).subscribe();
    const req = httpMock.expectOne(`${API_URL}/projects/42/engagement_heatmap`);
    req.flush(buildResponse(42));

    const received: EngagementHeatmapResponse[] = [];
    service.get(42).subscribe((r) => received.push(r));

    httpMock.expectNone(`${API_URL}/projects/42/engagement_heatmap`);
    expect(received.length).toBe(1);
    expect(received[0].project_id).toBe(42);
  });

  it('caches each project independently', () => {
    service.get(1).subscribe();
    httpMock.expectOne(`${API_URL}/projects/1/engagement_heatmap`).flush(buildResponse(1));

    service.get(2).subscribe();
    httpMock.expectOne(`${API_URL}/projects/2/engagement_heatmap`).flush(buildResponse(2));

    // Re-request project 1 — should hit cache, not refetch.
    service.get(1).subscribe();
    httpMock.expectNone(`${API_URL}/projects/1/engagement_heatmap`);
  });

  it('invalidate(projectId) forces the next call to refetch', () => {
    service.get(42).subscribe();
    httpMock.expectOne(`${API_URL}/projects/42/engagement_heatmap`).flush(buildResponse(42));

    service.invalidate(42);

    service.get(42).subscribe();
    const req = httpMock.expectOne(`${API_URL}/projects/42/engagement_heatmap`);
    req.flush(buildResponse(42));
  });

  it('invalidate() with no argument clears the entire cache', () => {
    service.get(1).subscribe();
    httpMock.expectOne(`${API_URL}/projects/1/engagement_heatmap`).flush(buildResponse(1));
    service.get(2).subscribe();
    httpMock.expectOne(`${API_URL}/projects/2/engagement_heatmap`).flush(buildResponse(2));

    service.invalidate();

    service.get(1).subscribe();
    httpMock.expectOne(`${API_URL}/projects/1/engagement_heatmap`).flush(buildResponse(1));
    service.get(2).subscribe();
    httpMock.expectOne(`${API_URL}/projects/2/engagement_heatmap`).flush(buildResponse(2));
  });

  it('refetches once the cached entry is older than the TTL', () => {
    // Freeze time so the TTL test is deterministic.
    const base = 1_700_000_000_000;
    spyOn(Date, 'now').and.returnValue(base);

    service.get(42).subscribe();
    httpMock.expectOne(`${API_URL}/projects/42/engagement_heatmap`).flush(buildResponse(42));

    // Advance past the TTL (default 60 s).
    (Date.now as jasmine.Spy).and.returnValue(base + EngagementHeatmapService.CACHE_TTL_MS + 1);

    service.get(42).subscribe();
    const req = httpMock.expectOne(`${API_URL}/projects/42/engagement_heatmap`);
    req.flush(buildResponse(42));
  });
});
