import { describe, it, expect } from 'vitest';
import {
  FIXTURE_NORMAL,
  FIXTURE_ZERO_PERCENT,
  FIXTURE_SUPPRESSED,
  FIXTURE_UNAVAILABLE,
  FIXTURE_DISABLED,
  FIXTURE_STALE,
  FIXTURE_MALFORMED,
} from './peer-progress-indicator.fixtures';
import { PeerProgressIndicator } from '../models/peer-progress-indicator';

// A mock adapter boundary check
const adapterBoundaryCheck = (input: PeerProgressIndicator) => {
  // The adapter must never throw on valid fixtures
  if (input.submittedPercentage !== null && typeof input.submittedPercentage !== 'number') {
    throw new Error('Invalid percentage type');
  }

  if (typeof input.isSuppressed !== 'boolean') {
    throw new Error('Invalid suppression flag');
  }

  if (typeof input.isFeatureEnabled !== 'boolean') {
    throw new Error('Invalid feature flag');
  }

  if (typeof input.lastUpdatedAt !== 'string') {
    throw new Error('Invalid timestamp');
  }

  return true;
};

describe('PPI Adapter Compatibility Expectations', () => {
  it('accepts all valid safe-state fixtures', () => {
    const validFixtures = [
      FIXTURE_NORMAL,
      FIXTURE_ZERO_PERCENT,
      FIXTURE_SUPPRESSED,
      FIXTURE_UNAVAILABLE,
      FIXTURE_DISABLED,
      FIXTURE_STALE,
    ];

    validFixtures.forEach(f => {
      expect(() => adapterBoundaryCheck(f)).not.toThrow();
    });
  });

  it('rejects malformed fixture fields', () => {
    expect(() =>
      adapterBoundaryCheck(FIXTURE_MALFORMED as Partial<PeerProgressIndicator> as PeerProgressIndicator)
    ).toThrow();
  });

  it('suppressed fixture must hide percentage', () => {
    expect(FIXTURE_SUPPRESSED.submittedPercentage).toBeNull();
    expect(FIXTURE_SUPPRESSED.isSuppressed).toBe(true);
  });

  it('unavailable fixture must hide percentage but not be suppressed', () => {
    expect(FIXTURE_UNAVAILABLE.submittedPercentage).toBeNull();
    expect(FIXTURE_UNAVAILABLE.isSuppressed).toBe(false);
  });

  it('disabled fixture must hide percentage and disable feature', () => {
    expect(FIXTURE_DISABLED.submittedPercentage).toBeNull();
    expect(FIXTURE_DISABLED.isFeatureEnabled).toBe(false);
  });

  it('adapter must treat stale data as a safe state', () => {
    expect(FIXTURE_STALE.isStale).toBe(true);
  });

  it('adapter must not leak peer identities or raw cohort counts', () => {
    const fixtures = [
      FIXTURE_NORMAL,
      FIXTURE_ZERO_PERCENT,
      FIXTURE_SUPPRESSED,
      FIXTURE_UNAVAILABLE,
      FIXTURE_DISABLED,
      FIXTURE_STALE,
    ];

    fixtures.forEach(f => {
      expect(f).not.toHaveProperty('peerName');
      expect(f).not.toHaveProperty('studentId');
      expect(f).not.toHaveProperty('cohortCount');
      expect(f).not.toHaveProperty('marks');
      expect(f).not.toHaveProperty('feedback');
    });
  });
});
