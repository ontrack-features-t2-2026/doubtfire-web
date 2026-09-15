import {beforeEach, describe, expect, it} from 'vitest';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatCheckboxHarness} from '@angular/material/checkbox/testing';
import {MatIconModule} from '@angular/material/icon';
import {RouterModule} from '@angular/router';
import {User} from 'src/app/api/models/user/user';
import {NotificationSettingsComponent} from './notification-settings.component';

const makeUser = (): User =>
  ({
    id: 1,
    systemRole: 'Student',
    receiveTaskNotifications: false,
    receiveFeedbackNotifications: false,
    receivePortfolioNotifications: false,
    receiveUnitHubNotifications: true,
    receiveUnitHubEmailNotifications: false,
    receiveUnitHubPushNotifications: false,
    receiveUnitHubSessionReminders: false,
  }) as User;

describe('NotificationSettingsComponent', () => {
  let component: NotificationSettingsComponent;
  let fixture: ComponentFixture<NotificationSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NotificationSettingsComponent],
      imports: [FormsModule, MatCheckboxModule, MatIconModule, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationSettingsComponent);
    component = fixture.componentInstance;
    component.user = makeUser();

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the four notification categories and the Unit Hub channels', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);

    expect(await Promise.all(checkboxes.map((checkbox) => checkbox.getLabelText()))).toEqual([
      'Task notifications',
      'Feedback notifications',
      'Portfolio notifications',
      'Unit Hub updates',
      'Email',
      'Push',
      'Session reminders',
    ]);
  });

  it('renders the Unit Hub row like the other categories', () => {
    const rows: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.notification-setting'),
    );
    const hubRow = rows[3];

    expect(rows.length).toBe(4);
    expect(hubRow.querySelector('small')?.id).toBe('unit-hub-notification-description');
    expect(hubRow.textContent).toContain('New and changed announcements');
    expect(hubRow.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      'Also send Unit Hub updates by',
    );
  });

  it('starts Unit Hub updates in the app only, and saves each channel to its own field', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const hub = await loader.getHarness(MatCheckboxHarness.with({label: 'Unit Hub updates'}));
    const email = await loader.getHarness(MatCheckboxHarness.with({label: 'Email'}));
    const push = await loader.getHarness(MatCheckboxHarness.with({label: 'Push'}));
    const reminders = await loader.getHarness(
      MatCheckboxHarness.with({label: 'Session reminders'}),
    );

    expect(await hub.isChecked()).toBe(true);
    expect(await email.isChecked()).toBe(false);
    expect(await push.isChecked()).toBe(false);
    expect(await reminders.isChecked()).toBe(false);

    await email.check();
    await reminders.check();

    expect(component.user.receiveUnitHubEmailNotifications).toBe(true);
    expect(component.user.receiveUnitHubPushNotifications).toBe(false);
    expect(component.user.receiveUnitHubSessionReminders).toBe(true);
  });

  it('turns the Unit Hub channels off while the category is off', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const hub = await loader.getHarness(MatCheckboxHarness.with({label: 'Unit Hub updates'}));

    await hub.uncheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.user.receiveUnitHubNotifications).toBe(false);
    for (const label of ['Email', 'Push', 'Session reminders']) {
      const channel = await loader.getHarness(MatCheckboxHarness.with({label}));
      expect(await channel.isDisabled()).toBe(true);
    }
  });

  it('updates the correct user preference when toggled', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const taskCheckbox = await loader.getHarness(
      MatCheckboxHarness.with({label: 'Task notifications'}),
    );
    const feedbackCheckbox = await loader.getHarness(
      MatCheckboxHarness.with({label: 'Feedback notifications'}),
    );
    const portfolioCheckbox = await loader.getHarness(
      MatCheckboxHarness.with({label: 'Portfolio notifications'}),
    );

    await taskCheckbox.check();

    expect(component.user.receiveTaskNotifications).toBe(true);
    expect(component.user.receiveFeedbackNotifications).toBe(false);
    expect(component.user.receivePortfolioNotifications).toBe(false);

    await feedbackCheckbox.check();

    expect(component.user.receiveFeedbackNotifications).toBe(true);

    await portfolioCheckbox.check();

    expect(component.user.receivePortfolioNotifications).toBe(true);
  });

  it('shows help text for each notification category', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Due dates, changed dates and task status updates.');
    expect(text).toContain('help requests and extension requests');
    expect(text).toContain('New comments, feedback, and review outcomes.');
    expect(text).toContain('Portfolio processing and assessment updates.');
    expect(text).toContain('Session reminders arrive 30 minutes before a session starts.');
  });

  it('associates each checkbox with its help text', () => {
    const inputs = fixture.nativeElement.querySelectorAll(
      '.notification-setting > mat-checkbox input[type="checkbox"]',
    );
    const descriptions = fixture.nativeElement.querySelectorAll('.notification-setting small[id]');
    const descriptionIds = [
      'task-notification-description',
      'feedback-notification-description',
      'portfolio-notification-description',
      'unit-hub-notification-description',
    ];

    expect(inputs.length).toBe(4);
    expect(descriptions.length).toBe(4);

    descriptionIds.forEach((id, index) => {
      expect(descriptions[index].id).toBe(id);
      expect(inputs[index].getAttribute('aria-describedby')).toBe(id);
      expect(inputs[index].hasAttribute('name')).toBe(false);
    });
  });

  it('links the notification preferences to the notifications page', () => {
    fixture.componentRef.setInput('showNotificationsLink', true);
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href="/notifications"]');

    expect(link).not.toBeNull();
    expect(link.textContent.trim()).toBe('Notifications page');
  });

  // The admin Users dialog and the first-login form render these settings too,
  // and neither should link to the viewer's own notifications.
  it('leaves the notifications page link out unless asked to show it', () => {
    expect(fixture.nativeElement.querySelector('a[href="/notifications"]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Notifications page');
  });
});
