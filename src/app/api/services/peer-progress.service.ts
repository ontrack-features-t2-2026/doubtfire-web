import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {PeerMedianPoint, PeerProgressResponse, PeerProgressState} from '../models/peer-progress';
import {Project} from '../models/project';
import {MappingFunctions} from './mapping-fn';

@Injectable({
  providedIn: 'root',
})
export class PeerProgressService {
  private static readonly MOCK_WEEKLY_REMAINING = [
    1.0, 0.98, 0.93, 0.88, 0.8, 0.73, 0.66, 0.58, 0.51, 0.44, 0.36, 0.28, 0.2, 0.13, 0.07, 0.02,
    0.0,
  ];

  /**
   * Temporary proof-of-concept state.
   *
   * The future authorised backend must decide whether the result is ready,
   * suppressed, unavailable or disabled. It must not send the raw cohort size
   * to the browser.
   */
  private static readonly MOCK_STATE: PeerProgressState = 'ready';

  public getCohortMedian(
    project: Project,
    targetGrade: number = project.targetGrade,
  ): Observable<PeerProgressResponse> {
    const state = PeerProgressService.MOCK_STATE;

    return of({
      project_id: project.id,
      target_grade: targetGrade,
      state,
      median_burndown:
        state === 'ready'
          ? this.sampleProfile(project, PeerProgressService.MOCK_WEEKLY_REMAINING)
          : [],
    });
  }

  private sampleProfile(project: Project, profile: number[]): PeerMedianPoint[] {
    const weeks = MappingFunctions.step(
      project.unit.startDate.getTime(),
      project.unit.endDate.getTime(),
      MappingFunctions.weeksMs(1),
    );

    return weeks.map((time, week) => ({
      date: new Date(time).toISOString(),
      remaining: profile[Math.round((week / Math.max(weeks.length - 1, 1)) * (profile.length - 1))],
    }));
  }
}
