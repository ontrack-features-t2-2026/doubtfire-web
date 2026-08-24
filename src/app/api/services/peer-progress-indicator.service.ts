import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, map, of} from 'rxjs';
import API_URL from 'src/app/config/constants/apiUrl';
import {DemoModeStore} from 'src/app/demo/demo-mode.store';
import {
  DemoPeerProgressState,
  createDemoUnitSummary,
  createMaskedPeerProgressIndicator,
} from 'src/app/demo/fixtures/peer-progress-demo.fixtures';
import {PeerProgressIndicator} from '../models/peer-progress-indicator';
import {PeerProgressUnitSummary} from '../models/peer-progress-unit-summary';

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
  constructor(
    private httpClient: HttpClient,
    private demoMode: DemoModeStore,
  ) {}

  getIndicator(projectId: number, taskDefinitionId: number): Observable<PeerProgressIndicator> {
    if (this.demoMode.shouldMaskApiData) {
      return of(createMaskedPeerProgressIndicator(taskDefinitionId));
    }

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
  getDemoUnitSummary(
    unitId: number,
    targetGrade: number,
    studentPercentage: number | null,
    state: DemoPeerProgressState,
  ): Observable<PeerProgressUnitSummary> {
    return of(createDemoUnitSummary(unitId, targetGrade, studentPercentage, state));
  }
}
