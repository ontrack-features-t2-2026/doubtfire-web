import {CourseUnit} from './course-map.models';

export interface DraggedUnitData {
  unit: CourseUnit;
  sourceContainerId: 'requiredUnits' | 'electiveUnits' | 'slot';
  sourceYearIndex?: number;
  sourceTrimesterKey?: 'trimester1' | 'trimester2' | 'trimester3';
  sourceSlotIndex?: number;
}

export interface DropResult {
  success: boolean;
  message?: string;
}
