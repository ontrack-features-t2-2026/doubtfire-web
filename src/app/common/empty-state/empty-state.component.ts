import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

/**
 * A centered icon, heading, message and optional action for a collection that
 * has nothing in it. Render it only when the collection is confirmed empty,
 * not while it is still loading and not when the load failed - "you have
 * none" and "we could not find out" are different states and only one of them
 * has a way out.
 */
@Component({
  selector: 'f-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class EmptyStateComponent {
  @Input() icon: string;
  @Input() heading: string;
  @Input() message: string;

  /** Omit to render no action. */
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();
}
