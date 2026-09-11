import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Task} from 'src/app/api/models/task';
import {CalendarModalComponent} from './calendar-modal.component';

@Injectable({
  providedIn: 'root',
})
export class CalendarModalService {
  constructor(public dialog: MatDialog) {}

  public show(_task?: Task) {
    this.dialog.open(CalendarModalComponent, {
      // 'h-min' is a Tailwind class, not a CSS length, so Material dropped it and the
      // dialog kept an odd height. Size to content (capped at 90vh) so the disabled
      // state is compact and the enabled state grows then scrolls.
      height: 'min-content',
      maxHeight: '90vh',
      width: '800px',
      maxWidth: '95vw',
    });
  }
}
