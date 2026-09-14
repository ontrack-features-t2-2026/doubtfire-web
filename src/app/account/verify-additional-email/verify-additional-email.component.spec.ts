import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {of, throwError} from 'rxjs';
import {AdditionalNotificationEmailService} from 'src/app/api/services/additional-notification-email.service';
import {AuthenticationService} from 'src/app/api/services/authentication.service';
import {
  captureAndScrubAdditionalEmailVerification,
  consumeAdditionalEmailVerificationToken,
} from 'src/app/security/additional-email-verification-callback';
import {AuthReturnUrlService} from 'src/app/security/auth-return-url.service';
import {VerifyAdditionalEmailComponent} from './verify-additional-email.component';

describe('VerifyAdditionalEmailComponent', () => {
  let fixture: ComponentFixture<VerifyAdditionalEmailComponent>;
  let component: VerifyAdditionalEmailComponent;
  const service = {verify: vi.fn()};
  const authentication = {isAuthenticated: vi.fn()};
  const router = {navigateByUrl: vi.fn()};
  const authReturnUrl = {remember: vi.fn()};
  let token: string | null = 'private-token';

  const create = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      declarations: [VerifyAdditionalEmailComponent],
      providers: [
        {provide: AdditionalNotificationEmailService, useValue: service},
        {provide: AuthenticationService, useValue: authentication},
        {provide: Router, useValue: router},
        {provide: AuthReturnUrlService, useValue: authReturnUrl},
      ],
    })
      .overrideComponent(VerifyAdditionalEmailComponent, {set: {template: ''}})
      .compileComponents();
    fixture = TestBed.createComponent(VerifyAdditionalEmailComponent);
    component = fixture.componentInstance;
    if (token) {
      captureAndScrubAdditionalEmailVerification(
        `https://ontrack.example/verify_additional_email#token=${token}`,
        vi.fn(),
      );
    }
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    consumeAdditionalEmailVerificationToken();
    token = 'private-token';
    service.verify.mockReturnValue(of(undefined));
    authentication.isAuthenticated.mockReturnValue(false);
  });

  it('consumes the pre-bootstrap token once and reports success', async () => {
    await create();

    expect(service.verify).toHaveBeenCalledWith('private-token');
    expect(component.state).toBe('verified');
    expect(consumeAdditionalEmailVerificationToken()).toBeNull();
  });

  it('takes a signed-out verifier through sign-in with the profile saved as the destination', async () => {
    await create();
    component.openProfile();
    expect(authReturnUrl.remember).toHaveBeenCalledWith('/edit_profile');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/sign_in');
  });

  it('opens the profile directly for an already authenticated user', async () => {
    authentication.isAuthenticated.mockReturnValue(true);
    await create();
    component.openProfile();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/edit_profile');
    expect(authReturnUrl.remember).not.toHaveBeenCalled();
  });

  it('does not call the API for an incomplete link', async () => {
    token = null;
    await create();

    expect(service.verify).not.toHaveBeenCalled();
    expect(component.state).toBe('error');
  });

  it('shows one safe error for expired or replayed links', async () => {
    service.verify.mockReturnValue(throwError(() => new Error('expired')));
    await create();

    expect(component.state).toBe('error');
    expect(component.message).toContain('invalid, expired, or has already been used');
  });
});
