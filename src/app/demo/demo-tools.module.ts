import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {RouterModule} from '@angular/router';
import {DemoControlsComponent} from './demo-controls/demo-controls.component';
import {DemoModeBannerComponent} from './demo-mode-banner/demo-mode-banner.component';
import {PpiPreviewComponent} from './ppi-preview/ppi-preview.component';

@NgModule({
  declarations: [DemoControlsComponent, DemoModeBannerComponent],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSlideToggleModule,
    PpiPreviewComponent,
  ],
  exports: [DemoModeBannerComponent],
})
export class DemoToolsModule {}
