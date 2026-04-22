import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {tap} from 'rxjs/operators';
import API_URL from 'src/app/config/constants/apiUrl';
import {EngagementHeatmapResponse} from '../models/engagement-heatmap';

/**
 * Thin read-only client for the unit-specific engagement heatmap endpoint.
 *
 * Matches the pattern used by small read-only endpoints elsewhere in the app
 * (see `TiiService`, `UnitService.loadLearningProgressClassStats`, etc.): a
 * root-provided service with a single `httpClient.get<T>` call. We intentionally
 * do not go through `CachedEntityService` because the payload is derived /
 * non-CRUD.
 *
 * A lightweight in-memory cache keyed by `projectId` sits in front of the HTTP
 * call. Its purpose is *perceived load speed* — a student who navigates away
 * from the Peer Progress page and back within a minute gets the card
 * re-rendered from cache without the network round trip. The TTL is short
 * enough that activity shown on the heatmap stays roughly fresh without
 * requiring manual invalidation hooks elsewhere in the app.
 */
@Injectable({
  providedIn: 'root',
})
export class EngagementHeatmapService {
  /** How long a cached response is considered "fresh" (milliseconds). */
  public static readonly CACHE_TTL_MS = 60_000;

  private readonly cache = new Map<
    number,
    {data: EngagementHeatmapResponse; fetchedAt: number}
  >();

  constructor(private httpClient: HttpClient) {}

  /**
   * Fetch the engagement heatmap for a single project/unit context.
   *
   * Returns a cached response synchronously (via `of(...)`) when one exists
   * and is still within the TTL; otherwise falls through to the HTTP request
   * and caches the result on success.
   *
   * The heatmap is intentionally scoped to one project (i.e. one unit) — it is
   * never aggregated across a student's multiple units.
   */
  public get(projectId: number): Observable<EngagementHeatmapResponse> {
    const cached = this.cache.get(projectId);
    if (cached && Date.now() - cached.fetchedAt < EngagementHeatmapService.CACHE_TTL_MS) {
      return of(cached.data);
    }

    const url = `${API_URL}/projects/${projectId}/engagement_heatmap`;
    return this.httpClient.get<EngagementHeatmapResponse>(url).pipe(
      tap((data) => {
        this.cache.set(projectId, {data, fetchedAt: Date.now()});
      }),
    );
  }

  /**
   * Evict cached entries. Pass a `projectId` to evict a single entry, or call
   * with no arguments to clear the whole cache (e.g. on logout).
   */
  public invalidate(projectId?: number): void {
    if (projectId === undefined) {
      this.cache.clear();
      return;
    }
    this.cache.delete(projectId);
  }
}
