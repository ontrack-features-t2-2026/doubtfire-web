import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {provideHttpClient, withInterceptorsFromDi, withXhr} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {PeerProgressIndicator} from 'src/app/api/models/peer-progress-indicator';
import API_URL from 'src/app/config/constants/apiUrl';
import {DISABLED_STATE, NORMAL_STATE, SUPPRESSED_STATE} from '../mock/peer-progress-indicator.mock';
import {PeerProgressIndicatorService} from '../peer-progress-indicator.service';

describe('PeerProgressIndicatorService', () => {
  let service: PeerProgressIndicatorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PeerProgressIndicatorService,
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PeerProgressIndicatorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify({ignoreCancelled: true});
  });

  it('requests the authorised project/task route without client-supplied cohort parameters', () => {
    service.getIndicator(7, 99).subscribe();

    const request = httpMock.expectOne(`${API_URL}/projects/7/task_def_id/99/peer_progress`);

    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);

    request.flush({
      task_definition_id: 99,
      unit_id: 1,
      target_grade: 2,
      submitted_percentage: 40,
      is_suppressed: false,
      is_stale: false,
      is_feature_enabled: true,
      last_updated_at: '2026-08-23T00:00:00Z',
      unavailable_message: '',
    });
  });

  it('maps the complete snake-case response and preserves nullable fields', () => {
    let result: PeerProgressIndicator | undefined;

    service.getIndicator(7, 99).subscribe((value) => {
      result = value;
    });

    httpMock.expectOne(`${API_URL}/projects/7/task_def_id/99/peer_progress`).flush({
      task_definition_id: 99,
      unit_id: 1,
      target_grade: null,
      submitted_percentage: null,
      is_suppressed: false,
      is_stale: false,
      is_feature_enabled: true,
      last_updated_at: null,
      unavailable_message: 'Peer progress is currently unavailable.',
    });

    expect(result).toEqual({
      taskDefinitionId: 99,
      unitId: 1,
      targetGrade: null,
      submittedPercentage: null,
      isSuppressed: false,
      isStale: false,
      isFeatureEnabled: true,
      lastUpdatedAt: null,
      unavailableMessage: 'Peer progress is currently unavailable.',
    });
  });

  it('cancels the live HTTP request when the caller unsubscribes', () => {
    const subscription = service.getIndicator(7, 99).subscribe();
    const request = httpMock.expectOne(`${API_URL}/projects/7/task_def_id/99/peer_progress`);

    subscription.unsubscribe();

    expect(request.cancelled).toBe(true);
  });

  describe('getMockUnitSummary', () => {
    it('should keep the student and cohort percentages separate for a normal response', () => {
      service.getMockUnitSummary(10, 2, 30, 'normal').subscribe((result) => {
        expect(result.studentPercentage).toBe(30);
        expect(result.submittedPercentage).toBe(NORMAL_STATE.submittedPercentage);
        expect(result.isSuppressed).toBe(NORMAL_STATE.isSuppressed);

        expect(result.unitId).toBe(10);
        expect(result.targetGrade).toBe(2);
      });
    });

    it('should not expose a task definition id -- a unit summary is not task-scoped', () => {
      service.getMockUnitSummary(10, 2, 30, 'normal').subscribe((result) => {
        expect((result as unknown as {taskDefinitionId?: number}).taskDefinitionId).toBeUndefined();
      });
    });

    it('should return suppressed state with the safe message and no cohort percentage', () => {
      service.getMockUnitSummary(30, 0, 30, 'suppressed').subscribe((result) => {
        expect(result.submittedPercentage).toBe(SUPPRESSED_STATE.submittedPercentage);
        expect(result.isSuppressed).toBe(true);
        expect(result.unavailableMessage).toBe(SUPPRESSED_STATE.unavailableMessage);
        expect(result.studentPercentage).toBe(30);
      });
    });

    it('should return disabled state when the unit has PPI turned off', () => {
      service.getMockUnitSummary(60, 1, 30, 'disabled').subscribe((result) => {
        expect(result.isFeatureEnabled).toBe(false);
        expect(result.unavailableMessage).toBe(DISABLED_STATE.unavailableMessage);
      });
    });

    it('should preserve a null studentPercentage rather than substituting a default', () => {
      service.getMockUnitSummary(10, 2, null, 'normal').subscribe((result) => {
        expect(result.studentPercentage).toBeNull();
      });
    });
  });
});
