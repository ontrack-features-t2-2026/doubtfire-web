import {Component, Input, Output, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {UnitDefinition} from 'src/app/api/models/doubtfire-model';
import {UnitCardComponent} from '../../../../common/unit-card/unit-card.component';

@Component({
  selector: 'required-units-list',
  templateUrl: './required-units-list.component.html',
  styleUrls: ['./required-units-list.component.scss'],
  standalone: true,
  imports: [CommonModule, DragDropModule, UnitCardComponent],
})
export class RequiredUnitsListComponent {
  @Input() units!: UnitDefinition[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Output() dropEvent = new EventEmitter<any>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDrop(event: any): void {
    this.dropEvent.emit(event);
  }

  getDragData(unit: UnitDefinition) {
    return {
      unit: unit,
      sourceContainerId: 'requiredUnits',
    };
  }
}
