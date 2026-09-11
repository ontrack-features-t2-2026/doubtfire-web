import {Component, Input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';

/**
 * Small, centered empty-state block (icon + message + optional hint) for tables
 * and lists that would otherwise show a header and blank space. Colours come from
 * the theme tokens so it flips light/dark for free.
 */
@Component({
  selector: 'f-empty-state',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
})
export class EmptyStateComponent {
  @Input() icon?: string;
  @Input() message = 'Nothing to show';
  @Input() hint?: string;
}
