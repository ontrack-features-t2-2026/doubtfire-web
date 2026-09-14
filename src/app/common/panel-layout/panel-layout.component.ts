import {BreakpointObserver} from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  forwardRef,
  inject,
} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {Subject, takeUntil} from 'rxjs';
import {PANEL_LAYOUT, PanelLayoutHost, PanelRegistration} from './panel-layout.token';

/**
 * Rounded panels side by side with even gaps: a list, the work, and a side panel such as
 * comments. Each `app-panel` inside can collapse to a rail, be resized, or go full screen.
 *
 * Below the stack breakpoint only one panel shows at a time, picked from a row of tabs, so
 * nothing scrolls sideways on a small screen.
 */
@Component({
  selector: 'app-panel-layout',
  templateUrl: './panel-layout.component.html',
  styleUrl: './panel-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatIconModule],
  providers: [{provide: PANEL_LAYOUT, useExisting: forwardRef(() => PanelLayoutComponent)}],
})
export class PanelLayoutComponent implements PanelLayoutHost, OnInit, OnDestroy {
  /** Namespaces the remembered panel state, as in `ontrack.panels.<page>.<panel>`. */
  @Input({required: true}) public page: string;

  /** The width, in pixels, at and below which the panels become tabs. */
  @Input() public stackBelow = 899.98;

  /** Hide the tab row when the page switches panels itself. */
  @Input() public showTabs = true;

  @Input() public fullscreenPanel: string | null = null;
  @Output() public fullscreenPanelChange: EventEmitter<string | null> = new EventEmitter();

  /** The one panel shown while stacked. Falls back to the first registered panel. */
  @Input() public set activePanel(panelId: string | null) {
    this._activePanel = panelId;
  }
  public get activePanel(): string | null {
    const panels = this.panels;
    if (this._activePanel && panels.some((panel) => panel.panelId === this._activePanel)) {
      return this._activePanel;
    }
    return panels[0]?.panelId ?? null;
  }
  @Output() public activePanelChange: EventEmitter<string | null> = new EventEmitter();

  public stacked = false;
  public panels: PanelRegistration[] = [];

  private _activePanel: string | null = null;
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroy$: Subject<void> = new Subject();

  @HostBinding('class.app-panel-layout--stacked')
  public get stackedClass(): boolean {
    return this.stacked;
  }

  @HostBinding('class.app-panel-layout--fullscreen')
  public get fullscreenClass(): boolean {
    return !!this.fullscreenPanel;
  }

  public ngOnInit(): void {
    this.breakpointObserver
      .observe(`(max-width: ${this.stackBelow}px)`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(({matches}) => {
        this.stacked = matches;
        this.changeDetector.markForCheck();
        if (matches && this.fullscreenPanel) {
          this.setFullscreen(null);
        }
        this.notifyResize();
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public register(panel: PanelRegistration): void {
    if (!this.panels.includes(panel)) {
      this.panels = [...this.panels, panel];
    }
  }

  public unregister(panel: PanelRegistration): void {
    this.panels = this.panels.filter((candidate) => candidate !== panel);
    if (this.fullscreenPanel === panel.panelId) {
      this.setFullscreen(null);
    }
  }

  public toggleFullscreen(panelId: string): void {
    this.setFullscreen(this.fullscreenPanel === panelId ? null : panelId);
  }

  public exitFullscreen(): void {
    this.setFullscreen(null);
  }

  public selectPanel(panelId: string): void {
    this._activePanel = panelId;
    this.activePanelChange.emit(panelId);
    this.notifyResize();
  }

  @HostListener('document:keydown.escape', ['$event'])
  public onEscape(event: Event): void {
    // A dialog or menu that handled Esc first keeps it.
    if (!this.fullscreenPanel || event.defaultPrevented) {
      return;
    }
    this.setFullscreen(null);
  }

  /** PDF viewers and charts measure themselves on window resize. */
  public notifyResize(): void {
    window.dispatchEvent(new Event('resize'));
  }

  private setFullscreen(panelId: string | null): void {
    if (this.fullscreenPanel === panelId) {
      return;
    }
    this.fullscreenPanel = panelId;
    this.fullscreenPanelChange.emit(panelId);
    this.notifyResize();
  }
}
