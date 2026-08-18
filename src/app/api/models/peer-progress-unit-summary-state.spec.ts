import {describe, expect, it} from 'vitest';
import {
  DISABLED_STATE,
  NORMAL_STATE,
  STALE_STATE,
  SUPPRESSED_STATE,
  UNAVAILABLE_STATE,
  ZERO_PERCENT_STATE,
} from '../services/mock';
import {PeerProgressUnitSummary} from './peer-progress-unit-summary';
import {resolvePeerProgressUnitSummaryState} from './peer-progress-unit-summary-state';

// Builds a PeerProgressUnitSummary from one of the six shared cohort mock states,
// the same way PeerProgressIndicatorService.getUnitSummary() does.
function toUnitSummary(
  cohort:
    | typeof NORMAL_STATE
    | typeof ZERO_PERCENT_STATE
    | typeof SUPPRESSED_STATE
    | typeof UNAVAILABLE_STATE
    | typeof STALE_STATE
    | typeof DISABLED_STATE,
  studentPercentage: number | null,
): PeerProgressUnitSummary {
  return {
    unitId: cohort.unitId,
    targetGrade: cohort.targetGrade,
    studentPercentage,
    submittedPercentage: cohort.submittedPercentage,
    isSuppressed: cohort.isSuppressed,
    isStale: cohort.isStale,
    isFeatureEnabled: cohort.isFeatureEnabled,
    lastUpdatedAt: cohort.lastUpdatedAt,
    unavailableMessage: cohort.unavailableMessage,
  };
}

describe('resolvePeerProgressUnitSummaryState', () => {
  it('returns loading while the request is in flight, ignoring any data passed in', () => {
    const result = resolvePeerProgressUnitSummaryState(true, null, toUnitSummary(NORMAL_STATE, 30));
    expect(result.state).toBe('loading');
    expect(result.data).toBeNull();
  });

  it('returns error when the request fails, and does not leak the previous data', () => {
    const result = resolvePeerProgressUnitSummaryState(
      false,
      new Error('network down'),
      toUnitSummary(NORMAL_STATE, 30),
    );
    expect(result.state).toBe('error');
    expect(result.data).toBeNull();
  });

  it('returns success with the student and cohort percentages kept separate', () => {
    const summary = toUnitSummary(NORMAL_STATE, 30);
    const result = resolvePeerProgressUnitSummaryState(false, null, summary);

    expect(result.state).toBe('success');
    expect(result.data?.studentPercentage).toBe(30);
    expect(result.data?.submittedPercentage).toBe(NORMAL_STATE.submittedPercentage);
  });

  it('returns no-data when the cohort genuinely has not submitted yet', () => {
    const result = resolvePeerProgressUnitSummaryState(
      false,
      null,
      toUnitSummary(ZERO_PERCENT_STATE, 0),
    );
    expect(result.state).toBe('no-data');
  });

  it('returns hidden with the safe message for a small, suppressed cohort', () => {
    const result = resolvePeerProgressUnitSummaryState(
      false,
      null,
      toUnitSummary(SUPPRESSED_STATE, 30),
    );
    expect(result.state).toBe('hidden');
    expect(result.message).toBe(SUPPRESSED_STATE.unavailableMessage);
  });

  it('returns unavailable for a generically unavailable cohort response', () => {
    const result = resolvePeerProgressUnitSummaryState(
      false,
      null,
      toUnitSummary(UNAVAILABLE_STATE, 30),
    );
    expect(result.state).toBe('unavailable');
  });

  it('returns disabled when the unit has turned the feature off', () => {
    const result = resolvePeerProgressUnitSummaryState(
      false,
      null,
      toUnitSummary(DISABLED_STATE, 30),
    );
    expect(result.state).toBe('disabled');
    expect(result.message).toBe(DISABLED_STATE.unavailableMessage);
  });

  it('returns stale without exposing a cohort percentage when data is outdated', () => {
    const result = resolvePeerProgressUnitSummaryState(false, null, toUnitSummary(STALE_STATE, 30));

    expect(result.state).toBe('stale');
    expect(result.data?.submittedPercentage).toBeNull();
    expect(result.message).toBe(STALE_STATE.unavailableMessage);
  });

  it('transitions from loading to success without carrying over a stale value', () => {
    const loadingResult = resolvePeerProgressUnitSummaryState(true, null, null);
    expect(loadingResult.data).toBeNull();

    const summary = toUnitSummary(NORMAL_STATE, 30);
    const successResult = resolvePeerProgressUnitSummaryState(false, null, summary);
    expect(successResult.data).toEqual(summary);
  });
});
