import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISSED_KEY = 'ontrack_pwa_install_dismissed';
const PROMPT_DURATION = 10000;

@Injectable()
export class InstallPromptService {
  private beforeInstallPrompt: BeforeInstallPromptEvent | null = null;

  constructor(private _snackBar: MatSnackBar) {
    if (localStorage.getItem(DISMISSED_KEY) === 'true') {
      return;
    }

    if (this.isIos()) {
      if (!this.isStandalone()) {
        this.showIosPrompt();
      }
      return;
    }

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();

      this.beforeInstallPrompt = e as BeforeInstallPromptEvent;

      const snackBarRef = this._snackBar.open(
        'Install OnTrack for a better experience',
        'Install',
        {duration: PROMPT_DURATION},
      );

      snackBarRef.onAction().subscribe(() => {
        if (this.beforeInstallPrompt) {
          this.beforeInstallPrompt.prompt();
        }
      });

      snackBarRef.afterDismissed().subscribe(() => {
        localStorage.setItem(DISMISSED_KEY, 'true');
      });
    });
  }

  private showIosPrompt(): void {
    const snackBarRef = this._snackBar.open(
      'To install OnTrack: tap Share then "Add to Home Screen"',
      'Got it',
      {duration: PROMPT_DURATION},
    );

    snackBarRef.afterDismissed().subscribe(() => {
      localStorage.setItem(DISMISSED_KEY, 'true');
    });
  }

  private isIos(): boolean {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }

  private isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator &&
        (window.navigator as unknown as {standalone: boolean}).standalone)
    );
  }
}
