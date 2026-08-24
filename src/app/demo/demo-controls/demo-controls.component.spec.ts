import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';
import {SwPush} from '@angular/service-worker';
import {DemoModeStore} from '../demo-mode.store';
import {DemoToolsModule} from '../demo-tools.module';
import {DEMO_RELOAD, DemoControlsComponent} from './demo-controls.component';

describe('DemoControlsComponent', () => {
  let fixture: ComponentFixture<DemoControlsComponent>;
  let demoMode: {
    available: boolean;
    enabled: boolean;
    setEnabled: ReturnType<typeof vi.fn>;
  };
  let reload: ReturnType<typeof vi.fn>;
  let requestPermission: ReturnType<typeof vi.fn>;
  let requestSubscription: ReturnType<typeof vi.fn>;
  let httpTesting: HttpTestingController;
  let originalNotification: typeof Notification | undefined;

  beforeEach(async () => {
    demoMode = {available: true, enabled: false, setEnabled: vi.fn()};
    reload = vi.fn();
    requestPermission = vi.fn();
    requestSubscription = vi.fn();
    originalNotification = globalThis.Notification;
    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: {permission: 'default', requestPermission},
    });

    await TestBed.configureTestingModule({
      imports: [DemoToolsModule, NoopAnimationsModule],
      providers: [
        {provide: DemoModeStore, useValue: demoMode},
        {provide: DEMO_RELOAD, useValue: reload},
        {provide: SwPush, useValue: {requestSubscription}},
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoControlsComponent);
    fixture.detectChanges();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: originalNotification,
    });
  });

  it('shows an accessible control and an exact description of affected surfaces', () => {
    const text = fixture.nativeElement.textContent;
    const toggle = fixture.nativeElement.querySelector('mat-slide-toggle');

    expect(toggle.getAttribute('aria-describedby')).toBe('demo-mode-description');
    expect(text).toContain('Demo mode off');
    expect(text).toContain('Off — quiet baseline');
    expect(text).toContain('one baseline unit (DEMO20007 when available)');
    expect(text).toContain('On — complete walkthrough');
    expect(text).toContain('local 25-student cohort at roughly 40%');
    expect(text).toContain('all seven curated local notifications');
    expect(text).toContain('live local project cards');
    expect(text).toContain('live notification bell');
    expect(text).toContain('Live task-level peer comparison');
    expect(text).toContain('42% unit-summary sample');
  });

  it('persists the switch and reloads to avoid mixed entity caches', () => {
    fixture.componentInstance.setDemoMode({checked: true} as MatSlideToggleChange);

    expect(demoMode.setEnabled).toHaveBeenCalledWith(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('renders a visual-only push preview without browser, SwPush, or API calls', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Preview only');
    expect(text).toContain('Feedback is ready');
    expect(text).toContain('Open My Profile for real notifications');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/edit_profile');
    expect(requestPermission).not.toHaveBeenCalled();
    expect(requestSubscription).not.toHaveBeenCalled();
    httpTesting.expectNone((request) => request.url.includes('/push_subscriptions'));
  });
});
