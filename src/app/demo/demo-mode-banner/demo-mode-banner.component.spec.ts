import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import {DemoModeStore} from '../demo-mode.store';
import {DemoToolsModule} from '../demo-tools.module';
import {DemoModeBannerComponent} from './demo-mode-banner.component';

describe('DemoModeBannerComponent', () => {
  let fixture: ComponentFixture<DemoModeBannerComponent>;
  let enabled: BehaviorSubject<boolean>;
  let setEnabled: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    enabled = new BehaviorSubject(true);
    setEnabled = vi.fn((value: boolean) => enabled.next(value));

    await TestBed.configureTestingModule({
      imports: [DemoToolsModule, NoopAnimationsModule],
      providers: [
        {
          provide: DemoModeStore,
          useValue: {enabled$: enabled.asObservable(), setEnabled},
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoModeBannerComponent);
    fixture.detectChanges();
  });

  it('uses understandable synthetic-data wording and stable selectors', () => {
    expect(fixture.nativeElement.textContent).toContain('Demo walkthrough on.');
    expect(fixture.nativeElement.textContent).toContain('synthetic local data');
    expect(fixture.nativeElement.querySelector('[data-testid="demo-mode-banner"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="demo-controls-link"]')).toBeTruthy();
  });

  it('exits without reloading the application', () => {
    fixture.componentInstance.exitDemo();
    expect(setEnabled).toHaveBeenCalledWith(false);
  });
});
