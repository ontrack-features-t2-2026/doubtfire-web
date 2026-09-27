import {BehaviorSubject, Subject, of, throwError} from 'rxjs';
import {Unit} from 'src/app/api/models/unit';
import {TaskStatusStats, UnitService} from 'src/app/api/services/unit.service';
import {UnitAnalyticsComponent} from './unit-analytics-route.component';

const emptyCompletion = {
  unit: {min: 0, lower: 0, median: 0, upper: 0, max: 0},
  tutorial: {},
  grade: {},
};

describe('UnitAnalyticsComponent statistics requests', () => {
  function setup() {
    const service = {
      taskStatusCountByTutorial: vi.fn().mockReturnValue(of({})),
      targetGradeStats: vi.fn().mockReturnValue(of([])),
      taskCompletionStats: vi.fn().mockReturnValue(of(emptyCompletion)),
    };
    const component = new UnitAnalyticsComponent(
      null,
      null,
      null,
      null,
      null,
      null,
      service as unknown as UnitService,
      'en-AU',
    );
    const units = new BehaviorSubject({id: 1} as Unit);
    component.unit$ = units;
    return {component, service, units};
  }

  it('loads all three endpoints for the selected unit', () => {
    const {component, service} = setup();
    component.ngOnInit();
    expect(service.targetGradeStats).toHaveBeenCalledWith(component.unit);
    expect(component.taskCompletionStats).toEqual(emptyCompletion);
    expect(component.statisticsLoading).toBe(false);
    expect(component.statisticsFailed).toBe(false);
    component.ngOnDestroy();
  });

  it('keeps successful charts on failure and can retry', () => {
    const {component, service} = setup();
    service.targetGradeStats.mockReturnValueOnce(throwError(() => new Error('Denied')));
    component.ngOnInit();
    expect(component.statisticsFailed).toBe(true);
    expect(component.targetGradeStats).toBeNull();
    expect(component.taskStatusStats).toEqual({});
    component.loadStatistics();
    expect(component.statisticsFailed).toBe(false);
    expect(component.targetGradeStats).toEqual([]);
    component.ngOnDestroy();
  });

  it('cancels obsolete requests and resets filters when the unit changes', () => {
    const {component, service, units} = setup();
    const pending: Subject<TaskStatusStats> = new Subject();
    service.taskStatusCountByTutorial.mockReturnValueOnce(pending);
    component.ngOnInit();
    expect(component.statisticsLoading).toBe(true);
    component.tutorialId = 5;
    units.next({id: 2} as Unit);
    expect(pending.observed).toBe(false);
    expect(component.tutorialId).toBeNull();
    pending.next({99: {}});
    expect(component.taskStatusStats).toEqual({});
    component.ngOnDestroy();
    units.next({id: 3} as Unit);
    expect(service.targetGradeStats).toHaveBeenCalledTimes(2);
  });

  it('does not fetch until a unit is available', () => {
    const {component, service} = setup();
    component.loadStatistics();
    expect(service.targetGradeStats).not.toHaveBeenCalled();
    expect(component.statisticsLoading).toBe(false);
  });
});
