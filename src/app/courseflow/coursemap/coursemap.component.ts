import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'coursemap',
  templateUrl: './coursemap.component.html',
  styleUrls: ['./coursemap.component.scss'],
  standalone: true,
  imports: [CommonModule, MatListModule, DragDropModule],
})
export class CoursemapComponent implements OnInit {

  todo = ['Get to work', 'Pick up groceries', 'Go home', 'Fall asleep'];
  trimester1 = ['Exercise', 'Study'];
  trimester2 = ['Read a book'];

  constructor() {}

  ngOnInit(): void {}

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
}
