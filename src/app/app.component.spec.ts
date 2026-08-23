// MN-C03 targeted startup and teardown test.
import {describe, expect, it, vi} from 'vitest';
import {Renderer2} from '@angular/core';
import {Router} from '@angular/router';
import {Subject} from 'rxjs';
import {PushNotificationClickService} from 'src/app/api/services/push-notification-click.service';
import {AppComponent} from './app.component';

describe('AppComponent notification-click lifecycle', () => {
  it('starts click routing at app startup and stops it at teardown', () => {
    const events: Subject<unknown> = new Subject();
    const router = {
      url: '/home',
      events: events.asObservable(),
    } as unknown as Router;
    const renderer = {
      setStyle: vi.fn(),
    } as unknown as Renderer2;
    const clickRouting = {
      start: vi.fn(),
      stop: vi.fn(),
    } as unknown as PushNotificationClickService;

    const component = new AppComponent(router, renderer, clickRouting);
    component.ngOnInit();

    expect(clickRouting.start).toHaveBeenCalledOnce();

    component.ngOnDestroy();

    expect(clickRouting.stop).toHaveBeenCalledOnce();
  });
});
