import {ChangeDetectionStrategy, Component, ViewEncapsulation, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {AnimatedCheckComponent} from './animated-check.component';
import {CelebrationParticlesComponent} from './celebration-particles.component';
import {prefersReducedMotion} from './reduced-motion';

export interface PortfolioCelebrationFact {
  icon: string;
  label: string;
  value: string;
}

export interface PortfolioCelebrationData {
  unitCode: string;
  unitName?: string;
  headline: string;
  detail: string;
  facts: PortfolioCelebrationFact[];
  /** What happens between pressing the button and the document existing. */
  next: string;
}

/**
 * The end of a whole unit's work. A student reaches this once per unit per
 * trimester, which is rarer than anything else the app celebrates, so it is the
 * one moment allowed to take its time and to wait for the person rather than
 * timing itself out. Nothing here dismisses on its own.
 */
@Component({
  selector: 'f-portfolio-celebration',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    AnimatedCheckComponent,
    CelebrationParticlesComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The dialog surface is styled from here, every selector under .ot-portfolio
  // so nothing leaks out of it.
  encapsulation: ViewEncapsulation.None,
  templateUrl: './portfolio-celebration.component.html',
  styleUrl: './portfolio-celebration.component.scss',
})
export class PortfolioCelebrationComponent {
  public readonly data = inject<PortfolioCelebrationData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<PortfolioCelebrationComponent>>(MatDialogRef);

  public readonly reducedMotion = prefersReducedMotion();

  /** Rows settle in one after another. Held to a handful, so it stays a beat. */
  public factDelay(index: number): string {
    return this.reducedMotion ? '0ms' : `${1500 + Math.min(index, 4) * 140}ms`;
  }

  public close(): void {
    this.dialogRef.close();
  }
}
