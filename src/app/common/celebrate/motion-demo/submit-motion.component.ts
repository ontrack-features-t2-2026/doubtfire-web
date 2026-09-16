import {ChangeDetectionStrategy, Component, type QueryList, ViewChildren} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {prefersReducedMotion} from '../reduced-motion';
import {SubmitFlowLabComponent, type SubmitFlowVariant} from './submit-flow-lab.component';

interface VariantCard {
  variant: SubmitFlowVariant;
  name: string;
  idea: string;
  cost: string;
}

/**
 * Six takes on the same handover, side by side. The panel markup is shared, so
 * the difference between any two of these is only their stylesheet.
 */
@Component({
  selector: 'app-submit-motion',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, SubmitFlowLabComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './submit-motion.component.html',
  styleUrl: './submit-motion.component.scss',
})
export class SubmitMotionComponent {
  @ViewChildren(SubmitFlowLabComponent) private panels?: QueryList<SubmitFlowLabComponent>;

  public readonly reducedMotion = prefersReducedMotion();

  public readonly variants: VariantCard[] = [
    {
      variant: 'blur',
      name: '1. Blur',
      idea: 'Everything softens away, changes underneath, and sharpens back.',
      cost: 'What is shipped now. Safe, but the panel goes vague for a moment and nothing leads.',
    },
    {
      variant: 'lift',
      name: '2. Lift',
      idea: 'The old line leaves upward, the new one arrives from below, staggered.',
      cost: 'Direction carries the sense of finishing. Two lines moving at once can read as busy.',
    },
    {
      variant: 'circle',
      name: '3. Circle led',
      idea: 'The mark grows first. The words clear out, then catch up to it.',
      cost: 'The clearest subject of the three. The longest, at about 700ms end to end.',
    },
    {
      variant: 'wipe',
      name: '4. Wipe',
      idea: 'A clip runs down the text and back, so the words are uncovered, not faded.',
      cost: 'Nothing moves, so a long headline stays steady. Subtle enough to miss.',
    },
    {
      variant: 'collapse',
      name: '5. Collapse',
      idea: 'The bar draws into the middle, the circle takes the hit, the mark draws out.',
      cost: 'Treats the bar and the mark as one object. The most deliberate, and the slowest.',
    },
    {
      variant: 'settle',
      name: '6. Settle',
      idea: 'The whole panel dips and comes back as one gesture.',
      cost: 'Simplest to reason about. Closest to a plain crossfade, so it says the least.',
    },
  ];

  public playAll(): void {
    this.panels?.forEach((panel) => panel.play());
  }

  public resetAll(): void {
    this.panels?.forEach((panel) => panel.reset());
  }
}
