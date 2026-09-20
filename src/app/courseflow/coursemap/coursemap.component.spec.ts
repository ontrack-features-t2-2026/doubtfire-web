import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, convertToParamMap} from '@angular/router';
import {BehaviorSubject, Subject, of, throwError} from 'rxjs';
import {CourseMapUnit, Unit, UnitDefinition} from 'src/app/api/models/doubtfire-model';
import {CourseMapUnitService} from 'src/app/api/services/course-map-unit.service';
import {UnitDefinitionService} from 'src/app/api/services/unit-definition.service';
import {UnitService} from 'src/app/api/services/unit.service';
import {CoursemapComponent} from './coursemap.component';

describe('CoursemapComponent after the Angular router migration', () => {
  let fixture: ComponentFixture<CoursemapComponent>;
  let component: CoursemapComponent;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const required: UnitDefinition = {id: 1, code: 'SIT101', name: 'Required', description: ''};
  const elective = {id: 2, code: 'SIT202', name: 'Elective'} as Unit;
  const another = {id: 3, code: 'SIT303', name: 'Another elective'} as Unit;
  let getUnits: ReturnType<typeof vi.fn>;
  let getDefinitions: ReturnType<typeof vi.fn>;
  let getSlots: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    params = new BehaviorSubject(convertToParamMap({}));
    getUnits = vi.fn().mockReturnValue(of([elective, another]));
    getDefinitions = vi.fn().mockReturnValue(of([required]));
    getSlots = vi.fn().mockReturnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [CoursemapComponent],
      providers: [
        {provide: ActivatedRoute, useValue: {paramMap: params}},
        {provide: UnitService, useValue: {getUnits}},
        {provide: UnitDefinitionService, useValue: {getDefinitions}},
        {provide: CourseMapUnitService, useValue: {getCourseMapUnitsById: getSlots}},
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CoursemapComponent);
    component = fixture.componentInstance;
  });

  function drop(
    unit: Unit | UnitDefinition,
    source: object,
    target: object,
    sourceData: object,
    sourceIndex = 0,
  ): void {
    component.drop({
      previousContainer: {id: 'source', data: source},
      container: {id: 'target', data: target},
      previousIndex: sourceIndex,
      currentIndex: 0,
      item: {data: {unit, ...sourceData}},
    } as unknown as Parameters<CoursemapComponent['drop']>[0]);
  }

  it('loads a new draft without reading a hard-coded map or writing demo data', () => {
    fixture.detectChanges();
    expect(getUnits).toHaveBeenCalledOnce();
    expect(getDefinitions).toHaveBeenCalledOnce();
    expect(getSlots).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
    expect(component.requiredUnits).toEqual([required]);
    expect(fixture.nativeElement.textContent).toContain('Changes in this draft are not saved');
  });

  it('renders a loading status before the catalog resolves', () => {
    const pending: Subject<UnitDefinition[]> = new Subject();
    getDefinitions.mockReturnValue(pending);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Loading');
    expect(fixture.nativeElement.querySelector('.coursemap')).toBeNull();
    pending.next([]);
    pending.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.coursemap')).not.toBeNull();
  });

  it('shows a load failure and can load another map after the failure', () => {
    getDefinitions.mockReturnValueOnce(throwError(() => new Error('404')));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.coursemap')).toBeNull();
    params.next(convertToParamMap({courseMapId: '8'}));
    fixture.detectChanges();
    expect(component.loadError).toBeNull();
    expect(getSlots).toHaveBeenCalledWith(8);
  });

  it('uses the current route ID and cancels a stale map request on navigation', () => {
    const old: Subject<CourseMapUnit[]> = new Subject();
    getSlots.mockReturnValueOnce(old).mockReturnValue(of([]));
    params.next(convertToParamMap({courseMapId: '8'}));
    fixture.detectChanges();
    params.next(convertToParamMap({courseMapId: '9'}));
    expect(old.observed).toBe(false);
    expect(getSlots.mock.calls).toEqual([[8], [9]]);
    fixture.destroy();
    params.next(convertToParamMap({courseMapId: '10'}));
    expect(getSlots).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid map IDs before making an API request', () => {
    params.next(convertToParamMap({courseMapId: '../1'}));
    fixture.detectChanges();
    expect(component.loadError).toBe('Invalid course map ID.');
    expect(getUnits).not.toHaveBeenCalled();
    expect(getSlots).not.toHaveBeenCalled();
  });

  it('places saved units in their one-based slots and keeps required classification', () => {
    params.next(convertToParamMap({courseMapId: '8'}));
    getSlots.mockReturnValue(
      of([{courseMapId: 8, unitId: 1, yearSlot: 2026, teachingPeriodSlot: 2, unitSlot: 3}]),
    );
    fixture.detectChanges();
    expect(component.years[0].trimester2).toEqual([null, null, required, null]);
    expect(component.requiredUnits).toEqual([]);
    expect(component.remainingSlots).toBe(5);
    component.removeUnitFromSlot(0, 'trimester2', 2);
    expect(component.requiredUnits).toEqual([required]);
    expect(component.electiveUnits).toEqual([]);
  });

  it('does not overwrite occupied saved slots or render invalid positions', () => {
    fixture.detectChanges();
    component.populateYearsArray([
      {courseMapId: 8, unitId: 1, yearSlot: 2026, teachingPeriodSlot: 1, unitSlot: 1},
      {courseMapId: 8, unitId: 2, yearSlot: 2026, teachingPeriodSlot: 1, unitSlot: 1},
      {courseMapId: 8, unitId: 3, yearSlot: 2026, teachingPeriodSlot: 4, unitSlot: 5},
    ]);
    expect(component.years[0].trimester1).toEqual([required, null, null, null]);
    expect(component.errorMessage).toBeTruthy();
  });

  it('rejects ambiguous IDs from separate required and elective catalogs', () => {
    getUnits.mockReturnValue(of([{...elective, id: required.id}]));
    fixture.detectChanges();
    component.populateYearsArray([
      {courseMapId: 8, unitId: 1, yearSlot: 2026, teachingPeriodSlot: 1, unitSlot: 1},
    ]);
    expect(component.years[0].trimester1).toEqual([null, null, null, null]);
    expect(component.requiredUnits).toEqual([required]);
    expect(component.errorMessage).toContain('ambiguous');
  });

  it('adds, moves, swaps and returns units without changing elective capacity', () => {
    fixture.detectChanges();
    component.unitCode = ' sit202 ';
    component.fetchUnitByCode();
    expect(component.electiveUnits).toEqual([elective]);
    const slot = {yearIndex: 0, trimesterKey: 'trimester1', slotIndex: 0};
    drop(elective, component.electiveUnits, slot, {sourceContainerId: 'electiveUnits'});
    expect(component.electiveUnits).toEqual([]);
    expect(component.years[0].trimester1[0]).toBe(elective);
    expect(component.remainingSlots).toBe(4);
    drop(
      required,
      component.requiredUnits,
      {...slot, slotIndex: 1},
      {sourceContainerId: 'requiredUnits'},
    );
    drop(
      elective,
      slot,
      {...slot, slotIndex: 1},
      {
        sourceContainerId: 'slot',
        sourceYearIndex: 0,
        sourceTrimesterKey: 'trimester1',
        sourceSlotIndex: 0,
      },
    );
    expect(component.years[0].trimester1.slice(0, 2)).toEqual([required, elective]);
    component.deleteTrimester(0, 0);
    expect(component.requiredUnits).toEqual([required]);
    expect(component.electiveUnits).toEqual([elective]);
    expect(component.remainingSlots).toBe(4);
  });

  it('does not replace an occupied slot with a unit dragged from a list', () => {
    fixture.detectChanges();
    const slot = {yearIndex: 0, trimesterKey: 'trimester1', slotIndex: 0};
    drop(required, component.requiredUnits, slot, {sourceContainerId: 'requiredUnits'});
    component.electiveUnits = [elective];
    drop(elective, component.electiveUnits, slot, {sourceContainerId: 'electiveUnits'});
    expect(component.electiveUnits).toEqual([elective]);
    expect(component.years[0].trimester1[0]).toBe(required);
  });

  it('returns planned required and elective units when a year is removed', () => {
    fixture.detectChanges();
    drop(
      required,
      component.requiredUnits,
      {yearIndex: 0, trimesterKey: 'trimester1', slotIndex: 0},
      {sourceContainerId: 'requiredUnits'},
    );
    component.years[0].trimester2[0] = elective;
    component.deleteYear(0);
    expect(component.requiredUnits).toEqual([required]);
    expect(component.electiveUnits).toEqual([elective]);
    component.addYear();
    expect(component.years[0].trimester1).toEqual([null, null, null, null]);
  });

  it('rejects blank, duplicate and required elective codes, including placed requirements', () => {
    fixture.detectChanges();
    component.unitCode = '  ';
    component.fetchUnitByCode();
    expect(component.errorMessage).toBe('Please enter a unit code');
    drop(
      required,
      component.requiredUnits,
      {yearIndex: 0, trimesterKey: 'trimester1', slotIndex: 0},
      {sourceContainerId: 'requiredUnits'},
    );
    component.units.push(required as unknown as Unit);
    component.unitCode = 'SIT101';
    component.fetchUnitByCode();
    expect(component.errorMessage).toContain('required unit');
    component.unitCode = 'SIT202';
    component.fetchUnitByCode();
    component.unitCode = 'SIT202';
    component.fetchUnitByCode();
    expect(component.electiveUnits).toEqual([elective]);
    expect(component.errorMessage).toContain('already');
  });
});
