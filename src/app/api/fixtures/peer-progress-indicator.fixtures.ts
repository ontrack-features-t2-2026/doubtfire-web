import { PeerProgressIndicator } from '../models/peer-progress-indicator';

export const FIXTURE_NORMAL: PeerProgressIndicator = {
  taskDefinitionId: 12,
  unitId: 5,
  targetGrade: 2,
  submittedPercentage: 62.5,
  isSuppressed: false,
  isStale: false,
  isFeatureEnabled: true,
  lastUpdatedAt: '2026-08-14T03:15:00Z',
  unavailableMessage: '',
};

export const FIXTURE_ZERO_PERCENT: PeerProgressIndicator = {
  taskDefinitionId: 12,
  unitId: 5,
  targetGrade: 2,
  submittedPercentage: 0,
  isSuppressed: false,
  isStale: false,
  isFeatureEnabled: true,
  lastUpdatedAt: '2026-08-14T03:15:00Z',
  unavailableMessage: '',
};

export const FIXTURE_SUPPRESSED: PeerProgressIndicator = {
  taskDefinitionId: 12,
  unitId: 5,
  targetGrade: 2,
  submittedPercentage: null,
  isSuppressed: true,
  isStale: false,
  isFeatureEnabled: true,
  lastUpdatedAt: '2026-08-14T03:15:00Z',
  unavailableMessage: 'Not enough students to show progress.',
};

export const FIXTURE_UNAVAILABLE: PeerProgressIndicator = {
  taskDefinitionId: 12,
  unitId: 5,
  targetGrade: 2,
  submittedPercentage: null,
  isSuppressed: false,
  isStale: false,
  isFeatureEnabled: true,
  lastUpdatedAt: '2026-08-14T03:15:00Z',
  unavailableMessage: 'Progress unavailable.',
};

export const FIXTURE_DISABLED: PeerProgressIndicator = {
  taskDefinitionId: 12,
  unitId: 5,
  targetGrade: 2,
  submittedPercentage: null,
  isSuppressed: false,
  isStale: false,
  isFeatureEnabled: false,
  lastUpdatedAt: '2026-08-14T03:15:00Z',
  unavailableMessage: 'Peer Progress Indicator is disabled for this unit.',
};

export const FIXTURE_STALE: PeerProgressIndicator = {
  taskDefinitionId: 12,
  unitId: 5,
  targetGrade: 2,
  submittedPercentage: 55,
  isSuppressed: false,
  isStale: true,
  isFeatureEnabled: true,
  lastUpdatedAt: '2026-08-14T03:15:00Z',
  unavailableMessage: 'Progress data is stale.',
};

// Malformed fixture for safe-failure tests
export const FIXTURE_MALFORMED: unknown = {
  taskDefinitionId: null,
  unitId: undefined,
  targetGrade: 'wrong-type',
  submittedPercentage: NaN,
  isSuppressed: 'nope',
  isStale: 123,
  isFeatureEnabled: 'false',
  lastUpdatedAt: 'not-a-date',
  unavailableMessage: 999,
};
