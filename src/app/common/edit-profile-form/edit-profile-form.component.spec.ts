import {beforeEach, describe, expect, it} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {of} from 'rxjs';
import {AuthenticationService} from 'src/app/api/services/authentication.service';
import {PushNotificationService} from 'src/app/api/services/push-notification.service';
import {UserService} from 'src/app/api/services/user.service';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {EditProfileFormComponent} from './edit-profile-form.component';

const emptyProvider = {};

// The component subscribes to this in ngOnInit. Stubbed here rather than
// providing the real service, which would pull in SwPush and the whole service
// worker with it.
const pushServiceStub = {
  subscription$: of(null),
  isEnabled: false,
  blocker: () => 'no-service-worker' as const,
};

describe('EditProfileFormComponent', () => {
  let component: EditProfileFormComponent;
  let fixture: ComponentFixture<EditProfileFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditProfileFormComponent],
      providers: [
        {provide: DoubtfireConstants, useValue: emptyProvider},
        {provide: UserService, useValue: emptyProvider},
        {provide: Router, useValue: emptyProvider},
        {provide: AuthenticationService, useValue: emptyProvider},
        {provide: MAT_DIALOG_DATA, useValue: emptyProvider},
        {provide: MatSnackBar, useValue: emptyProvider},
        {provide: PushNotificationService, useValue: pushServiceStub},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(EditProfileFormComponent, {set: {template: ''}})
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProfileFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
