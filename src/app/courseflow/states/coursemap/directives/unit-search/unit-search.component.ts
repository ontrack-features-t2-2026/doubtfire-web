import {Component, Input, Output, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {Unit} from 'src/app/api/models/doubtfire-model';

@Component({
  selector: 'unit-search',
  templateUrl: './unit-search.component.html',
  styleUrls: ['./unit-search.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class UnitSearchComponent {
  @Input() availableUnits!: Unit[];
  @Output() unitAdded = new EventEmitter<Unit>();

  unitCode = '';
  errorMessage: string | null = null;

  onSubmit(): void {
    if (!this.unitCode) {
      this.errorMessage = 'Please enter a unit code';
      return;
    }

    const trimmedCode = this.unitCode.trim().toUpperCase();
    const foundUnit = this.availableUnits.find((unit) => unit.code === trimmedCode);

    if (foundUnit) {
      this.unitAdded.emit(foundUnit);
      this.unitCode = '';
      this.errorMessage = null;
    } else {
      this.errorMessage = `Unit code ${trimmedCode} not found in available units`;
    }
  }
}
