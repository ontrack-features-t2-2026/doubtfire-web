import confetti from 'canvas-confetti';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {ConfettiService} from './confetti.service';

vi.mock('canvas-confetti', () => ({default: vi.fn()}));

describe('ConfettiService', () => {
  let service: ConfettiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfettiService);
    vi.mocked(confetti).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not launch particles when reduced motion is requested', () => {
    const matchMedia = vi.fn().mockReturnValue({matches: true});
    vi.stubGlobal('matchMedia', matchMedia);

    service.canon(0.95, 0.05, 210);

    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(confetti).not.toHaveBeenCalled();
  });

  it('keeps the celebration when reduced motion is not requested', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({matches: false}));

    service.canon(0.95, 0.05, 210);

    expect(confetti).toHaveBeenCalledExactlyOnceWith({
      angle: 210,
      spread: 80,
      particleCount: 100,
      origin: {x: 0.95, y: 0.05},
    });
  });

  it('checks the current preference for every celebration', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValueOnce({matches: false}).mockReturnValueOnce({matches: true}),
    );

    service.canon();
    service.canon();

    expect(confetti).toHaveBeenCalledTimes(1);
  });

  it('supports environments without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);

    expect(() => service.canon()).not.toThrow();
    expect(confetti).toHaveBeenCalledExactlyOnceWith({
      angle: 210,
      spread: 80,
      particleCount: 100,
      origin: {x: 0, y: 0},
    });
  });
});
