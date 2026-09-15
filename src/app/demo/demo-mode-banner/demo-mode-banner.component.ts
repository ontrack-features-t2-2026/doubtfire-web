import {ChangeDetectionStrategy, Component} from '@angular/core';
import {DemoModeStore} from '../demo-mode.store';

@Component({
  selector: 'f-demo-mode-banner',
  templateUrl: './demo-mode-banner.component.html',
  styleUrls: ['./demo-mode-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class DemoModeBannerComponent {
  constructor(readonly demoMode: DemoModeStore) {}

  exitDemo(): void {
    this.demoMode.setEnabled(false);
  }
}
