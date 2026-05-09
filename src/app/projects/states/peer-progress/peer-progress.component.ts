import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {Project} from 'src/app/api/models/doubtfire-model';
import {GlobalStateService} from '../index/global-state.service';

@Component({
  selector: 'f-peer-progress',
  templateUrl: 'peer-progress.component.html',
  styleUrls: ['peer-progress.component.scss'],
})
export class PeerProgressComponent implements OnDestroy {
  public project: Project | null = null;

  private readonly viewSubscription: Subscription;

  constructor(private globalStateService: GlobalStateService) {
    // Mirrors the context-access pattern used by ProjectPlanComponent: the parent
    // state (`projects/index`) loads the Project and broadcasts it via
    // `GlobalStateService.setView('PROJECT', project)` once ready.
    this.viewSubscription = this.globalStateService.currentViewAndEntitySubject$.subscribe(
      (viewAndEntity) => {
        if (viewAndEntity?.viewType === 'PROJECT' && viewAndEntity.entity) {
          this.project = viewAndEntity.entity as Project;
        }
      },
    );
  }

  public ngOnDestroy(): void {
    this.viewSubscription?.unsubscribe();
  }
}
