import {beforeEach, describe, expect, it, vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Subject} from 'rxjs';
import {BeforeInstallPromptEvent, InstallPromptService} from './install-prompt.service';

interface InstallPromptServicePrivate {
  isIos(): boolean;
  isStandalone(): boolean;
}

describe('InstallPromptService', () => {
  let snackBarSpy: {open: ReturnType<typeof vi.fn>};
  let snackBarRefSpy: {
    onAction: ReturnType<typeof vi.fn>;
    afterDismissed: ReturnType<typeof vi.fn>;
  };
  let actionSubject: Subject<void>;
  let afterDismissedSubject: Subject<void>;

  beforeEach(() => {
    actionSubject = new Subject<void>();
    afterDismissedSubject = new Subject<void>();

    snackBarRefSpy = {
      onAction: vi.fn().mockReturnValue(actionSubject.asObservable()),
      afterDismissed: vi.fn().mockReturnValue(afterDismissedSubject.asObservable()),
    };

    snackBarSpy = {
      open: vi.fn().mockReturnValue(snackBarRefSpy),
    };

    localStorage.clear();
  });

  function createService(): InstallPromptService {
    TestBed.configureTestingModule({
      providers: [InstallPromptService, {provide: MatSnackBar, useValue: snackBarSpy}],
    });
    return TestBed.inject(InstallPromptService);
  }

  it('should be created', () => {
    const service = createService();
    expect(service).toBeTruthy();
  });

  it('should do nothing if previously dismissed in localStorage', () => {
    localStorage.setItem('ontrack_pwa_install_dismissed', 'true');
    createService();

    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });

  describe('Non-iOS Flow', () => {
    beforeEach(() => {
      vi.spyOn(
        InstallPromptService.prototype as unknown as InstallPromptServicePrivate,
        'isIos',
      ).mockReturnValue(false);
    });

    it('should open snackbar and trigger prompt on user action', () => {
      createService();

      const mockEvent = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
      const promptSpy = vi.fn();
      const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');
      Object.defineProperty(mockEvent, 'prompt', {value: promptSpy});

      window.dispatchEvent(mockEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Install OnTrack for a better experience',
        'Install',
        {duration: 10000},
      );

      actionSubject.next();
      expect(promptSpy).toHaveBeenCalled();
    });

    it('should save dismissal to localStorage when snackbar is dismissed', () => {
      createService();

      const mockEvent = new Event('beforeinstallprompt');
      window.dispatchEvent(mockEvent);

      afterDismissedSubject.next();
      expect(localStorage.getItem('ontrack_pwa_install_dismissed')).toBe('true');
    });
  });

  describe('iOS Flow', () => {
    beforeEach(() => {
      vi.spyOn(
        InstallPromptService.prototype as unknown as InstallPromptServicePrivate,
        'isIos',
      ).mockReturnValue(true);
    });

    it('should show iOS prompt if not in standalone mode', () => {
      vi.spyOn(
        InstallPromptService.prototype as unknown as InstallPromptServicePrivate,
        'isStandalone',
      ).mockReturnValue(false);

      createService();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'To install OnTrack: tap Share then "Add to Home Screen"',
        'Got it',
        {duration: 10000},
      );
    });

    it('should not show prompt if already in standalone mode', () => {
      vi.spyOn(
        InstallPromptService.prototype as unknown as InstallPromptServicePrivate,
        'isStandalone',
      ).mockReturnValue(true);

      createService();

      expect(snackBarSpy.open).not.toHaveBeenCalled();
    });

    it('should save dismissal to localStorage when iOS snackbar is dismissed', () => {
      vi.spyOn(
        InstallPromptService.prototype as unknown as InstallPromptServicePrivate,
        'isStandalone',
      ).mockReturnValue(false);

      createService();

      afterDismissedSubject.next();
      expect(localStorage.getItem('ontrack_pwa_install_dismissed')).toBe('true');
    });
  });
});
