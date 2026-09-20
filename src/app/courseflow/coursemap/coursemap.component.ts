import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {ActivatedRoute} from '@angular/router';
import {catchError, forkJoin, of, switchMap} from 'rxjs';
import {Unit, UnitDefinition} from 'src/app/api/models/doubtfire-model';
import {CourseMapUnit} from 'src/app/api/models/doubtfire-model';
import {CourseMapUnitService} from 'src/app/api/services/course-map-unit.service';
import {UnitDefinitionService} from 'src/app/api/services/unit-definition.service';
import {UnitService} from 'src/app/api/services/unit.service';

type CourseUnit = Unit | UnitDefinition;

interface SlotContext {
  yearIndex: number;
  trimesterKey: 'trimester1' | 'trimester2' | 'trimester3';
  slotIndex: number;
}

interface DraggedUnitData {
  unit: CourseUnit;
  sourceContainerId: 'requiredUnits' | 'electiveUnits' | 'slot';
  sourceYearIndex?: number;
  sourceTrimesterKey?: 'trimester1' | 'trimester2' | 'trimester3';
  sourceSlotIndex?: number;
}

@Component({
  selector: 'f-coursemap',
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './coursemap.component.html',
  styleUrls: ['./coursemap.component.scss'],
  standalone: true,
  imports: [
    DragDropModule,
    MatIconModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
  ],
})
export class CoursemapComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  constructor(
    private route: ActivatedRoute,
    private unitService: UnitService,
    private unitDefinitionService: UnitDefinitionService,
    private courseMapUnitService: CourseMapUnitService,
  ) {}

  unitCode = '';
  errorMessage: string | null = null;
  loadError: string | null = null;
  loading = true;
  units: Unit[] = [];
  requiredUnits: UnitDefinition[] = [];
  private definitions: UnitDefinition[] = [];
  private requiredCodes: Set<string> = new Set();

  readonly trimesterKeys: ('trimester1' | 'trimester2' | 'trimester3')[] = [
    'trimester1',
    'trimester2',
    'trimester3',
  ];

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.loading = true;
          this.loadError = null;
          this.errorMessage = null;
          this.requiredUnits = [];
          this.electiveUnits = [];
          this.years = [];
          this.addYear();
          const id = params.get('courseMapId');
          if (id !== null && !/^[1-9]\d*$/.test(id)) {
            this.loading = false;
            this.loadError = 'Invalid course map ID.';
            return of(null);
          }
          // A new draft does not read another user's map or create demo database records.
          return forkJoin({
            units: this.unitService.getUnits(),
            definitions: this.unitDefinitionService.getDefinitions(),
            slots: id ? this.courseMapUnitService.getCourseMapUnitsById(Number(id)) : of([]),
          }).pipe(
            catchError(() => {
              this.loading = false;
              this.loadError = 'Course data could not be loaded. Please try again later.';
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        if (!data) {
          return;
        }
        const {units, definitions, slots} = data;
        this.units = units;
        this.definitions = definitions;
        this.requiredUnits = [...definitions];
        this.requiredCodes = new Set(definitions.map((unit) => unit.code));
        this.populateYearsArray(slots);
        this.loading = false;
      });
  }

  populateYearsArray(courseMapUnits: CourseMapUnit[]): void {
    if (!courseMapUnits.length) {
      return;
    }
    const years = [];
    const placed: Set<string> = new Set();
    for (const slot of courseMapUnits) {
      const definition = this.definitions.find((item) => item.id === slot.unitId);
      const teachingUnit = this.units.find((item) => item.id === slot.unitId);
      if (definition && teachingUnit && definition.code !== teachingUnit.code) {
        this.errorMessage = 'Some saved course-map entries have ambiguous unit IDs.';
        continue;
      }
      const unit = definition ?? teachingUnit;
      if (
        !unit ||
        !Number.isInteger(slot.yearSlot) ||
        slot.yearSlot < 1 ||
        !Number.isInteger(slot.teachingPeriodSlot) ||
        slot.teachingPeriodSlot < 1 ||
        slot.teachingPeriodSlot > 3 ||
        !Number.isInteger(slot.unitSlot) ||
        slot.unitSlot < 1 ||
        slot.unitSlot > 4 ||
        placed.has(unit.code)
      ) {
        this.errorMessage = 'Some saved course-map entries could not be displayed.';
        continue;
      }
      let year = years.find((item) => item.year === slot.yearSlot);
      if (!year) {
        year = {
          year: slot.yearSlot,
          trimester1: Array(4).fill(null),
          trimester2: Array(4).fill(null),
          trimester3: Array(4).fill(null),
        };
        years.push(year);
      }
      const trimester = year[this.trimesterKeys[slot.teachingPeriodSlot - 1]];
      if (trimester[slot.unitSlot - 1]) {
        this.errorMessage = 'Some saved course-map entries occupy the same slot.';
        continue;
      }
      trimester[slot.unitSlot - 1] = unit;
      placed.add(unit.code);
    }
    if (years.length) {
      this.years = years.sort((a, b) => a.year - b.year);
    }
    this.requiredUnits = this.requiredUnits.filter((unit) => !placed.has(unit.code));
  }

  years = [
    {
      year: new Date().getFullYear(),
      trimester1: [null, null, null, null],
      trimester2: [null, null, null, null],
      trimester3: [null, null, null, null],
    },
  ];

  maxElectiveUnits = 5;
  electiveUnits: CourseUnit[] = [];

  getTrimesterNumber(key: string): number {
    return parseInt(key.replace('trimester', ''), 10);
  }

  getTrimesterIndex(key: string): number {
    return this.trimesterKeys.indexOf(key as 'trimester1' | 'trimester2' | 'trimester3');
  }

  get remainingSlots(): number {
    const totalElectivesUsed = this.electiveUnits.length + this.countElectivesInSlots();
    const remaining = this.maxElectiveUnits - totalElectivesUsed;
    return Math.max(0, remaining);
  }

  private countElectivesInSlots(): number {
    let count = 0;
    this.years.forEach((year) => {
      ['trimester1', 'trimester2', 'trimester3'].forEach((key) => {
        const trimesterKey = key as 'trimester1' | 'trimester2' | 'trimester3';
        if (year[trimesterKey]) {
          year[trimesterKey].forEach((unit: CourseUnit | null) => {
            if (unit) {
              // Check if the unit's ID is NOT in the requiredUnits list
              const isRequired = this.requiredCodes.has(unit.code);
              if (!isRequired) {
                // If it's not required, it's considered an elective for counting purposes
                count++;
              }
            }
          });
        }
      });
    });
    return count;
  }

  addYear() {
    const nextYear =
      this.years.length > 0 ? this.years[this.years.length - 1].year + 1 : new Date().getFullYear();
    const newYear = {
      year: nextYear,
      trimester1: Array(4).fill(null),
      trimester2: Array(4).fill(null),
      trimester3: Array(4).fill(null),
    };
    this.years.push(newYear);
  }

  private returnUnit(unit: CourseUnit): void {
    if (this.requiredCodes.has(unit.code)) {
      if (!this.requiredUnits.some((item) => item.code === unit.code)) {
        this.requiredUnits.push(unit as UnitDefinition);
      }
    } else if (!this.electiveUnits.some((item) => item.code === unit.code)) {
      this.electiveUnits.push(unit);
    }
  }

  deleteYear(index: number): void {
    const year = this.years[index];
    if (!year) {
      return;
    }
    this.trimesterKeys.forEach((key) =>
      year[key]?.forEach((unit) => unit && this.returnUnit(unit)),
    );
    this.years.splice(index, 1);
  }

  deleteTrimester(yearIndex: number, trimesterIndex: number): void {
    const year = this.years[yearIndex];
    const key = this.trimesterKeys[trimesterIndex];
    if (!year || !key) {
      return;
    }
    year[key]?.forEach((unit) => unit && this.returnUnit(unit));
    year[key] = null;
  }

  addTrimester(yearIndex: number) {
    const year = this.years[yearIndex];
    if (!year) {
      return;
    }

    if (!year.trimester1) {
      year.trimester1 = [null, null, null, null];
    } else if (!year.trimester2) {
      year.trimester2 = [null, null, null, null];
    } else if (!year.trimester3) {
      year.trimester3 = [null, null, null, null];
    } else {
      console.log('All three trimesters already exist.');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  countTrimesters(year: any): number {
    let trimesterCount = 0;
    if (year.trimester1) {
      trimesterCount++;
    }
    if (year.trimester2) {
      trimesterCount++;
    }
    if (year.trimester3) {
      trimesterCount++;
    }
    return trimesterCount;
  }

  drop(
    event: CdkDragDrop<SlotContext | CourseUnit[], SlotContext | CourseUnit[], DraggedUnitData>,
  ) {
    const previousContainer = event.previousContainer;
    const currentContainer = event.container;
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    // Data of the item being dragged (from [cdkDragData])
    const draggedData = event.item.data;
    if (!draggedData?.unit) {
      return;
    }
    const unitToMove = draggedData.unit;
    const source =
      draggedData.sourceContainerId === 'slot'
        ? this.years[draggedData.sourceYearIndex]?.[draggedData.sourceTrimesterKey]
        : previousContainer.data;
    const sourceIndex =
      draggedData.sourceContainerId === 'slot' ? draggedData.sourceSlotIndex : previousIndex;
    if (!Array.isArray(source) || source[sourceIndex] !== unitToMove) {
      return;
    }

    // Data of the target container (from [cdkDropListData])
    const targetContainerData = currentContainer.data;

    if (previousContainer.id === currentContainer.id) {
      // Moving within the same list (requiredUnits or electiveUnits)
      // This check prevents reordering within a slot itself
      if (draggedData.sourceContainerId !== 'slot') {
        moveItemInArray(currentContainer.data as CourseUnit[], previousIndex, currentIndex);
      }
    } else {
      const targetIsSlot =
        typeof targetContainerData === 'object' &&
        targetContainerData !== null &&
        'slotIndex' in targetContainerData;
      const sourceIsSlot = draggedData.sourceContainerId === 'slot';

      if (targetIsSlot) {
        // Dropping onto a slot
        const targetContext = targetContainerData as SlotContext;
        const {yearIndex, trimesterKey, slotIndex} = targetContext;
        const targetTrimesterArray = this.years[yearIndex]?.[trimesterKey];
        if (!targetTrimesterArray || slotIndex < 0 || slotIndex >= 4) {
          return;
        }
        const existingUnitInSlot = targetTrimesterArray[slotIndex];

        if (!existingUnitInSlot) {
          // Target slot is empty
          targetTrimesterArray[slotIndex] = unitToMove; // Place item in target

          if (sourceIsSlot) {
            // Moving from another slot - empty the source slot
            this.years[draggedData.sourceYearIndex!][draggedData.sourceTrimesterKey!][
              draggedData.sourceSlotIndex!
            ] = null;
          } else {
            // Moving from a list (required or elective) - remove from source list
            const sourceList = previousContainer.data as unknown as CourseUnit[];
            sourceList.splice(previousIndex, 1);
          }
        } else {
          // Target slot is occupied
          if (sourceIsSlot) {
            // Moving from another slot - SWAP
            targetTrimesterArray[slotIndex] = unitToMove; // Place dragged item in target
            // Place target's original item in source slot
            this.years[draggedData.sourceYearIndex!][draggedData.sourceTrimesterKey!][
              draggedData.sourceSlotIndex!
            ] = existingUnitInSlot;
          } else {
            // Moving from a list to an occupied slot - Prevent drop
            console.log('Cannot drop from list onto an occupied slot.');
            // Optionally, implement swap: add existingUnitInSlot back to sourceList, remove unitToMove from sourceList
            return;
          }
        }
      } else {
        // Dropping onto a list (requiredUnits or electiveUnits)
        const targetList = targetContainerData as CourseUnit[];
        if (
          (targetList === this.requiredUnits) !== this.requiredCodes.has(unitToMove.code) ||
          targetList.some((unit) => unit.code === unitToMove.code)
        ) {
          return;
        }

        if (sourceIsSlot) {
          // Moving from a slot to a list
          targetList.splice(currentIndex, 0, unitToMove); // Add item to target list at dropped position
          // Empty the source slot
          this.years[draggedData.sourceYearIndex!][draggedData.sourceTrimesterKey!][
            draggedData.sourceSlotIndex!
          ] = null;
        } else {
          // Moving between lists
          transferArrayItem(
            previousContainer.data as unknown as CourseUnit[],
            targetList,
            previousIndex,
            currentIndex,
          );
        }
      }
    }
  }

  fetchUnitByCode(): void {
    if (!this.unitCode.trim()) {
      this.errorMessage = 'Please enter a unit code';
      return;
    }
    const trimmedCode = this.unitCode.trim().toUpperCase();

    const alreadyInList = this.electiveUnits.some((unit) => unit.code === trimmedCode);
    if (alreadyInList) {
      this.errorMessage = `Unit ${trimmedCode} already in the elective list`;
      return;
    }

    let electiveAlreadyInSlots = false;
    this.years.forEach((year) => {
      ['trimester1', 'trimester2', 'trimester3'].forEach((key) => {
        const trimesterKey = key as 'trimester1' | 'trimester2' | 'trimester3';
        if (year[trimesterKey]) {
          year[trimesterKey].forEach((unit: CourseUnit | null) => {
            if (unit?.code === trimmedCode) {
              const isRequired = this.requiredCodes.has(unit.code);
              if (!isRequired) {
                electiveAlreadyInSlots = true;
              }
            }
          });
        }
      });
    });

    if (electiveAlreadyInSlots) {
      this.errorMessage = `Elective unit ${trimmedCode} already placed in the course map`;
      return;
    }

    const currentElectiveCount = this.electiveUnits.length + this.countElectivesInSlots();
    if (currentElectiveCount >= this.maxElectiveUnits) {
      this.errorMessage = `Cannot add more than ${this.maxElectiveUnits} elective units.`;
      return;
    }

    const foundUnit = this.units.find((unit) => unit.code === trimmedCode);

    if (foundUnit) {
      const isRequired = this.requiredCodes.has(foundUnit.code);
      if (isRequired) {
        this.errorMessage = `Unit ${trimmedCode} is a required unit, not an elective.`;
        return;
      }

      this.electiveUnits.push(foundUnit);
      this.unitCode = '';
      this.errorMessage = null;
    } else {
      this.errorMessage = `Unit code ${trimmedCode} not found in available units`;
    }
  }
  removeUnitFromSlot(
    yearIndex: number,
    trimesterKey: 'trimester1' | 'trimester2' | 'trimester3',
    slotIndex: number,
  ): void {
    const year = this.years[yearIndex];
    if (!year || !year[trimesterKey]) {
      console.error('Cannot remove unit: Invalid year or trimester');
      return;
    }

    const unitToRemove = year[trimesterKey][slotIndex];

    if (unitToRemove) {
      year[trimesterKey][slotIndex] = null;
      console.log(
        `Removed unit ${unitToRemove.code} from slot ${yearIndex}-${trimesterKey}-${slotIndex}`,
      );

      this.returnUnit(unitToRemove);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackByYear(index: number, year: any): number {
    return year.year;
  }

  trackBySlotIndex(index: number): number {
    return index;
  }
}
