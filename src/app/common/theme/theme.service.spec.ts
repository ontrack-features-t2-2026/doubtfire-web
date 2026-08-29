import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {THEME_STORAGE_KEY, ThemeService} from './theme.service';

/**
 * A real in-memory Storage, installed fresh per test. This repo's jsdom does not
 * provide localStorage on its own, so the spec owns its store rather than relying
 * on another spec having defined one first in the shared worker.
 */
function installLocalStorage(): void {
  const map: Map<string, string> = new Map();
  const store: Storage = {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => {
      map.delete(k);
    },
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
  };
  Object.defineProperty(window, 'localStorage', {value: store, configurable: true, writable: true});
}

/** Minimal MediaQueryList stub. add/removeEventListener are spies so the
 * once-and-removed-on-destroy contract (section 11 item 11) is checkable, and
 * dispatch() simulates a live OS appearance change. */
function stubMatchMedia(matches: boolean) {
  const listeners: Set<() => void> = new Set();
  const mql = {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn((_: string, cb: () => void) => listeners.add(cb)),
    removeEventListener: vi.fn((_: string, cb: () => void) => listeners.delete(cb)),
    dispatch: () => listeners.forEach((cb) => cb()),
  };
  (window as unknown as {matchMedia: unknown}).matchMedia = () => mql;
  return mql;
}

function inject(): ThemeService {
  return TestBed.inject(ThemeService);
}

function marker(): string | null {
  return document.documentElement.getAttribute('data-ot-theme');
}

describe('ThemeService', () => {
  beforeEach(() => {
    installLocalStorage();
    document.documentElement.removeAttribute('data-ot-theme');
    document.documentElement.style.colorScheme = '';
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is created', () => {
    expect(inject()).toBeTruthy();
  });

  it('resolves to system (not a hard dark) when the key is missing', () => {
    const svc = inject();
    expect(svc.preference()).toBe('system');
    expect(svc.resolved()).toBe('light');
  });

  it('falls back to system for every non-allowlisted value and never rewrites it', () => {
    // Contract section 14 item 3, verbatim inputs.
    for (const bad of ['Dark', 'midnight', '', '{}', '<script>']) {
      localStorage.setItem(THEME_STORAGE_KEY, bad);
      TestBed.resetTestingModule();
      const svc = inject();
      expect(svc.preference(), `input ${JSON.stringify(bad)}`).toBe('system');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(bad); // untouched
    }
  });

  it('resolves to system without throwing when getItem throws', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const svc = inject();
    expect(svc.preference()).toBe('system');
    expect(marker()).toBe('light');
  });

  it('keeps the in-memory preference when setItem throws', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const svc = inject();
    expect(() => svc.setPreference('dark')).not.toThrow();
    expect(svc.preference()).toBe('dark');
    expect(marker()).toBe('dark');
  });

  it('resolves a stored dark preference to dark at construction', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const svc = inject();
    expect(svc.preference()).toBe('dark');
    expect(svc.resolved()).toBe('dark');
    expect(marker()).toBe('dark');
  });

  it('system + OS dark resolves dark; system + OS light resolves light', () => {
    stubMatchMedia(true);
    localStorage.setItem(THEME_STORAGE_KEY, 'system');
    expect(inject().resolved()).toBe('dark');

    TestBed.resetTestingModule();
    stubMatchMedia(false);
    expect(inject().resolved()).toBe('light');
  });

  it('resolves to light without throwing when matchMedia is unavailable', () => {
    (window as unknown as {matchMedia: unknown}).matchMedia = undefined;
    const svc = inject();
    expect(svc.resolved()).toBe('light');
    expect(marker()).toBe('light');
  });

  it('an explicit choice ignores the OS', () => {
    stubMatchMedia(true); // OS is dark
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(inject().resolved()).toBe('light');
  });

  it('repaints on a live OS change while stored is system, and only then', () => {
    const mql = stubMatchMedia(false);
    localStorage.setItem(THEME_STORAGE_KEY, 'system');
    const svc = inject();
    expect(svc.resolved()).toBe('light');

    mql.matches = true;
    mql.dispatch();
    expect(svc.resolved()).toBe('dark');

    // A pinned preference must not follow the OS, and must not even repaint.
    // Spy after pinning so the guard's skip is observable, not just the value:
    // without the `preference === 'system'` guard this fails on the marker write.
    svc.setPreference('light');
    const setAttr = vi.spyOn(document.documentElement, 'setAttribute');
    mql.matches = false;
    mql.dispatch();
    mql.matches = true;
    mql.dispatch();
    expect(svc.resolved()).toBe('light');
    expect(setAttr).not.toHaveBeenCalledWith('data-ot-theme', expect.anything());
  });

  it('registers the change listener once and removes it on destroy', () => {
    const mql = stubMatchMedia(false);
    inject();
    expect(mql.addEventListener).toHaveBeenCalledTimes(1);
    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    TestBed.resetTestingModule(); // tears down the root injector -> DestroyRef fires
    expect(mql.removeEventListener).toHaveBeenCalledTimes(1);
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('ignores an invalid setPreference value and writes nothing', () => {
    const svc = inject();
    svc.setPreference('midnight' as never); // a JS caller bypassing the type
    expect(svc.preference()).toBe('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('isDark and explicit resolve() follow the resolved theme', () => {
    stubMatchMedia(true); // OS reports dark
    const svc = inject();
    expect(svc.resolve('system')).toBe('dark');
    expect(svc.resolve('light')).toBe('light');
    expect(svc.resolve('dark')).toBe('dark');
    svc.setPreference('dark');
    expect(svc.isDark()).toBe(true);
    svc.setPreference('light');
    expect(svc.isDark()).toBe(false);
  });

  it('writes only the resolved value to the marker, never "system"', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'system');
    inject();
    expect(['light', 'dark']).toContain(marker());
    expect(marker()).not.toBe('system');
  });

  it('tracks document colorScheme with the resolved theme', () => {
    const svc = inject();
    svc.setPreference('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    svc.setPreference('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('setPreference persists the choice and moves the marker', () => {
    const svc = inject();
    svc.setPreference('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(marker()).toBe('dark');
    svc.setPreference('light');
    expect(marker()).toBe('light');
  });

  // The no-flash script (THM-F04) duplicates this literal because it runs before
  // any module loads. Pin the value here; THM-F04's drift test asserts the two
  // are byte-identical.
  it('exposes the agreed storage key literal', () => {
    expect(THEME_STORAGE_KEY).toBe('ontrack.theme.preference');
  });
});
