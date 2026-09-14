import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {of, throwError} from 'rxjs';
import {routes} from 'src/app/app.routes';
import {roleWhitelistGuard} from 'src/app/common/guards/role-whitelist.guard';
import {CalendarModalService} from 'src/app/common/modals/calendar-modal/calendar-modal.service';
import {DEMO_TOOLS_AVAILABLE, DemoModeStore} from 'src/app/demo/demo-mode.store';
import {unitHubDemo} from './unit-hub-demo.fixtures';
import {UnitHubComponent} from './unit-hub.component';
import {UnitHubService, scopeHubFeed} from './unit-hub.service';

const feed = () => scopeHubFeed(unitHubDemo(new Date('2026-09-14T06:00:00Z')));

describe('Unit Hub route, forms and rendered content', () => {
  let service: {
    feed: ReturnType<typeof vi.fn>;
    announcements: ReturnType<typeof vi.fn>;
    sessions: ReturnType<typeof vi.fn>;
    saveAnnouncement: ReturnType<typeof vi.fn>;
    saveSession: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let calendars: {show: ReturnType<typeof vi.fn>};
  let demo: DemoModeStore;
  beforeEach(() => {
    sessionStorage.clear();
    service = {
      feed: vi.fn().mockImplementation(() => of(feed())),
      announcements: vi.fn().mockReturnValue(of([])),
      sessions: vi.fn().mockReturnValue(of([])),
      saveAnnouncement: vi.fn().mockReturnValue(of({id: 5})),
      saveSession: vi.fn().mockReturnValue(of({id: 5})),
      remove: vi.fn().mockReturnValue(of({success: true})),
    };
    calendars = {show: vi.fn()};
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{path: 'unit-hub', component: UnitHubComponent}]),
        {provide: UnitHubService, useValue: service},
        {provide: CalendarModalService, useValue: calendars},
        {provide: DEMO_TOOLS_AVAILABLE, useValue: true},
      ],
    });
    demo = TestBed.inject(DemoModeStore);
  });
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  async function open(url = '/unit-hub') {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl(url, UnitHubComponent);
    harness.detectChanges();
    return {harness, component, element: harness.routeNativeElement as HTMLElement};
  }

  it('has a reachable lazy route restricted to recognised account roles', async () => {
    const route = routes.find((item) => item.path === 'unit-hub');
    expect(route.loadComponent).toBeDefined();
    expect(route.canActivate).toContain(roleWhitelistGuard);
    expect(route.data.roleWhitelist).toContain('Student');
    const {element} = await open();
    expect(element.querySelector('h1')?.textContent).toBe('Unit Hub');
    expect(element.textContent).toContain('Computer Systems HelpHub');
    expect(element.textContent).not.toContain('SIT102 HelpHub must stay hidden');
    expect(element.textContent).not.toContain('Manage updates');
  });

  it('unknown unit deep links reveal no other unit content and show a useful message', async () => {
    const {component, element} = await open('/unit-hub?unit=102');
    expect(component.sessions).toEqual([]);
    expect(component.announcements).toEqual([]);
    expect(element.textContent).toContain('This unit is not available to your account');
    expect(element.textContent).not.toContain('Computer Systems HelpHub');
  });

  it('switches update type from the visible controls', async () => {
    const {harness, element} = await open();
    const button = Array.from(element.querySelectorAll('nav button')).find(
      (item) => item.textContent?.trim() === 'Sessions',
    ) as HTMLButtonElement;
    button.click();
    harness.detectChanges();
    expect(element.querySelector('#announcements-title')).toBeNull();
    expect(element.querySelector('#sessions-title')).not.toBeNull();
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('renders announcement text without interpreting HTML', async () => {
    const data = feed();
    data.announcements[0].body = '<img src=x onerror=alert(1)> Please review your tasks.';
    service.feed.mockReturnValue(of(data));
    const {element} = await open();
    expect(element.querySelector('.announcement-card img')).toBeNull();
    expect(element.textContent).toContain('<img src=x onerror=alert(1)>');
    const link = element.querySelector('a[href^="https://calendar.google.com"]');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('clears failed feeds, offers retry and shows the genuine empty state after recovery', async () => {
    service.feed
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of({units: [], announcements: [], sessions: []}));
    const {harness, component, element} = await open();
    expect(element.textContent).toContain('Updates are unavailable');
    expect(component.sessions).toEqual([]);
    const retry = Array.from(element.querySelectorAll('button')).find(
      (button) => button.textContent === 'Try again',
    );
    retry.click();
    harness.detectChanges();
    expect(element.textContent).toContain('No active units to show');
  });

  it('demo Google drafts are marked fictional, omit joining links and never open subscription settings', async () => {
    demo.setEnabled(true);
    const {component, element} = await open();
    const link = element.querySelector(
      'a[href^="https://calendar.google.com"]',
    ) as HTMLAnchorElement;
    const url = new URL(link.href);
    expect(url.searchParams.get('text')).toContain('DEMO');
    expect(url.searchParams.get('details')).toContain('FICTIONAL ONTRACK DEMO');
    expect(url.searchParams.get('details')).not.toContain('https://');
    expect(url.searchParams.get('location')).toBe('Fictional demo only');
    expect(element.querySelector('a[href*="example.invalid"]')).toBeNull();
    component.openCalendar();
    expect(calendars.show).not.toHaveBeenCalled();
    component.toggleManage();
    expect(service.announcements).not.toHaveBeenCalled();
    expect(service.sessions).not.toHaveBeenCalled();
  });

  it('cancelled occurrences offer no join or export actions', async () => {
    const data = feed();
    data.sessions = [{...data.sessions[0], cancelled: true}];
    service.feed.mockReturnValue(of(data));
    const {element} = await open();
    const card = element.querySelector('.session-card');
    expect(card.textContent).toContain('Cancelled');
    expect(card.querySelector('a[href^="https://calendar.google.com"]')).toBeNull();
    expect(card.querySelector('a[href*="example.invalid"]')).toBeNull();
  });

  async function openManager() {
    const data = feed();
    data.units[0].can_manage = true;
    service.feed.mockReturnValue(of(data));
    const result = await open();
    result.component.toggleManage();
    result.harness.detectChanges();
    return result;
  }

  it('shows configured Teams imports as read-only and links staff back to their source', async () => {
    const data = feed();
    data.units[0].can_manage = true;
    data.units[0].teams_sync = 'configured';
    const imported = {
      ...data.announcements[0],
      source_provider: 'microsoft_teams' as const,
      managed_externally: true,
      source_url: 'https://teams.microsoft.com/l/message/example',
    };
    service.feed.mockReturnValue(of(data));
    service.announcements.mockReturnValue(of([imported]));
    const {component, harness, element} = await open();
    component.toggleManage();
    harness.detectChanges();
    expect(element.textContent).toContain('Automatic Teams announcements are configured');
    expect(
      element.querySelector('a[href="https://teams.microsoft.com/l/message/example"]')?.textContent,
    ).toContain('Manage in Teams');
    expect(element.querySelector(`button[aria-label="Edit ${imported.title}"]`)).toBeNull();
    component.editAnnouncement(imported);
    expect(component.editor).toBeNull();
    component.deleteCandidate = {id: imported.id, title: imported.title, kind: 'announcements'};
    component.confirmRemove();
    expect(service.remove).not.toHaveBeenCalled();
  });

  it('does not imply that Microsoft sign-in alone enables a Teams connection', async () => {
    const {element} = await openManager();
    const text = element.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('Microsoft sign-in alone does not turn that connection on.');
    expect(text).not.toContain('Automatic Teams announcements are configured');
  });

  it('labels imported announcements for students without showing account or tenant details', async () => {
    const data = feed();
    data.announcements[0].source_provider = 'microsoft_teams';
    service.feed.mockReturnValue(of(data));
    const {element} = await open();
    expect(element.querySelector('.announcement-card')?.textContent).toContain('From Teams');
    expect(element.textContent).not.toContain('Manage in Teams');
  });

  it('staff can create a draft announcement only inside a manageable unit', async () => {
    const {component, harness, element} = await openManager();
    component.editAnnouncement();
    harness.detectChanges();
    expect(element.querySelector('label[for="announcement-title"]')).not.toBeNull();
    component.announcementForm.patchValue({
      title: 'Week update',
      body: 'Bring questions',
      published: false,
    });
    component.save();
    expect(service.saveAnnouncement).toHaveBeenCalledWith(
      111,
      expect.objectContaining({title: 'Week update', published_at: null}),
      undefined,
    );
    component.managedUnitId = 102;
    component.editSession();
    expect(component.editor).toBeNull();
  });

  it('staff session form converts the chosen time zone and preserves weekly rules', async () => {
    const {component} = await openManager();
    component.editSession();
    component.sessionForm.patchValue({
      title: 'HelpHub',
      start_at: '2026-10-08T17:00',
      end_at: '2026-10-08T18:00',
      timezone: 'Australia/Melbourne',
      recurrence: 'weekly',
      recurrence_until: '2026-11-05',
      published: true,
      join_url: 'https://teams.microsoft.com/example',
    });
    component.save();
    expect(service.saveSession).toHaveBeenCalledWith(
      111,
      expect.objectContaining({
        start_at: '2026-10-08T06:00:00.000Z',
        end_at: '2026-10-08T07:00:00.000Z',
        timezone: 'Australia/Melbourne',
        recurrence: 'weekly',
        recurrence_until: '2026-11-05',
      }),
      undefined,
    );
  });

  it('invalid dates and unsafe links never reach the write endpoint', async () => {
    const {component} = await openManager();
    component.editSession();
    component.sessionForm.patchValue({
      title: 'HelpHub',
      start_at: '2026-10-04T02:30',
      end_at: '2026-10-04T04:00',
    });
    component.save();
    expect(component.formError).toContain('clocks change');
    expect(service.saveSession).not.toHaveBeenCalled();
    component.editAnnouncement();
    component.announcementForm.patchValue({
      title: 'Update',
      body: 'Hello',
      source_url: 'javascript:alert(1)',
    });
    component.save();
    expect(component.formError).toContain('HTTPS');
    expect(service.saveAnnouncement).not.toHaveBeenCalled();
  });

  it('failed saves retain entered content for correction', async () => {
    service.saveAnnouncement.mockReturnValue(throwError(() => new Error('422')));
    const {component} = await openManager();
    component.editAnnouncement();
    component.announcementForm.patchValue({title: 'My draft', body: 'Keep my work'});
    component.save();
    expect(component.formError).toContain('Could not save');
    expect(component.announcementForm.controls.body.value).toBe('Keep my work');
    expect(component.saving).toBe(false);
  });
});
