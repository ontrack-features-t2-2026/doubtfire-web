import {describe, expect, it} from 'vitest';
import {TutorialsComponent} from './tutorials.component';

// shortTime split on ':' and padded both halves, so any meeting time that was empty,
// missing, or not in HH:mm form (no colon) crashed the Tutorials page: undefined has no
// split, and a colon-less string leaves minutes undefined with no padStart. It is now
// total — it pads a real HH:mm value and returns the input untouched otherwise.
describe('TutorialsComponent.shortTime', () => {
  const shortTime = (value?: string) =>
    (Object.create(TutorialsComponent.prototype) as TutorialsComponent).shortTime(value);

  it('pads a single-digit hour and minute', () => {
    expect(shortTime('9:5')).toBe('09:05');
  });

  it('leaves an already-padded time unchanged', () => {
    expect(shortTime('09:05')).toBe('09:05');
  });

  it('returns a colon-less value as-is instead of throwing', () => {
    expect(shortTime('9am')).toBe('9am');
  });

  it('returns an empty string for an empty time', () => {
    expect(shortTime('')).toBe('');
  });

  it('returns an empty string for a missing time', () => {
    expect(shortTime(undefined)).toBe('');
  });
});
