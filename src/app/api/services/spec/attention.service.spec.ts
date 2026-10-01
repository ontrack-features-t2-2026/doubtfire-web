import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {provideHttpClient, withInterceptorsFromDi, withXhr} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import API_URL from 'src/app/config/constants/apiUrl';
import {AttentionService} from '../attention.service';

describe('AttentionService', () => {
  let http: HttpTestingController;
  let service: AttentionService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AttentionService);
  });
  afterEach(() => http.verify());

  it('asks for the authenticated staff view and never supplies a user or unit override', () => {
    service.staff().subscribe();
    const request = http.expectOne(`${API_URL}/attention/staff`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush({units: [], totals: {}});
  });

  it('makes a new request after a previous view, rather than reusing another session’s summary', () => {
    service.staff().subscribe();
    http.expectOne(`${API_URL}/attention/staff`).flush({units: [], totals: {}});
    service.staff().subscribe();
    http.expectOne(`${API_URL}/attention/staff`).flush({units: [], totals: {}});
  });
});
