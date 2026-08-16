import {Component, Input} from '@angular/core';

@Component({
  selector: 'f-page-container',
  templateUrl: './page-container.component.html',
  standalone: false,
})
export class PageContainerComponent {
  @Input() fullWidth = false;
}