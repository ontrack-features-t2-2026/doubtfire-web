import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {BreakpointObserver} from '@angular/cdk/layout';
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BehaviorSubject} from 'rxjs';
import {PanelLayoutComponent} from './panel-layout.component';
import {PanelStateService} from './panel-state.service';
import {PanelComponent} from './panel.component';

// The real template is set in the test module below, so this one stays empty.
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PanelLayoutComponent, PanelComponent],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations
  template: '',
})
class HostComponent {
  public fullscreen: string | null = null;
}

const hostTemplate = `
    <app-panel-layout page="spec" [(fullscreenPanel)]="fullscreen">
      <app-panel
        icon="list"
        panelId="list"
        panelTitle="Tasks"
        resizeEdge="end"
        [showHeader]="false"
        [width]="300"
      >
        <p>list</p>
      </app-panel>
      <app-panel
        panelId="work"
        panelTitle="Selected task"
        [collapsible]="false"
        [flex]="true"
        [showHeader]="false"
      >
        <p>work</p>
      </app-panel>
      <app-panel icon="forum" panelId="comments" panelTitle="Comments" [fullscreenable]="true">
        <p>comments</p>
      </app-panel>
    </app-panel-layout>
  `;

describe('PanelLayoutComponent', () => {
  let stacked$: BehaviorSubject<{matches: boolean; breakpoints: object}>;
  let fixture: ComponentFixture<HostComponent>;

  const panel = (id: string): HTMLElement =>
    fixture.nativeElement.querySelector(`app-panel[data-panel-id="${id}"]`);
  const button = (id: string, label: string): HTMLButtonElement =>
    panel(id).querySelector(`button[aria-label="${label}"]`);

  const create = () => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    window.localStorage.clear();
    stacked$ = new BehaviorSubject({matches: false, breakpoints: {}});
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{provide: BreakpointObserver, useValue: {observe: () => stacked$}}],
    })
      .overrideComponent(HostComponent, {set: {template: hostTemplate}})
      .compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('collapses a panel to a rail and expands it again', () => {
    create();
    const collapse = button('comments', 'Collapse Comments');
    expect(collapse.getAttribute('aria-expanded')).toBe('true');

    collapse.click();
    fixture.detectChanges();

    expect(panel('comments').classList).toContain('app-panel--collapsed');
    const rail = button('comments', 'Expand Comments');
    expect(rail.getAttribute('aria-expanded')).toBe('false');
    expect(rail.textContent).toContain('Comments');

    rail.click();
    fixture.detectChanges();

    expect(panel('comments').classList).not.toContain('app-panel--collapsed');
  });

  it('gives a headerless panel an edge control to collapse it', () => {
    create();
    button('list', 'Collapse Tasks').click();
    fixture.detectChanges();

    expect(panel('list').classList).toContain('app-panel--collapsed');
    expect(panel('work').querySelector('button[aria-label^="Collapse"]')).toBeNull();
  });

  it('remembers collapsed state and width under a page and panel key', () => {
    create();
    button('comments', 'Collapse Comments').click();
    const list = fixture.debugElement.children[0].children[0].componentInstance as PanelComponent;
    list.width = 360;
    list.resizeWithKeyboard(new KeyboardEvent('keydown', {key: 'ArrowRight'}));

    expect(JSON.parse(window.localStorage.getItem('ontrack.panels.spec.comments'))).toEqual({
      collapsed: true,
    });
    expect(
      JSON.parse(window.localStorage.getItem('ontrack.panels.spec.list')).width,
    ).toBeGreaterThan(0);

    fixture.destroy();
    create();

    expect(panel('comments').classList).toContain('app-panel--collapsed');
    expect(panel('list').style.width).not.toBe('300px');
  });

  it('falls back to defaults when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });

    create();
    expect(panel('comments').classList).not.toContain('app-panel--collapsed');
    expect(panel('list').style.width).toBe('300px');

    expect(() => {
      button('comments', 'Collapse Comments').click();
      fixture.detectChanges();
    }).not.toThrow();
    expect(panel('comments').classList).toContain('app-panel--collapsed');
  });

  it('ignores stored values of the wrong shape', () => {
    const service = TestBed.inject(PanelStateService);
    window.localStorage.setItem('ontrack.panels.spec.comments', '{"collapsed":"yes","width":-4}');
    expect(service.read('spec', 'comments')).toEqual({});
    window.localStorage.setItem('ontrack.panels.spec.comments', 'not json');
    expect(service.read('spec', 'comments')).toEqual({});
  });

  it('goes full screen, makes the rest inert, and leaves on Esc', () => {
    create();
    button('comments', 'Full screen Comments').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.fullscreen).toBe('comments');
    expect(panel('comments').classList).toContain('app-panel--fullscreen');
    expect(panel('list').hasAttribute('inert')).toBe(true);
    expect(button('comments', 'Exit full screen').getAttribute('aria-pressed')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    fixture.detectChanges();

    expect(fixture.componentInstance.fullscreen).toBeNull();
    expect(panel('list').hasAttribute('inert')).toBe(false);
  });

  it('shows one panel at a time behind tabs when stacked, and ignores collapse', () => {
    window.localStorage.setItem('ontrack.panels.spec.comments', '{"collapsed":true}');
    create();
    stacked$.next({matches: true, breakpoints: {}});
    fixture.detectChanges();

    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(3);
    expect(panel('list').classList).not.toContain('app-panel--hidden');
    expect(panel('comments').classList).toContain('app-panel--hidden');

    (tabs[2] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(panel('comments').classList).not.toContain('app-panel--hidden');
    expect(panel('comments').classList).not.toContain('app-panel--collapsed');
    expect(panel('list').classList).toContain('app-panel--hidden');
  });
});
