import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {PeerMedianPoint, PeerProgressResponse} from '../models/peer-progress';
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
   * The chart's insufficient-cohort state is 
   * displayed by dropping this below 'MINIMUM_COHORT_SIZE'
   */
  private static readonly MOCK_COHORT_SIZE = 24;

  private static readonly MOCK_MY_PROGRESS = [
    1.0, 1.0, 0.97, 0.97, 0.88, 0.88, 0.74, 0.7, 0.62, 0.55, 0.48, 0.4, 0.28, 0.18, 0.08, 0.02, 0.0,
  ];

  public getCohortMedian(project: Project): Observable<PeerProgressResponse> {
    return of({
      project_id: project.id,
      target_grade: project.targetGrade,
      cohort_size: PeerProgressService.MOCK_COHORT_SIZE,
      median_burndown: this.sampleProfile(project, PeerProgressService.MOCK_WEEKLY_REMAINING),
    });
  }

  /**
   * This line has a real source already -- `Project.refreshBurndownChartData()` computes it from
   * the student's own tasks. Delete this method and `MOCK_MY_PROGRESS` once the
   * chart no longer needs demo data; nothing needs to replace them.
   */
  public getMyProgressMock(project: Project): Observable<PeerMedianPoint[]> {
    return of(this.sampleProfile(project, PeerProgressService.MOCK_MY_PROGRESS));
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
