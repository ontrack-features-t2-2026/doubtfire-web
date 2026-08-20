import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import API_URL from 'src/app/config/constants/apiUrl';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';

describe('DoubtfireConstants', () => {
  let httpMock: HttpTestingController;

  const publicSettings = {
    externalName: 'OnTrack',
    hasLogo: true,
    logoUrl: '/logo.svg',
    logoLinkUrl: '/',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushSignoutUrl(): void {
    const request = httpMock.expectOne(`${API_URL}/auth/signout_url`);
    request.flush({auth_signout_url: '/sign_out'});
  }

  it('loads public branding without authentication headers', () => {
    const service = TestBed.inject(DoubtfireConstants);

    const request = httpMock.expectOne(`${API_URL}/settings/public`);

    expect(request.request.headers.has('Auth-Token')).toBe(false);
    expect(request.request.headers.has('Username')).toBe(false);

    request.flush(publicSettings);
    flushSignoutUrl();

    expect(service.ExternalName.value).toBe('OnTrack');
    expect(service.LogoSettings.value).toEqual({
      hasLogo: true,
      logoUrl: '/logo.svg',
      logoLinkUrl: '/',
    });
  });

  it('falls back to the legacy settings route during a staged deployment', () => {
    const service = TestBed.inject(DoubtfireConstants);

    const publicRequest = httpMock.expectOne(`${API_URL}/settings/public`);
    publicRequest.flush(
      {error: 'Not found'},
      {
        status: 404,
        statusText: 'Not Found',
      },
    );

    const legacyRequest = httpMock.expectOne(`${API_URL}/settings`);
    legacyRequest.flush({
      ...publicSettings,
      overseerEnabled: true,
      tiiEnabled: true,
      d2lEnabled: true,
    });

    flushSignoutUrl();

    expect(service.ExternalName.value).toBe('OnTrack');
  });

  it('applies feature flags received after authentication', () => {
    const service = TestBed.inject(DoubtfireConstants);

    const publicRequest = httpMock.expectOne(`${API_URL}/settings/public`);
    publicRequest.flush(publicSettings);
    flushSignoutUrl();

    service.applyAuthenticatedSettings({
      overseerEnabled: true,
      tiiEnabled: true,
      d2lEnabled: false,
    });

    expect(service.IsOverseerEnabled.value).toBe(true);
    expect(service.IsTiiEnabled.value).toBe(true);
    expect(service.IsD2LEnabled.value).toBe(false);
  });
});
