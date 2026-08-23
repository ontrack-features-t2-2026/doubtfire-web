export interface PeerProgressIndicator {
  taskDefinitionId: number; // ID of the task definition
  unitId: number; // ID of the unit
  targetGrade: number | null; // Valid server-side target grade, or null when unavailable

  submittedPercentage: number | null; // null when suppressed/unavailable/disabled
  isSuppressed: boolean; // true when cohort too small
  isStale: boolean; // true when data is outdated
  isFeatureEnabled: boolean; // false when unit disables PPI

  lastUpdatedAt: string | null; // ISO timestamp, or null when no snapshot was used
  unavailableMessage: string; // safe message for suppressed/unavailable/stale/disabled
}
