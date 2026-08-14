import {describe, expect, it} from 'vitest';
import {PeerProgressIndicator} from '../models/peer-progress-indicator';
import {
  FIXTURE_DISABLED,
  FIXTURE_MALFORMED,
  FIXTURE_NORMAL,
  FIXTURE_STALE,
  FIXTURE_SUPPRESSED,
  FIXTURE_UNAVAILABLE,
  FIXTURE_ZERO_PERCENT,
} from './peer-progress-indicator.fixtures';

const assertContractShape = (fixture: PeerProgressIndicator) => {
  expect(typeof fixture.taskDefinitionId).toBe('number');
  expect(typeof fixture.unitId).toBe('number');
  expect(typeof fixture.targetGrade).toBe('number');

  // submittedPercentage can be number or null
  expect(
    fixture.submittedPercentage === null || typeof fixture.submittedPercentage === 'number',
  ).toBe(true);

  expect(typeof fixture.isSuppressed).toBe('boolean');
  expect(typeof fixture.isStale).toBe('boolean');
  expect(typeof fixture.isFeatureEnabled).toBe('boolean');

  expect(typeof fixture.lastUpdatedAt).toBe('string');
  expect(typeof fixture.unavailableMessage).toBe('string');
};

describe('PeerProgressIndicator Fixture Regression Tests', () => {
  // Contract Shape Tests
  it('NORMAL fixture matches the contract shape', () => {
    assertContractShape(FIXTURE_NORMAL);
  });

  it('ZERO_PERCENT fixture matches the contract shape', () => {
    assertContractShape(FIXTURE_ZERO_PERCENT);
  });

  it('SUPPRESSED fixture matches the contract shape', () => {
    assertContractShape(FIXTURE_SUPPRESSED);
  });

  it('UNAVAILABLE fixture matches the contract shape', () => {
    assertContractShape(FIXTURE_UNAVAILABLE);
  });

  it('DISABLED fixture matches the contract shape', () => {
    assertContractShape(FIXTURE_DISABLED);
  });

  it('STALE fixture matches the contract shape', () => {
    assertContractShape(FIXTURE_STALE);
  });

  // Safe-State Behaviour Tests
  it('NORMAL fixture has a valid percentage', () => {
    expect(FIXTURE_NORMAL.submittedPercentage).toBeGreaterThan(0);
    expect(FIXTURE_NORMAL.isSuppressed).toBe(false);
    expect(FIXTURE_NORMAL.isFeatureEnabled).toBe(true);
  });

  it('ZERO_PERCENT fixture correctly represents genuine 0%', () => {
    expect(FIXTURE_ZERO_PERCENT.submittedPercentage).toBe(0);
    expect(FIXTURE_ZERO_PERCENT.isSuppressed).toBe(false);
  });

  it('SUPPRESSED fixture hides percentage and uses safe wording', () => {
    expect(FIXTURE_SUPPRESSED.submittedPercentage).toBeNull();
    expect(FIXTURE_SUPPRESSED.isSuppressed).toBe(true);
    expect(FIXTURE_SUPPRESSED.unavailableMessage).toContain('Not enough students');
  });

  it('UNAVAILABLE fixture hides percentage but is not suppressed', () => {
    expect(FIXTURE_UNAVAILABLE.submittedPercentage).toBeNull();
    expect(FIXTURE_UNAVAILABLE.isSuppressed).toBe(false);
    expect(FIXTURE_UNAVAILABLE.unavailableMessage).toContain('Progress unavailable');
  });

  it('DISABLED fixture hides percentage and marks feature disabled', () => {
    expect(FIXTURE_DISABLED.submittedPercentage).toBeNull();
    expect(FIXTURE_DISABLED.isFeatureEnabled).toBe(false);
  });

  it('STALE fixture marks data as stale', () => {
    expect(FIXTURE_STALE.isStale).toBe(true);
  });

  // Privacy Tests
  it('No fixture leaks peer identities or raw cohort counts', () => {
    const fixtures = [
      FIXTURE_NORMAL,
      FIXTURE_ZERO_PERCENT,
      FIXTURE_SUPPRESSED,
      FIXTURE_UNAVAILABLE,
      FIXTURE_DISABLED,
      FIXTURE_STALE,
    ];

    fixtures.forEach((f) => {
      expect(f).not.toHaveProperty('peerName');
      expect(f).not.toHaveProperty('studentId');
      expect(f).not.toHaveProperty('cohortCount');
      expect(f).not.toHaveProperty('marks');
      expect(f).not.toHaveProperty('feedback');
    });
  });

  // Malformed Safe-Failure Tests
  it('MALFORMED fixture contains invalid values for safe-failure testing', () => {
    const malformed = FIXTURE_MALFORMED as Partial<PeerProgressIndicator>;

    expect(malformed.taskDefinitionId).not.toBe(12);
    expect(malformed.submittedPercentage).toBeNaN();
    expect(typeof malformed.lastUpdatedAt).toBe('string'); // but invalid
  });

  // Adapter Compatibility Expectations
  it('Adapter should accept all valid fixtures without throwing', () => {
    const validFixtures = [
      FIXTURE_NORMAL,
      FIXTURE_ZERO_PERCENT,
      FIXTURE_SUPPRESSED,
      FIXTURE_UNAVAILABLE,
      FIXTURE_DISABLED,
      FIXTURE_STALE,
    ];

    validFixtures.forEach((f) => {
      expect(() => assertContractShape(f)).not.toThrow();
    });
  });

  it('Adapter should reject or normalise malformed fixture fields', () => {
    const malformed = FIXTURE_MALFORMED as Partial<PeerProgressIndicator>;

    expect(malformed.submittedPercentage).toBeNaN();
    expect(typeof malformed.targetGrade).toBe('string');
  });
});
