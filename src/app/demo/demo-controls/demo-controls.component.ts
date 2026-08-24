import {ChangeDetectionStrategy, Component, Inject, InjectionToken} from '@angular/core';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';
import {DemoModeStore} from '../demo-mode.store';
import {DEMO_PUSH_PREVIEW} from '../fixtures/push-preview.fixture';

export const DEMO_RELOAD: InjectionToken<() => void> = new InjectionToken('DEMO_RELOAD', {
  providedIn: 'root',
  factory: () => () => globalThis.location?.reload(),
});

@Component({
  selector: 'f-demo-controls',
  templateUrl: './demo-controls.component.html',
  styleUrls: ['./demo-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class DemoControlsComponent {
  readonly pushPreview = DEMO_PUSH_PREVIEW;

  readonly affectedSurfaces = [
    'All live local project cards, tasks, deadline warnings, filters, and recommendation scores',
    'The live notification bell, unread count, and notification history',
    'Live task-level peer comparison data returned by the local API',
    'A clearly labelled 42% unit-summary sample and anonymous burndown sample through today',
  ];

  constructor(
    readonly demoMode: DemoModeStore,
    @Inject(DEMO_RELOAD) private reload: () => void,
  ) {}

  setDemoMode(change: MatSlideToggleChange): void {
    if (change.checked === this.demoMode.enabled) {
      return;
    }

    this.demoMode.setEnabled(change.checked);
    this.reload();
  }
}
