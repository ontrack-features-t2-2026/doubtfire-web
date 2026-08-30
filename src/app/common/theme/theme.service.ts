import {DestroyRef, Injectable, computed, inject, signal} from '@angular/core';

/**
 * OnTrack theme foundation (THM-F01). Implements the state model fixed in
 * docs/theme/THEME-CONTRACT.md sections 4, 6 and 11.
 *
 * Two vocabularies, never mixed:
 *   - preference: what the user chose        -> 'light' | 'dark' | 'system'
 *   - resolved:   what is on screen right now -> 'light' | 'dark'
 * 'system' is an instruction, never a resolved value.
 *
 * This service owns the token layer's marker and the resolved-theme signal. The
 * no-flash <head> script (THM-F04), the Tailwind dark variant (THM-F03), the
 * accessible toggle (THM-F02) and the browser theme-color chrome (THM-W01) are
 * deliberately out of scope here.
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'] as const;

/** Duplicated as a literal in the THM-F04 no-flash script; THM-T01 asserts they match. */
export const THEME_STORAGE_KEY = 'ontrack.theme.preference';

export function isThemePreference(v: unknown): v is ThemePreference {
  return typeof v === 'string' && (THEME_PREFERENCES as readonly string[]).includes(v);
}

/** Reads the stored preference. Any junk, or storage throwing, resolves to 'system'. */
export function readThemePreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(raw) ? raw : 'system';
  } catch {
    return 'system';
  }
}

@Injectable({providedIn: 'root'})
export class ThemeService {
  private readonly _preference = signal<ThemePreference>(readThemePreference());
  private readonly _resolved = signal<ResolvedTheme>('light');

  /** The stored choice. The toggle (THM-F02) binds to this so it can highlight 'system'. */
  readonly preference = this._preference.asReadonly();
  /** What is actually painted. Anything that needs the on-screen theme reads this. */
  readonly resolved = this._resolved.asReadonly();
  readonly isDark = computed(() => this._resolved() === 'dark');

  private readonly query: MediaQueryList | null = this.mediaQuery();

  // Held as a stable reference so the same listener can be removed on destroy.
  // One listener for the whole app; it repaints only while the stored choice is
  // 'system'. Contract section 11, item 11.
  private readonly onSystemChange = (): void => {
    if (this._preference() === 'system') {
      this.applyResolved();
    }
  };

  constructor() {
    this.query?.addEventListener('change', this.onSystemChange);
    inject(DestroyRef).onDestroy(() => {
      this.query?.removeEventListener('change', this.onSystemChange);
    });
    this.applyResolved();
  }

  /**
   * Record a new preference. The type gate means an invalid value cannot be
   * stored through the service at all. A storage failure leaves the in-memory
   * preference applied and does not throw.
   */
  setPreference(pref: ThemePreference): void {
    if (!isThemePreference(pref)) {
      return;
    }
    this._preference.set(pref);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {
      /* storage blocked; in-memory preference still applies */
    }
    this.applyResolved();
  }

  /** stored === 'system' ? follow the OS : the stored value. Section 4, one line. */
  resolve(pref: ThemePreference = this._preference()): ResolvedTheme {
    if (pref === 'system') {
      return this.prefersDark() ? 'dark' : 'light';
    }
    return pref;
  }

  private applyResolved(): void {
    const resolved = this.resolve();
    this._resolved.set(resolved);
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    // Only ever 'light' or 'dark' reaches the attribute. Section 5.
    root.setAttribute('data-ot-theme', resolved);
    root.style.colorScheme = resolved;
  }

  private prefersDark(): boolean {
    return this.query?.matches ?? false;
  }

  private mediaQuery(): MediaQueryList | null {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return null; // matchMedia unavailable -> light. Section 11 fallback chain.
    }
    return window.matchMedia('(prefers-color-scheme: dark)');
  }
}
