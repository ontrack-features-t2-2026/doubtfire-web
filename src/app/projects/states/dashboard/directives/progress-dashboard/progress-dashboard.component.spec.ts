import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatSelectHarness} from '@angular/material/select/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of, throwError} from 'rxjs';
import {Project} from 'src/app/api/models/project';
import {ProjectService} from 'src/app/api/services/project.service';
import {UserService} from 'src/app/api/services/user.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {GradeService} from 'src/app/common/services/grade.service';
import {ProgressDashboardComponent} from './progress-dashboard.component';

describe('ProgressDashboardComponent', () => {
  let component: ProgressDashboardComponent;
  let fixture: ComponentFixture<ProgressDashboardComponent>;
  let project: Project;
  let projectServiceUpdate: ReturnType<typeof vi.fn>;
  let alertSuccess: ReturnType<typeof vi.fn>;
  let alertError: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    project = {
      id: 18,
      targetGrade: 0,
      unit: {
        myRole: 'Student',
        gradeDefinitions: [
          {value: 0, label: 'Pass'},
          {value: 1, label: 'Credit'},
        ],
      },
      activeTasks: vi
        .fn()
        .mockReturnValue([{status: 'complete'}, {status: 'not_started'}, {status: 'not_started'}]),
      refreshBurndownChartData: vi.fn(),
    } as unknown as Project;

    projectServiceUpdate = vi.fn().mockReturnValue(of(project));
    alertSuccess = vi.fn();
    alertError = vi.fn();

    await TestBed.configureTestingModule({
      declarations: [ProgressDashboardComponent],
      imports: [MatCardModule, MatFormFieldModule, MatSelectModule, NoopAnimationsModule],
      providers: [
        {
          provide: GradeService,
          useValue: {
            grades: {0: 'Pass', 1: 'Credit'},
            gradeValues: [0, 1],
            gradeValuesFor: () => [0, 1],
          },
        },
        {provide: ProjectService, useValue: {update: projectServiceUpdate}},
        {provide: AlertService, useValue: {success: alertSuccess, error: alertError}},
        {provide: UserService, useValue: {currentUser: {id: 25}}},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressDashboardComponent);
    component = fixture.componentInstance;
    component.project = project;
    fixture.detectChanges();
    await fixture.whenStable();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lets the student select a target grade directly from the dashboard', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const select = await loader.getHarness(
      MatSelectHarness.with({selector: '[aria-label="Target grade"]'}),
    );

    expect(await select.isDisabled()).toBe(false);
    expect(await select.getValueText()).toBe('Pass');

    await select.open();
    await select.clickOptions({text: 'Credit'});

    expect(project.targetGrade).toBe(1);
    expect(projectServiceUpdate).toHaveBeenCalledWith(project);
    expect(alertSuccess).toHaveBeenCalledWith('Updated target grade successfully', 2000);
    expect(component.numberOfTasks).toEqual({completed: 1, remaining: 2});
  });

  it('locks the selector when staff are viewing another student project', async () => {
    project.unit.myRole = 'Tutor';
    project.student = {id: 99} as Project['student'];
    fixture.detectChanges();
    await fixture.whenStable();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const select = await loader.getHarness(
      MatSelectHarness.with({selector: '[aria-label="Target grade"]'}),
    );

    expect(component.viewingOtherStudentProject).toBe(true);
    expect(await select.isDisabled()).toBe(true);
  });

  it('restores the previous target grade when the update fails', () => {
    projectServiceUpdate.mockReturnValueOnce(throwError(() => new Error('update failed')));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    component.updateTargetGrade(1);

    expect(project.targetGrade).toBe(0);
    expect(component.isUpdatingTargetGrade).toBe(false);
    expect(alertError).toHaveBeenCalledWith('Failed to update target grade', 4000);
  });

  it('uses the target-scoped task collection for completion totals', () => {
    component.ngOnInit();

    expect(component.numberOfTasks).toEqual({completed: 1, remaining: 2});
  });
});
