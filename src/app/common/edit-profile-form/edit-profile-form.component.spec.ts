import {beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {of} from 'rxjs';
import {User} from 'src/app/api/models/user/user';
import {AuthenticationService} from 'src/app/api/services/authentication.service';
import {PushNotificationService} from 'src/app/api/services/push-notification.service';
import {UserService} from 'src/app/api/services/user.service';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {EditProfileFormComponent} from './edit-profile-form.component';

const emptyProvider = {};

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 1,
    systemRole: 'Student',
    hasRunFirstTimeSetup: true,
    optInToResearch: true,
    receiveFeedbackNotifications: false,
    receivePortfolioNotifications: false,
    receiveTaskNotifications: false,
    displayPeerProgress: true,
    ...overrides,
  }) as User;

// The component subscribes to this in ngOnInit. Stubbed here rather than
// providing the real service, which would pull in SwPush and the whole service
// worker with it.
const pushServiceStub = {
  subscription$: of(null),
  isEnabled: false,
  blocker: (): 'no-service-worker' | 'permission-denied' => 'no-service-worker',
  permissionDeniedInstructions: (): string[] => [],
};

describe('EditProfileFormComponent', () => {
  let component: EditProfileFormComponent;
  let fixture: ComponentFixture<EditProfileFormComponent>;
  let userServiceStub: {
    currentUser: User;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let dialogData: {
    user: User;
    mode: 'edit' | 'create' | 'new';
    modal: boolean;
  };

  const createComponent = (): void => {
    fixture = TestBed.createComponent(EditProfileFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    pushServiceStub.blocker = () => 'no-service-worker';
    pushServiceStub.permissionDeniedInstructions = () => [];

    const currentUser = makeUser();

    userServiceStub = {
      currentUser,
      create: vi.fn().mockReturnValue(of(currentUser)),
      update: vi.fn().mockReturnValue(of(currentUser)),
    };
    dialogData = {
      user: currentUser,
      mode: 'edit',
      modal: false,
    };

    await TestBed.configureTestingModule({
      declarations: [EditProfileFormComponent],
      providers: [
        {provide: DoubtfireConstants, useValue: emptyProvider},
        {provide: UserService, useValue: userServiceStub},
        {provide: Router, useValue: {navigateByUrl: vi.fn()}},
        {provide: AuthenticationService, useValue: emptyProvider},
        {provide: MAT_DIALOG_DATA, useValue: dialogData},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
        {provide: PushNotificationService, useValue: pushServiceStub},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(EditProfileFormComponent, {set: {template: ''}})
      .compileComponents();
  });

  it('should create', () => {
    createComponent();

    expect(component).toBeTruthy();
  });

  it('preserves notification and research preferences in edit mode', () => {
    dialogData.user = makeUser({
      optInToResearch: true,
      receiveFeedbackNotifications: false,
      receivePortfolioNotifications: false,
      receiveTaskNotifications: false,
    });
    dialogData.mode = 'edit';

    createComponent();

    expect(component.user.optInToResearch).toBe(true);
    expect(component.user.receiveFeedbackNotifications).toBe(false);
    expect(component.user.receivePortfolioNotifications).toBe(false);
    expect(component.user.receiveTaskNotifications).toBe(false);
  });

  it("preserves an established user's explicit peer progress opt-out", () => {
    dialogData.user = makeUser({displayPeerProgress: false});

    createComponent();

    expect(component.user.displayPeerProgress).toBe(false);
  });

  it('defaults a rolling-API user without the preference field to on', () => {
    dialogData.user = makeUser({displayPeerProgress: undefined});

    createComponent();

    expect(component.user.displayPeerProgress).toBe(true);
  });

  it('does not change another user when opened by an admin', () => {
    userServiceStub.currentUser = makeUser({
      id: 1,
      systemRole: 'Admin',
    });
    dialogData.user = makeUser({
      id: 2,
      optInToResearch: true,
      receiveFeedbackNotifications: false,
      receivePortfolioNotifications: false,
      receiveTaskNotifications: false,
    });
    dialogData.mode = 'edit';

    createComponent();

    expect(component.user.optInToResearch).toBe(true);
    expect(component.user.receiveFeedbackNotifications).toBe(false);
    expect(component.user.receivePortfolioNotifications).toBe(false);
    expect(component.user.receiveTaskNotifications).toBe(false);
  });

  it('applies defaults before first-time setup', () => {
    dialogData.user = makeUser({
      hasRunFirstTimeSetup: false,
      optInToResearch: true,
      receiveFeedbackNotifications: false,
      receivePortfolioNotifications: false,
      receiveTaskNotifications: false,
    });
    dialogData.mode = 'create';

    createComponent();

    expect(component.user.optInToResearch).toBe(false);
    expect(component.user.receiveFeedbackNotifications).toBe(true);
    expect(component.user.receivePortfolioNotifications).toBe(true);
    expect(component.user.receiveTaskNotifications).toBe(true);
    expect(component.user.displayPeerProgress).toBe(true);
  });

  it('applies defaults to a blank user opened from the admin screen', () => {
    dialogData.user = {} as User;
    dialogData.mode = 'edit';

    createComponent();

    expect(component.user.optInToResearch).toBe(false);
    expect(component.user.receiveFeedbackNotifications).toBe(true);
    expect(component.user.receivePortfolioNotifications).toBe(true);
    expect(component.user.receiveTaskNotifications).toBe(true);
    expect(component.user.displayPeerProgress).toBe(true);
  });

  it('returns no instructions when nothing is blocking notifications', () => {
    createComponent();

    expect(component.pushBlockerInstructions).toEqual([]);
  });

  it('asks the push service for instructions when permission is denied', () => {
    pushServiceStub.blocker = () => 'permission-denied';
    pushServiceStub.permissionDeniedInstructions = () => ['step one', 'step two'];

    createComponent();

    expect(component.pushBlockerInstructions).toEqual(['step one', 'step two']);
  });

  it('treats SSO identity and own student id as read-only account information', () => {
    dialogData.user = makeUser({
      institutionalIdentityManaged: true,
      emailEditable: false,
    });

    createComponent();

    expect(component.canEditEmail).toBe(false);
    expect(component.canEditStudentId).toBe(false);
  });

  it('preserves local email editing and admin maintenance of another local student id', () => {
    userServiceStub.currentUser = makeUser({id: 1, systemRole: 'Admin'});
    dialogData.user = makeUser({
      id: 2,
      institutionalIdentityManaged: false,
      emailEditable: true,
    });

    createComponent();

    expect(component.canEditEmail).toBe(true);
    expect(component.canEditStudentId).toBe(true);
  });

  it('reports explicit saving and success state while preserving genuine settings', () => {
    const updated = makeUser({
      nickname: 'Preferred',
      receiveFeedbackNotifications: false,
    });
    dialogData.user = updated;
    userServiceStub.update.mockReturnValue(of(updated));

    createComponent();
    component.submit();

    expect(userServiceStub.update).toHaveBeenCalledWith(updated);
    expect(component.saving).toBe(false);
    expect(component.saveMessage).toBe('Profile saved.');
    expect(component.user.nickname).toBe('Preferred');
    expect(component.user.receiveFeedbackNotifications).toBe(false);
  });
});
