import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {NgxSkeletonLoaderModule} from 'ngx-skeleton-loader';

export type SkeletonShape = 'row' | 'card';

/**
 * A repeated shimmer placeholder that stands in for the rows or cards a list
 * will render once its data arrives.
 *
 * Wraps ngx-skeleton-loader, already used throughout the app for hand-built
 * skeletons, rather than a second shimmer implementation. This adds the
 * declarative shape-plus-count surface those call sites do not have, it does
 * not replace them.
 */
@Component({
  selector: 'f-skeleton-loader',
  standalone: true,
  imports: [NgxSkeletonLoaderModule],
  templateUrl: './skeleton-loader.component.html',
  styleUrl: './skeleton-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class SkeletonLoaderComponent {
  @Input() shape: SkeletonShape = 'row';
  @Input() count = 3;

  get placeholders(): number[] {
    return Array.from({length: Math.max(0, this.count)}, (_unused, index) => index);
  }
}
