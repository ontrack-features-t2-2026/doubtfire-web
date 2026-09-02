import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {of, throwError} from 'rxjs';
import {User} from 'src/app/api/models/user/user';
import {AdditionalNotificationEmailService} from 'src/app/api/services/additional-notification-email.service';
import {AdditionalNotificationEmailComponent} from './additional-notification-email.component';

describe('AdditionalNotificationEmailComponent', () => {
  let fixture: ComponentFixture<AdditionalNotificationEmailComponent>;
  let component: AdditionalNotificationEmailComponent;
  const service = {
    get: vi.fn(),
    request: vi.fn(),
    resend: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    service.get.mockReturnValue(of({status: 'none', email: null, verificationExpiresAt: null}));
    service.request.mockReturnValue(
      of({
        status: 'pending',
        email: 'secondary@example.org',
        verificationExpiresAt: '2026-09-01T00:00:00Z',
      }),
    );
    service.resend.mockReturnValue(
      of({
        status: 'pending',
        email: 'secondary@example.org',
        verificationExpiresAt: '2026-09-01T00:00:00Z',
      }),
    );
    service.remove.mockReturnValue(of(undefined));

    await TestBed.configureTestingModule({
      declarations: [AdditionalNotificationEmailComponent],
      providers: [{provide: AdditionalNotificationEmailService, useValue: service}],
    })
      .overrideComponent(AdditionalNotificationEmailComponent, {set: {template: ''}})
      .compileComponents();

    fixture = TestBed.createComponent(AdditionalNotificationEmailComponent);
    component = fixture.componentInstance;
    component.user = {id: 12} as User;
    fixture.detectChanges();
  });

  it('loads state for only the signed-in profile user', () => {
    expect(service.get).toHaveBeenCalledWith(12);
    expect(component.state.status).toBe('none');
  });

  it('keeps normal copies off while a newly requested address is pending', () => {
    component.draftEmail = 'secondary@example.org';
    component.requestVerification();

    expect(service.request).toHaveBeenCalledWith(12, 'secondary@example.org');
    expect(component.state.status).toBe('pending');
    expect(component.message).toContain('No notification copies are sent yet');
  });

  it('preserves the address and exposes controlled failure feedback', () => {
    service.request.mockReturnValueOnce(
      throwError(() => ({error: {error: 'Too many verification requests.'}})),
    );
    component.draftEmail = 'secondary@example.org';
    component.requestVerification();

    expect(component.draftEmail).toBe('secondary@example.org');
    expect(component.errorMessage).toBe('Too many verification requests.');
  });

  it('requires confirmation before removal', () => {
    component.state = {
      status: 'verified',
      email: 'secondary@example.org',
      verificationExpiresAt: null,
    };
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.remove();
    expect(service.remove).not.toHaveBeenCalled();

    vi.mocked(window.confirm).mockReturnValue(true);
    component.remove();
    expect(service.remove).toHaveBeenCalledWith(12);
    expect(component.state.status).toBe('none');
  });
});
