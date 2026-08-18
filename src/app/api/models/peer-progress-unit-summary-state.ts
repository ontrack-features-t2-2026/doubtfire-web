import {PeerProgressUiState} from './peer-progress-indicator-state';
import {PeerProgressUnitSummary} from './peer-progress-unit-summary';

export interface PeerProgressUnitSummaryViewModel {
  state: PeerProgressUiState;
  data: PeerProgressUnitSummary | null;
  message: string | null;
}

const GENERIC_ERROR_MESSAGE = 'Could not load peer progress. Please try again.';

function withoutCohortPercentage(data: PeerProgressUnitSummary): PeerProgressUnitSummary {
  return {
    ...data,
    submittedPercentage: null,
  };
}

function withoutAnyPercentage(data: PeerProgressUnitSummary): PeerProgressUnitSummary {
  return {
    ...data,
    studentPercentage: null,
    submittedPercentage: null,
  };
}

/**
 * Converts unit-summary data into the shared PPI UI states.
 *
 * Privacy rule:
 * Hidden, unavailable and stale states must never retain an anonymous cohort
 * percentage, even when a malformed response contains one.
 *
 * Accuracy rule:
 * Disabled, loading and error states must not retain percentages that could be
 * mistaken for current information.
 */
export function resolvePeerProgressUnitSummaryState(
  loading: boolean,
  error: unknown | null,
  data: PeerProgressUnitSummary | null,
): PeerProgressUnitSummaryViewModel {
  if (loading) {
    return {state: 'loading', data: null, message: null};
  }

  if (error || !data) {
    return {
      state: 'error',
      data: null,
      message: GENERIC_ERROR_MESSAGE,
    };
  }

  if (!data.isFeatureEnabled) {
    return {
      state: 'disabled',
      data: withoutAnyPercentage(data),
      message: data.unavailableMessage,
    };
  }

  if (data.isSuppressed) {
    return {
      state: 'hidden',
      data: withoutCohortPercentage(data),
      message: data.unavailableMessage,
    };
  }

  if (data.isStale) {
    return {
      state: 'stale',
      data: withoutCohortPercentage(data),
      message: data.unavailableMessage,
    };
  }

  if (data.studentPercentage === null || data.submittedPercentage === null) {
    return {
      state: 'unavailable',
      data: withoutCohortPercentage(data),
      message: data.unavailableMessage,
    };
  }

  if (data.submittedPercentage === 0) {
    return {
      state: 'no-data',
      data,
      message: null,
    };
  }

  return {
    state: 'success',
    data,
    message: null,
  };
}
