/**
 * Shape returned by `GET /api/projects/:id/engagement_heatmap`.
 *
 * This mirrors the backend `EngagementHeatmapService.build(project: ...)`
 * contract (doubtfire-api). Keep this interface and the backend presenter in
 * sync when the contract changes.
 */

export interface EngagementHeatmapDay {
  /** ISO date string, e.g. "2026-01-21". */
  date: string;
  /** Count of activity events on that day for this project only. */
  activity_count: number;
}

export interface EngagementHeatmapRange {
  /** Inclusive start date of the window (ISO date string). */
  start_date: string;
  /** Inclusive end date of the window (ISO date string). */
  end_date: string;
  /** Number of days in the window (typically 84). */
  days: number;
}

export interface EngagementHeatmapSummary {
  tasks_completed: number;
  active_days: number;
  current_streak: number;
}

export interface EngagementHeatmapResponse {
  project_id: number;
  unit_id: number;
  range: EngagementHeatmapRange;
  days: EngagementHeatmapDay[];
  summary: EngagementHeatmapSummary;
}
