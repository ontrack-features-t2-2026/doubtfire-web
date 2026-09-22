import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {BehaviorSubject} from 'rxjs';
import {TeachingPeriod} from 'src/app/api/models/teaching-period';
import {RolloverComponent} from './rollover.component';

function period(id: number, startDate: Date, endDate = new Date(2027, 0, 1)): TeachingPeriod {
  return Object.assign(new TeachingPeriod(), {id, startDate, endDate});
}

describe('RolloverComponent teaching-period defaults', () => {
  let component: RolloverComponent;
  let periods: BehaviorSubject<TeachingPeriod[]>;
  let query: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers({toFake: ['Date']});
    vi.setSystemTime(new Date(2026, 8, 21, 13));
    periods = new BehaviorSubject<TeachingPeriod[]>([]);
    query = vi.fn();
    component = new RolloverComponent(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {cache: {values: periods}, query} as never,
    );
    component.initUnit();
  });

  afterEach(() => {
    periods.complete();
    vi.useRealTimers();
  });

  it('sorts non-ended periods without mutating the shared cache and selects the next start', () => {
    const current = period(1, new Date(2026, 6, 1));
    const next = period(2, new Date(2026, 9, 1));
    const later = period(3, new Date(2026, 10, 1));
    const ended = period(4, new Date(2026, 0, 1), new Date(2026, 8, 20));
    const cachedOrder = [next, ended, current, later];

    periods.next(cachedOrder);

    expect(component.teachingPeriods).toEqual([current, next, later]);
    expect(component.teachingPeriod).toBe(next);
    expect(cachedOrder).toEqual([next, ended, current, later]);
    expect(query).not.toHaveBeenCalled();
  });

  it('treats a period starting today as the next start throughout the local calendar day', () => {
    const today = period(1, new Date(2026, 8, 21));
    const tomorrow = period(2, new Date(2026, 8, 22));

    periods.next([today, tomorrow]);

    expect(component.teachingPeriod).toBe(today);
  });

  it('falls back to the most recently started current period when no upcoming period exists', () => {
    const older = period(1, new Date(2026, 6, 1));
    const recent = period(2, new Date(2026, 8, 1));

    periods.next([recent, older]);

    expect(component.teachingPeriods).toEqual([older, recent]);
    expect(component.teachingPeriod).toBe(recent);
  });

  it('uses the period id to keep equal start dates independent of cache insertion order', () => {
    const first = period(1, new Date(2026, 9, 1));
    const second = period(2, new Date(2026, 9, 1));

    periods.next([second, first]);
    expect(component.teachingPeriods).toEqual([first, second]);
    expect(component.teachingPeriod).toBe(first);

    periods.next([first, second]);
    expect(component.teachingPeriods).toEqual([first, second]);
    expect(component.teachingPeriod).toBe(first);
  });

  it('clears the selected period when a later cache update contains no eligible period', () => {
    const upcoming = period(1, new Date(2026, 9, 1));
    const ended = period(2, new Date(2026, 0, 1), new Date(2026, 8, 20));
    periods.next([upcoming]);
    expect(component.teachingPeriod).toBe(upcoming);

    periods.next([ended]);

    expect(component.teachingPeriods).toEqual([]);
    expect(component.teachingPeriod).toBeUndefined();
  });
});
