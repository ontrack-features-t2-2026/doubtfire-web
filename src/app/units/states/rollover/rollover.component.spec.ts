import {describe, expect, it, vi} from 'vitest';
import {NEVER, of} from 'rxjs';
import {RolloverComponent, asUtcDay} from './rollover.component';

function rollover() {
  const router = {navigate: vi.fn(), navigateByUrl: vi.fn()};
  const alerts = {success: vi.fn(), error: vi.fn()};
  const component = new RolloverComponent(
    {} as never,
    {} as never,
    alerts as never,
    router as never,
    {} as never,
    {} as never,
  );
  const unit = {rolloverTo: vi.fn((_body: object) => NEVER)};
  component.unit = unit as never;
  component.teachingPeriod = false;
  return {component, unit, router};
}

describe('RolloverComponent', () => {
  it('sends the picked days as UTC dates, so the server keeps the same days', () => {
    const {component, unit} = rollover();
    component.newStartDate = new Date(2027, 2, 1);
    component.newEndDate = new Date(2027, 5, 30);

    component.createUnit();

    const body = unit.rolloverTo.mock.calls[0][0] as {start_date: Date; end_date: Date};
    expect(body.start_date.toISOString()).toBe('2027-03-01T00:00:00.000Z');
    expect(body.end_date.toISOString()).toBe('2027-06-30T00:00:00.000Z');
  });

  it('makes one unit however many times Create unit is clicked', () => {
    const {component, unit} = rollover();
    component.newStartDate = new Date(2027, 2, 1);
    component.newEndDate = new Date(2027, 5, 30);

    component.createUnit();
    component.createUnit();

    expect(unit.rolloverTo).toHaveBeenCalledTimes(1);
  });

  it('will not create a unit that ends before it starts', () => {
    const {component, unit} = rollover();
    component.newStartDate = new Date(2027, 5, 30);
    component.newEndDate = new Date(2027, 2, 1);

    component.createUnit();

    expect(component.customDatesOutOfOrder).toBe(true);
    expect(unit.rolloverTo).not.toHaveBeenCalled();
  });

  it('opens the new unit once it is made', () => {
    const {component, unit, router} = rollover();
    unit.rolloverTo.mockReturnValue(of({id: 42}) as never);
    component.teachingPeriod = {id: 7} as never;

    component.createUnit();

    expect(unit.rolloverTo).toHaveBeenCalledWith({teaching_period_id: 7});
    expect(router.navigate).toHaveBeenCalledWith(['/units', 42, 'admin']);
  });

  it('keeps the calendar day when making a UTC date', () => {
    expect(asUtcDay(new Date(2027, 0, 31, 23, 30)).toISOString()).toBe('2027-01-31T00:00:00.000Z');
  });
});
