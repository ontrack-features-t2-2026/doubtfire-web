import {InjectionToken} from '@angular/core';

/** The slice of the layout a panel talks to. Kept in its own file so the two components do not import each other. */
export interface PanelLayoutHost {
  readonly page: string;
  readonly stacked: boolean;
  readonly fullscreenPanel: string | null;
  readonly activePanel: string | null;
  register(panel: PanelRegistration): void;
  unregister(panel: PanelRegistration): void;
  toggleFullscreen(panelId: string): void;
  notifyResize(): void;
}

export interface PanelRegistration {
  readonly panelId: string;
  readonly panelTitle: string;
  readonly icon: string | null;
}

export const PANEL_LAYOUT: InjectionToken<PanelLayoutHost> = new InjectionToken('PANEL_LAYOUT');
