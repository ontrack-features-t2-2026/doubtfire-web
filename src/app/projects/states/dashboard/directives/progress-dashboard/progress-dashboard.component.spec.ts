import {beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Project} from 'src/app/api/models/project';
import {ProjectService} from 'src/app/api/services/project.service';
import {UserService} from 'src/app/api/services/user.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {GradeService} from 'src/app/common/services/grade.service';
import {ProgressDashboardComponent} from './progress-dashboard.component';

describe('ProgressDashboardComponent', () => {
  let fixture: ComponentFixture<ProgressDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProgressDashboardComponent],
      providers: [
        {
          provide: GradeService,
          useValue: {
            grades: {0: 'Pass'},
            gradeValues: [0],
            gradeValuesFor: () => [0],
          },
        },
        {provide: ProjectService, useValue: {update: vi.fn()}},
        {provide: AlertService, useValue: {success: vi.fn(), error: vi.fn()}},
        {provide: UserService, useValue: {currentUser: {id: 25}}},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressDashboardComponent);
    fixture.componentInstance.project = {
      id: 18,
      targetGrade: 0,
      unit: {
        myRole: 'Student',
        gradeDefinitions: [{value: 0, label: 'Pass'}],
      },
      numberTasks: vi.fn().mockReturnValue(0),
      activeTasks: vi.fn().mockReturnValue([]),
      refreshBurndownChartData: vi.fn(),
    } as unknown as Project;
    fixture.detectChanges();
  });

  it('does not cap or clip the burndown and status cards', () => {
    const host = fixture.nativeElement as HTMLElement;
    const cardTitles = Array.from(host.querySelectorAll<HTMLElement>('mat-card-title'));
    const burndownCard = cardTitles
      .find((title) => title.textContent.trim() === 'Progress Burndown')
      ?.closest('mat-card');
    const statusCard = cardTitles
      .find((title) => title.textContent.trim() === 'Task Statuses')
      ?.closest('mat-card');
    const burndownContent = burndownCard?.querySelector('mat-card-content');

    expect(burndownCard?.classList.contains('max-h-[600px]')).toBe(false);
    expect(statusCard?.classList.contains('max-h-[600px]')).toBe(false);
    expect(burndownContent?.classList.contains('overflow-hidden')).toBe(false);
  });
});
