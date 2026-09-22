import confetti from 'canvas-confetti';
import {Injectable, InjectionToken, inject} from '@angular/core';

export const CONFETTI: InjectionToken<typeof confetti> = new InjectionToken('Confetti', {
  providedIn: 'root',
  factory: () => confetti,
});

@Injectable({
  providedIn: 'root',
})
export class ConfettiService {
  private readonly launch = inject(CONFETTI);

  public canon(x: number = 0, y: number = 0, angle = 210): void {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    this.launch({
      angle: angle,
      spread: 80,
      particleCount: 100,
      origin: {y: y, x: x},
    });
  }
}
