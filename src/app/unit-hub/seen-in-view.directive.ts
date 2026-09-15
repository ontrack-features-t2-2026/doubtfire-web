import {
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
} from '@angular/core';

/**
 * Emits once when the element has been mostly on screen for a moment, so an
 * announcement the student actually looked at can count as read. Scrolling past
 * quickly does not count.
 */
@Directive({
  selector: '[hubSeenInView]',
  standalone: true,
})
export class SeenInViewDirective implements OnInit, OnDestroy {
  /** How long it has to stay in view, in ms. */
  readonly seenAfter = input(1500);
  /** Share of the element that has to be visible. */
  readonly seenRatio = input(0.6);
  readonly hubSeenInView = output<void>();

  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private observer?: IntersectionObserver;
  private timer?: ReturnType<typeof setTimeout>;
  private done = false;

  ngOnInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        ([entry]) => {
          const visible =
            entry.isIntersecting &&
            entry.intersectionRatio >= this.seenRatio() &&
            document.visibilityState === 'visible';
          if (visible && !this.timer && !this.done) {
            this.timer = setTimeout(() => this.fire(), this.seenAfter());
          } else if (!visible) {
            this.clearTimer();
          }
        },
        {threshold: [0, this.seenRatio(), 1]},
      );
      this.observer.observe(this.element.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this.observer?.disconnect();
  }

  private fire(): void {
    this.timer = undefined;
    this.done = true;
    this.observer?.disconnect();
    this.zone.run(() => this.hubSeenInView.emit());
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
