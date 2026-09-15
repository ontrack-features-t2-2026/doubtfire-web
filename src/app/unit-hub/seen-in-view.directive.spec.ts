/* eslint-disable @angular-eslint/component-max-inline-declarations */
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {SeenInViewDirective} from './seen-in-view.directive';

@Component({
  standalone: true,
  imports: [SeenInViewDirective],
  template: `<div (hubSeenInView)="seen = seen + 1"></div>`,
})
class HostComponent {
  seen = 0;
}

describe('SeenInViewDirective', () => {
  let callback: IntersectionObserverCallback;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const report = (ratio: number) =>
    callback(
      [{isIntersecting: ratio > 0, intersectionRatio: ratio} as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

  it('fires once after staying mostly in view', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    report(0.8);
    vi.advanceTimersByTime(1500);
    report(0.9);
    vi.advanceTimersByTime(3000);
    expect(fixture.componentInstance.seen).toBe(1);
  });

  it('does not fire when scrolled past quickly', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    report(0.8);
    vi.advanceTimersByTime(600);
    report(0);
    vi.advanceTimersByTime(3000);
    expect(fixture.componentInstance.seen).toBe(0);
  });
});
