import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
  captureAndScrubAdditionalEmailVerification,
  consumeAdditionalEmailVerificationToken,
} from './additional-email-verification-callback';

describe('additional email verification callback', () => {
  beforeEach(() => {
    consumeAdditionalEmailVerificationToken();
  });

  it('captures the fragment token once and scrubs it before startup', () => {
    const replaceState = vi.fn();

    captureAndScrubAdditionalEmailVerification(
      'https://ontrack.example/verify_additional_email#token=private-token',
      replaceState,
    );

    expect(replaceState).toHaveBeenCalledWith(null, '', '/verify_additional_email');
    expect(consumeAdditionalEmailVerificationToken()).toBe('private-token');
    expect(consumeAdditionalEmailVerificationToken()).toBeNull();
  });

  it('ignores a token on every other route', () => {
    const replaceState = vi.fn();

    captureAndScrubAdditionalEmailVerification(
      'https://ontrack.example/home#token=not-for-this-handler',
      replaceState,
    );

    expect(replaceState).not.toHaveBeenCalled();
    expect(consumeAdditionalEmailVerificationToken()).toBeNull();
  });
});
