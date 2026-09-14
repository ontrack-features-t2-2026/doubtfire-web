import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';
import {DemoModeStore} from '../demo-mode.store';
import {DemoScenarioRegistryService} from '../demo-scenario-registry.service';

@Component({
  selector: 'f-demo-controls',
  templateUrl: './demo-controls.component.html',
  styleUrls: ['./demo-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class DemoControlsComponent {
  readonly scenario$ = this.registry.scenario$;

  constructor(
    readonly demoMode: DemoModeStore,
    readonly registry: DemoScenarioRegistryService,
  ) {}

  setDemoMode(change: MatSlideToggleChange): void {
    this.demoMode.setEnabled(change.checked);
  }

  statusLabel(status: string): string {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
