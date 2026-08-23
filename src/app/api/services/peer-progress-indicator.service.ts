import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, map, of} from 'rxjs';
import API_URL from 'src/app/config/constants/apiUrl';
import {PeerProgressIndicator} from '../models/peer-progress-indicator';
import {PeerProgressUnitSummary} from '../models/peer-progress-unit-summary';
import {
  DISABLED_STATE,
  NORMAL_STATE,
  STALE_STATE,
  SUPPRESSED_STATE,
  UNAVAILABLE_STATE,
  ZERO_PERCENT_STATE,
} from './mock/peer-progress-indicator.mock';

interface PeerProgressIndicatorResponse {
  task_definition_id: number;
  unit_id: number;
  target_grade: number | null;
  submitted_percentage: number | null;
  is_suppressed: boolean;
  is_stale: boolean;
  is_feature_enabled: boolean;
  last_updated_at: string | null;
  unavailable_message: string;
}

@Injectable({
  providedIn: 'root',
})
export class PeerProgressIndicatorService {
  constructor(private httpClient: HttpClient) {}

  getIndicator(projectId: number, taskDefinitionId: number): Observable<PeerProgressIndicator> {
    const url = `${API_URL}/projects/${projectId}/task_def_id/${taskDefinitionId}/peer_progress`;

    return this.httpClient.get<PeerProgressIndicatorResponse>(url).pipe(
      map((response) => ({
        taskDefinitionId: response.task_definition_id,
        unitId: response.unit_id,
        targetGrade: response.target_grade,
        submittedPercentage: response.submitted_percentage,
        isSuppressed: response.is_suppressed,
        isStale: response.is_stale,
        isFeatureEnabled: response.is_feature_enabled,
        lastUpdatedAt: response.last_updated_at,
        unavailableMessage: response.unavailable_message,
      })),
    );
  }

  /**
   * Builds a privacy-safe unit-summary fixture for PPI-F02 tests and demos.
   *
   * This is mock-only. It must not be treated as the live PPI-F01 production
   * adapter, and the caller-supplied target grade must never become the design
   * of a future live endpoint.
   */
  getMockUnitSummary(
    unitId: number,
    targetGrade: number,
    studentPercentage: number | null,
    state: 'normal' | 'zero' | 'suppressed' | 'unavailable' | 'stale' | 'disabled',
  ): Observable<PeerProgressUnitSummary> {
    const cohort = this.resolveState(state);

    return of({
      unitId,
      targetGrade,
      studentPercentage,
      submittedPercentage: cohort.submittedPercentage,
      isSuppressed: cohort.isSuppressed,
      isStale: cohort.isStale,
      isFeatureEnabled: cohort.isFeatureEnabled,
      lastUpdatedAt: cohort.lastUpdatedAt,
      unavailableMessage: cohort.unavailableMessage,
    });
  }

  private resolveState(state: string): PeerProgressIndicator {
    switch (state) {
      case 'normal':
        return NORMAL_STATE;
      case 'zero':
        return ZERO_PERCENT_STATE;
      case 'suppressed':
        return SUPPRESSED_STATE;
      case 'unavailable':
        return UNAVAILABLE_STATE;
      case 'stale':
        return STALE_STATE;
      case 'disabled':
        return DISABLED_STATE;
      default:
        return UNAVAILABLE_STATE;
    }
  }
}
