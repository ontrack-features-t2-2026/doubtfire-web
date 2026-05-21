import {Component, Input} from '@angular/core';
import {TaskStatusEnum} from '../api/models/task-status';

export type DashboardTask = {
  title: string;
  subtitle: string;
  abbreviation: string;
  color: string;
  comments: number;
  status: TaskStatusEnum;
  date: Date;
  weight: number;
};

@Component({
  selector: 'f-dashboard-list-item',
  templateUrl: './dashboard-list-item.component.html',
})
export class DashboardListItemComponent {
  @Input() task: DashboardTask;
}
