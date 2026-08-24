import {PeerProgressState} from 'src/app/api/models/peer-progress';
import {PeerProgressIndicator} from 'src/app/api/models/peer-progress-indicator';
import {PeerProgressUnitSummary} from 'src/app/api/models/peer-progress-unit-summary';

export type DemoPeerProgressState =
  | 'normal'
  | 'zero'
  | 'suppressed'
  | 'unavailable'
  | 'stale'
  | 'disabled';

const currentTimestamp = (): string => new Date().toISOString();

export const NORMAL_STATE: PeerProgressIndicator = {
  taskDefinitionId: 0,
  unitId: 0,
  targetGrade: 0,
  submittedPercentage: 42,
  isSuppressed: false,
  isStale: false,
  isFeatureEnabled: true,
  lastUpdatedAt: currentTimestamp(),
  unavailableMessage: '',
};

export const ZERO_PERCENT_STATE: PeerProgressIndicator = {
  ...NORMAL_STATE,
  submittedPercentage: 0,
};

export const SUPPRESSED_STATE: PeerProgressIndicator = {
  ...NORMAL_STATE,
  submittedPercentage: null,
  isSuppressed: true,
  unavailableMessage: 'Not enough students to show progress.',
};

export const UNAVAILABLE_STATE: PeerProgressIndicator = {
  ...NORMAL_STATE,
  submittedPercentage: null,
  unavailableMessage: 'Progress unavailable.',
};

export const STALE_STATE: PeerProgressIndicator = {
  ...NORMAL_STATE,
  submittedPercentage: null,
  isStale: true,
  lastUpdatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  unavailableMessage: 'Peer progress is currently unavailable.',
};

export const DISABLED_STATE: PeerProgressIndicator = {
  ...NORMAL_STATE,
  submittedPercentage: null,
  isFeatureEnabled: false,
  unavailableMessage: 'Peer Progress Indicator is disabled for this unit.',
};

export const DEMO_WEEKLY_REMAINING: readonly number[] = [
  1.0, 0.98, 0.93, 0.88, 0.8, 0.73, 0.66, 0.58, 0.51, 0.44, 0.36, 0.28, 0.2, 0.13, 0.07, 0.02, 0.0,
];

export const DEMO_PEER_MEDIAN_STATE: PeerProgressState = 'ready';

export function createDemoUnitSummary(
  unitId: number,
  targetGrade: number,
  studentPercentage: number | null,
  state: DemoPeerProgressState = 'normal',
): PeerProgressUnitSummary {
  const cohort = demoPeerProgressState(state);

  return {
    unitId,
    targetGrade,
    studentPercentage,
    submittedPercentage: cohort.submittedPercentage,
    isSuppressed: cohort.isSuppressed,
    isStale: cohort.isStale,
    isFeatureEnabled: cohort.isFeatureEnabled,
    lastUpdatedAt: cohort.lastUpdatedAt,
    unavailableMessage: cohort.unavailableMessage,
  };
}

export function createMaskedPeerProgressIndicator(taskDefinitionId: number): PeerProgressIndicator {
  return {
    ...DISABLED_STATE,
    taskDefinitionId,
    unavailableMessage: 'Enable demo mode to show live peer comparison data.',
  };
}

function demoPeerProgressState(state: DemoPeerProgressState): PeerProgressIndicator {
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
  }
}
