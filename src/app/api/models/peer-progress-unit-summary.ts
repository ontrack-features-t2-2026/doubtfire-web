import {PeerProgressIndicator} from './peer-progress-indicator';

/**
 * Unit-level aggregate PPI summary: the requesting student's own progress next to
 * the anonymous cohort aggregate for a unit's target grade.
 *
 * Reuses PeerProgressIndicator's fields as-is -- suppression, staleness, the feature
 * flag, and safe messaging all mean the same thing at unit scope as they do at task
 * scope. `studentPercentage` is the one genuinely missing field: the requesting
 * student's own aggregate progress across the unit, needed so a unit-level summary
 * can show "your progress" and "cohort progress" as separate, plainly labelled values.
 * `taskDefinitionId` is dropped since a unit summary isn't scoped to a single task.
 */
export interface PeerProgressUnitSummary extends Omit<PeerProgressIndicator, 'taskDefinitionId'> {
  studentPercentage: number | null; // null under the same conditions submittedPercentage is
}
