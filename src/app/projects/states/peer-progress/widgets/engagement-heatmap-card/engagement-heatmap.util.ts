import {EngagementHeatmapDay} from 'src/app/api/models/engagement-heatmap';

/**
 * Pure helpers for the engagement heatmap card. Kept in a separate module
 * (not on the component) so the bucketing / layout logic can be unit tested
 * without bootstrapping the whole Angular component.
 */

/** Day-of-week index where Monday = 0 … Sunday = 6. */
export const WEEK_STARTS_ON_MONDAY = 1;

/** Non-empty intensity levels (0 means "empty"). */
export const HEATMAP_INTENSITY_LEVELS = 4;

/**
 * Parse a backend ISO date (`"YYYY-MM-DD"`) as a local-time Date.
 *
 * Using `new Date('YYYY-MM-DD')` directly parses as UTC which, depending on the
 * browser's timezone, can shift the day back/forward. Construct the date
 * explicitly so the day rendered on the heatmap always matches the day the
 * backend sent.
 */
export function parseHeatmapDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Row index for a given date, with Monday at the top of the grid.
 */
export function dayRowIndex(date: Date, weekStartsOn: number = WEEK_STARTS_ON_MONDAY): number {
  return (date.getDay() - weekStartsOn + 7) % 7;
}

/**
 * Bucket a single-day activity count into a discrete intensity level:
 *   0 — no activity
 *   1 .. 4 — quarter bands of [1, maxCount]
 *
 * Uses non-empty quartiles so that _any_ activity reads as visibly non-zero
 * even when the student's most active day had only a few events.
 */
export function bucketForCount(count: number, maxCount: number): number {
  if (!Number.isFinite(count) || count <= 0) {
    return 0;
  }
  if (!Number.isFinite(maxCount) || maxCount <= 0) {
    return 0;
  }

  const step = maxCount / HEATMAP_INTENSITY_LEVELS;
  for (let level = 1; level < HEATMAP_INTENSITY_LEVELS; level++) {
    if (count <= step * level) {
      return level;
    }
  }
  return HEATMAP_INTENSITY_LEVELS;
}

/**
 * Summary of what the grid needs to render:
 *  - `padCells`: empty slots before day 0 so the grid aligns to Monday-start weeks.
 *  - `weekCount`: number of columns in the grid.
 *  - `maxCount`: most active day in the window; used to drive colour bucketing.
 */
export interface HeatmapLayout {
  padCells: number;
  weekCount: number;
  maxCount: number;
}

/**
 * Compute grid layout metadata for the given days.
 * Safe against empty / missing inputs.
 */
export function computeHeatmapLayout(
  days: EngagementHeatmapDay[],
  weekStartsOn: number = WEEK_STARTS_ON_MONDAY,
): HeatmapLayout {
  if (!days || days.length === 0) {
    return {padCells: 0, weekCount: 0, maxCount: 0};
  }

  const firstDate = parseHeatmapDate(days[0].date);
  const padCells = dayRowIndex(firstDate, weekStartsOn);
  const totalCells = padCells + days.length;
  const weekCount = Math.ceil(totalCells / 7);

  let maxCount = 0;
  for (const d of days) {
    if (d.activity_count > maxCount) {
      maxCount = d.activity_count;
    }
  }

  return {padCells, weekCount, maxCount};
}

/**
 * Month-label entry for the month row above the heatmap grid.
 *
 * `columnIndex` and `span` are expressed in *week columns* (0-indexed) so the
 * template can position the label via `grid-column: (columnIndex + 1) / span span`.
 */
export interface HeatmapMonthLabel {
  columnIndex: number;
  span: number;
  label: string;
}

/**
 * Group consecutive week columns by calendar month and emit a label per group.
 * Picks the first non-pad day visible in each week column as that column's
 * representative date. Partial months at the edges of the window still get a
 * label; very short spans are filtered out so a 1-week sliver doesn't crowd
 * its neighbour.
 */
export function computeMonthLabels(
  days: EngagementHeatmapDay[],
  padCells: number,
  weekCount: number,
): HeatmapMonthLabel[] {
  if (!days || days.length === 0 || weekCount <= 0) {
    return [];
  }

  const labels: HeatmapMonthLabel[] = [];
  let currentMonth = -1;
  let current: HeatmapMonthLabel | null = null;

  for (let col = 0; col < weekCount; col++) {
    const rawIndex = col === 0 ? 0 : col * 7 - padCells;
    const safeIndex = Math.min(Math.max(rawIndex, 0), days.length - 1);
    const day = days[safeIndex];
    if (!day) {
      continue;
    }

    const date = parseHeatmapDate(day.date);
    const month = date.getMonth();

    if (month !== currentMonth) {
      if (current) {
        labels.push(current);
      }
      current = {
        columnIndex: col,
        span: 1,
        label: date.toLocaleDateString(undefined, {month: 'short'}),
      };
      currentMonth = month;
    } else if (current) {
      current.span += 1;
    }
  }

  if (current) {
    labels.push(current);
  }

  return labels;
}

/**
 * Short, locale-aware label for a cell's tooltip, e.g. "Wed, 21 Jan — 3 activities".
 */
export function formatCellTooltip(day: EngagementHeatmapDay): string {
  const date = parseHeatmapDate(day.date);
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const noun = day.activity_count === 1 ? 'activity' : 'activities';
  return `${dateLabel} — ${day.activity_count} ${noun}`;
}
