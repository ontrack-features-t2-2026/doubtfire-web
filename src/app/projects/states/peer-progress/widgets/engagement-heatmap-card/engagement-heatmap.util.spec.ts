import {
  HEATMAP_INTENSITY_LEVELS,
  bucketForCount,
  computeHeatmapLayout,
  computeMonthLabels,
  dayRowIndex,
  formatCellTooltip,
  parseHeatmapDate,
} from './engagement-heatmap.util';

describe('engagement-heatmap.util', () => {
  describe('parseHeatmapDate', () => {
    it('parses an ISO date as a local-time Date (no UTC shift)', () => {
      const d = parseHeatmapDate('2026-01-21');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(0);
      expect(d.getDate()).toBe(21);
    });
  });

  describe('dayRowIndex', () => {
    // 2026-01-19 is a Monday (known good reference).
    it('returns 0 for Monday when week starts on Monday', () => {
      expect(dayRowIndex(parseHeatmapDate('2026-01-19'))).toBe(0);
    });

    it('returns 6 for Sunday when week starts on Monday', () => {
      expect(dayRowIndex(parseHeatmapDate('2026-01-25'))).toBe(6);
    });

    it('returns 4 for Friday when week starts on Monday', () => {
      expect(dayRowIndex(parseHeatmapDate('2026-01-23'))).toBe(4);
    });
  });

  describe('bucketForCount', () => {
    it('returns 0 for zero / non-positive counts', () => {
      expect(bucketForCount(0, 10)).toBe(0);
      expect(bucketForCount(-5, 10)).toBe(0);
    });

    it('returns 0 when max is zero or negative', () => {
      expect(bucketForCount(3, 0)).toBe(0);
      expect(bucketForCount(3, -1)).toBe(0);
    });

    it('buckets counts into quartiles of [1, max]', () => {
      // max = 4, step = 1 → counts 1..4 map to buckets 1..4
      expect(bucketForCount(1, 4)).toBe(1);
      expect(bucketForCount(2, 4)).toBe(2);
      expect(bucketForCount(3, 4)).toBe(3);
      expect(bucketForCount(4, 4)).toBe(4);
    });

    it('promotes any non-zero activity to at least level 1', () => {
      expect(bucketForCount(1, 100)).toBe(1);
    });

    it('clamps counts greater than max to the top level', () => {
      expect(bucketForCount(99, 4)).toBe(HEATMAP_INTENSITY_LEVELS);
    });

    it('handles a max of 1 gracefully', () => {
      expect(bucketForCount(1, 1)).toBe(HEATMAP_INTENSITY_LEVELS);
    });
  });

  describe('computeHeatmapLayout', () => {
    it('returns zeroed layout for empty input', () => {
      expect(computeHeatmapLayout([])).toEqual({padCells: 0, weekCount: 0, maxCount: 0});
    });

    it('uses zero pad cells when the first day is a Monday', () => {
      // 2026-01-19 is a Monday.
      const days = [{date: '2026-01-19', activity_count: 0}];
      expect(computeHeatmapLayout(days).padCells).toBe(0);
    });

    it('pads to Monday-start when the first day is mid-week', () => {
      // 2026-01-21 is a Wednesday → row 2 → 2 pad cells.
      const days = [{date: '2026-01-21', activity_count: 0}];
      expect(computeHeatmapLayout(days).padCells).toBe(2);
    });

    it('reports the max activity count across the window', () => {
      const days = [
        {date: '2026-01-19', activity_count: 1},
        {date: '2026-01-20', activity_count: 5},
        {date: '2026-01-21', activity_count: 3},
      ];
      expect(computeHeatmapLayout(days).maxCount).toBe(5);
    });

    it('computes week count to fit pad + days in 7-row columns', () => {
      // 84 days, Wednesday start → 2 pad + 84 = 86 cells → ceil(86/7) = 13 weeks.
      const days = Array.from({length: 84}, (_v, i) => {
        const d = new Date(2026, 0, 21 + i);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate(),
        ).padStart(2, '0')}`;
        return {date: iso, activity_count: 0};
      });
      expect(computeHeatmapLayout(days).weekCount).toBe(13);
    });
  });

  describe('computeMonthLabels', () => {
    // 84 consecutive days from 2026-01-21 (Wed) → 2026-04-14 (Tue).
    // → padCells = 2, weekCount = 13. Months crossed: Jan, Feb, Mar, Apr.
    function buildDays() {
      return Array.from({length: 84}, (_v, i) => {
        const d = new Date(2026, 0, 21 + i);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate(),
        ).padStart(2, '0')}`;
        return {date: iso, activity_count: 0};
      });
    }

    it('returns an empty list for empty input', () => {
      expect(computeMonthLabels([], 0, 0)).toEqual([]);
    });

    it('returns one entry per distinct calendar month in the window', () => {
      const labels = computeMonthLabels(buildDays(), 2, 13);
      expect(labels.map((l) => l.label)).toEqual(['Jan', 'Feb', 'Mar', 'Apr']);
    });

    it('assigns column indices in ascending, non-overlapping order', () => {
      const labels = computeMonthLabels(buildDays(), 2, 13);
      for (let i = 0; i < labels.length - 1; i++) {
        expect(labels[i].columnIndex + labels[i].span).toBeLessThanOrEqual(
          labels[i + 1].columnIndex,
        );
      }
    });

    it('covers every week column with a label (spans sum to weekCount)', () => {
      const labels = computeMonthLabels(buildDays(), 2, 13);
      const totalSpan = labels.reduce((acc, l) => acc + l.span, 0);
      expect(totalSpan).toBe(13);
    });

    it('anchors the first label at column 0', () => {
      const labels = computeMonthLabels(buildDays(), 2, 13);
      expect(labels[0].columnIndex).toBe(0);
    });
  });

  describe('formatCellTooltip', () => {
    it('includes the date and the activity count', () => {
      const tip = formatCellTooltip({date: '2026-01-21', activity_count: 3});
      // Locale formatting varies by environment, so assert on the bits we own:
      // the separator and the pluralised count.
      expect(tip).toContain('—');
      expect(tip).toContain('3 activities');
    });

    it('uses singular "activity" for count === 1', () => {
      const tip = formatCellTooltip({date: '2026-01-21', activity_count: 1});
      expect(tip).toContain('1 activity');
      expect(tip).not.toContain('activities');
    });

    it('uses plural "activities" for count === 0', () => {
      const tip = formatCellTooltip({date: '2026-01-21', activity_count: 0});
      expect(tip).toContain('0 activities');
    });
  });
});
