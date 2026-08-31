import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import API_URL from 'src/app/config/constants/apiUrl';
import {DEMO_TOOLS_AVAILABLE, DemoModeStore} from './demo-mode.store';
import {DemoScenarioContract, DemoScenarioRegistryService} from './demo-scenario-registry.service';

describe('DemoScenarioRegistryService', () => {
  let http: HttpTestingController;
  let service: DemoScenarioRegistryService;
  let demoMode: {
    configureScenario: ReturnType<typeof vi.fn>;
    clearScenario: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    demoMode = {configureScenario: vi.fn(), clearScenario: vi.fn()};
    TestBed.configureTestingModule({
      providers: [
        DemoScenarioRegistryService,
        {provide: DemoModeStore, useValue: demoMode},
        {provide: DEMO_TOOLS_AVAILABLE, useValue: true},
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(DemoScenarioRegistryService);
  });

  afterEach(() => http.verify());

  it('enables availability only after the guarded contract succeeds', () => {
    const contract = {
      schema_version: 1,
      scenario_id: 'mobile-feedback-v1',
      demo_only: true,
    } as DemoScenarioContract;

    service.loadForAuthenticatedUser(42).subscribe();
    http.expectOne(`${API_URL}/demo/scenario`).flush(contract);

    expect(service.scenario).toBe(contract);
    expect(demoMode.configureScenario).toHaveBeenCalledWith('mobile-feedback-v1', 42);
  });

  it('fails closed on an ordinary runtime 404', () => {
    service.loadForAuthenticatedUser(42).subscribe();
    http
      .expectOne(`${API_URL}/demo/scenario`)
      .flush({error: 'Not found.'}, {status: 404, statusText: 'Not Found'});

    expect(service.scenario).toBeNull();
    expect(demoMode.clearScenario).toHaveBeenCalledOnce();
  });
});
