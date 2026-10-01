import {beforeEach, describe, expect, it, vi} from 'vitest';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatCheckboxHarness} from '@angular/material/checkbox/testing';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {MatSelectHarness} from '@angular/material/select/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {User} from 'src/app/api/models/user/user';
import {NotificationSettingsComponent} from './notification-settings.component';

describe('NotificationSettingsComponent channel choices', () => {
  let fixture: ComponentFixture<NotificationSettingsComponent>;
  let component: NotificationSettingsComponent;
  const checkbox = (selector: string) =>
    TestbedHarnessEnvironment.loader(fixture).getHarness(MatCheckboxHarness.with({selector}));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NotificationSettingsComponent],
      imports: [
        FormsModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatSelectModule,
        NoopAnimationsModule,
        RouterModule.forRoot([]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NotificationSettingsComponent);
    component = fixture.componentInstance;
    component.user = Object.assign(new User(), {
      id: 1,
      systemRole: 'Student',
      receiveTaskNotifications: true,
      receiveFeedbackNotifications: true,
      receivePortfolioNotifications: true,
      receiveTaskEmailNotifications: false,
      receiveTaskPushNotifications: true,
      receiveFeedbackEmailNotifications: false,
      receiveFeedbackPushNotifications: true,
      receivePortfolioEmailNotifications: false,
      receivePortfolioPushNotifications: true,
      receiveUnitHubNotifications: true,
      receiveUnitHubEmailNotifications: false,
      receiveUnitHubPushNotifications: false,
      receiveUnitHubSessionReminders: false,
      digestFrequency: 'off',
      staffDigestFrequency: 'off',
    });
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it.each(['task', 'feedback', 'portfolio'])(
    'changes only the selected %s channel and reports unsaved changes',
    async (category) => {
      const change = vi.fn();
      component.preferencesChange.subscribe(change);
      await (await checkbox(`#${category}-email`)).check();
      const key = category[0].toUpperCase() + category.slice(1);
      expect(component.user[`receive${key}EmailNotifications`]).toBe(true);
      expect(component.user[`receive${key}PushNotifications`]).toBe(true);
      expect(component.user[`receive${key}Notifications`]).toBe(true);
      await (await checkbox(`#${category}-push`)).uncheck();
      expect(component.user[`receive${key}EmailNotifications`]).toBe(true);
      expect(component.user[`receive${key}PushNotifications`]).toBe(false);
      expect(change).toHaveBeenCalledTimes(2);
    },
  );

  it('reports changes for every Unit Hub switch', async () => {
    const change = vi.fn();
    component.preferencesChange.subscribe(change);
    await (await checkbox('#unit-hub-email')).check();
    await (await checkbox('#unit-hub-push')).check();
    await (
      await TestbedHarnessEnvironment.loader(fixture).getHarness(
        MatCheckboxHarness.with({label: 'Session reminders'}),
      )
    ).check();
    await (
      await TestbedHarnessEnvironment.loader(fixture).getHarness(
        MatCheckboxHarness.with({label: 'Unit Hub updates'}),
      )
    ).uncheck();
    expect(change).toHaveBeenCalledTimes(4);
    expect(await (await checkbox('#unit-hub-email')).isDisabled()).toBe(true);
    expect(component.user.receiveUnitHubEmailNotifications).toBe(true);
  });

  it('allows a student summary even when feedback email is off', async () => {
    const change = vi.fn();
    component.preferencesChange.subscribe(change);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatSelectHarness);
    await select.open();
    await select.clickOptions({text: 'Daily'});
    expect(component.user.digestFrequency).toBe('daily');
    expect(component.user.receiveFeedbackEmailNotifications).toBe(false);
    expect(change).toHaveBeenCalledOnce();
  });

  it('offers an independent teaching summary to staff, initially off', async () => {
    component.user.systemRole = 'Tutor';
    fixture.detectChanges();
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      MatSelectHarness.with({selector: '#staff-digest-frequency'}),
    );
    expect(await select.getValueText()).toBe('Never');
    await select.open();
    await select.clickOptions({text: 'Weekly'});
    expect(component.user.staffDigestFrequency).toBe('weekly');
    expect(component.user.digestFrequency).toBe('off');
  });

  it('does not offer a teaching summary to students', () => {
    expect(fixture.nativeElement.querySelector('#staff-digest-label')).toBeNull();
  });

  it('cannot change delivery preferences for another account', async () => {
    fixture.componentRef.setInput('editable', false);
    fixture.detectChanges();
    for (const control of await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(
      MatCheckboxHarness,
    )) {
      expect(await control.isDisabled()).toBe(true);
    }
    expect(
      await (
        await TestbedHarnessEnvironment.loader(fixture).getHarness(MatSelectHarness)
      ).isDisabled(),
    ).toBe(true);
  });

  it('gives channels unique accessible names and related descriptions', () => {
    for (const category of ['task', 'feedback', 'portfolio']) {
      for (const channel of ['email', 'push']) {
        const input = fixture.nativeElement.querySelector(`#${category}-${channel} input`);
        expect(input.getAttribute('aria-label').toLowerCase()).toBe(
          `${category} updates by ${channel}`,
        );
        expect(input.getAttribute('aria-describedby')).toBe(`${category}-notification-description`);
      }
    }
    expect(fixture.nativeElement.textContent).toContain(
      'these choices do not turn on device permission',
    );
  });

  it('links only when viewing the account holder notifications', () => {
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    fixture.componentRef.setInput('showNotificationsLink', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/notifications');
  });
});
