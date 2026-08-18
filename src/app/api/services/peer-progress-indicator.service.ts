import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
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

@Injectable({
  providedIn: 'root',
})
export class PeerProgressIndicatorService {
  constructor() {}

  // At the moment, it returns mock PPI data for the given state. In future, this will call the real backend API.

  getIndicator(
    taskDefinitionId: number,
    unitId: number,
    targetGrade: number,
    state: 'normal' | 'zero' | 'suppressed' | 'unavailable' | 'stale' | 'disabled',
  ): Observable<PeerProgressIndicator> {
    const base = this.resolveState(state);

    return of({
      ...base,
      taskDefinitionId,
      unitId,
      targetGrade,
    });
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
