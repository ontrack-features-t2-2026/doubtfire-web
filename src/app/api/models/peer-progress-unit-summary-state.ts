import {PeerProgressUiState} from './peer-progress-indicator-state';
import {PeerProgressUnitSummary} from './peer-progress-unit-summary';

export interface PeerProgressUnitSummaryViewModel {
  state: PeerProgressUiState;
  data: PeerProgressUnitSummary | null;
  message: string | null;
}

const GENERIC_ERROR_MESSAGE = 'Could not load peer progress. Please try again.';

// Same priority order as resolvePeerProgressState (peer-progress-indicator-state.ts) --
// unit-level summaries resolve to the same UI states as the task-level widget, just
// over PeerProgressUnitSummary data instead of PeerProgressIndicator.
export function resolvePeerProgressUnitSummaryState(
  loading: boolean,
  error: unknown | null,
  data: PeerProgressUnitSummary | null,
): PeerProgressUnitSummaryViewModel {
  if (loading) {
    return {state: 'loading', data: null, message: null};
  }

  if (error || !data) {
    return {state: 'error', data: null, message: GENERIC_ERROR_MESSAGE};
  }

  if (!data.isFeatureEnabled) {
    return {state: 'disabled', data, message: data.unavailableMessage};
  }

  if (data.isSuppressed) {
    return {state: 'hidden', data, message: data.unavailableMessage};
  }

  if (data.isStale) {
    return {state: 'stale', data, message: data.unavailableMessage};
  }

  if (data.submittedPercentage === null) {
    return {state: 'unavailable', data, message: data.unavailableMessage};
  }

  if (data.submittedPercentage === 0) {
    return {state: 'no-data', data, message: null};
  }

  return {state: 'success', data, message: null};
}
