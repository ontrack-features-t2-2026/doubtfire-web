import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatListModule} from '@angular/material/list';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'coursemap',
  templateUrl: './coursemap.component.html',
  styleUrls: ['./coursemap.component.scss'],
  standalone: true,
  imports: [CommonModule, MatListModule, DragDropModule, MatIconModule],
})
export class CoursemapComponent {
  requiredUnits = ['SIT1', 'SIT2', 'SIT3', 'SIT4', 'SIT5', 'SIT6'];

  years = [
    {
      year: 2023,
      trimester1: ['Course 1', 'Course 2'],
      trimester2: ['Course 3', 'Course 4'],
      trimester3: ['Course 5', 'Course 6'],
    },
  ];

  allTrimesters = [this.years[0].trimester1, this.years[0].trimester2, this.years[0].trimester3];

  get connectedDropLists(): string[] {
    const dropListIds: string[] = ['requiredUnits'];
    this.years.forEach((_, i) => {
      dropListIds.push(`trimester1-${i}`, `trimester2-${i}`, `trimester3-${i}`);
    });
    return dropListIds;
  }

  addYear() {
    const nextYear = this.years.length > 0 ? this.years[this.years.length - 1].year + 1 : new Date().getFullYear();
    const newYear = {
      year: nextYear,
      trimester1: [],
      trimester2: [],
      trimester3: [],
    };
    this.years.push(newYear);
  }

  deleteYear(index: number) {
    this.years.splice(index, 1);
  }

  constructor() {}

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }
}
