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
      ?.closest('mat-card') as HTMLElement;
    const statusCard = cardTitles
      .find((title) => title.textContent.trim() === 'Task Statuses')
      ?.closest('mat-card') as HTMLElement;
    const burndownContent = burndownCard?.querySelector('mat-card-content') as HTMLElement;

    // jsdom loads no stylesheets and lays nothing out, so every element measures 0 high
    // and a utility class never reaches getComputedStyle. The computed pair catches a cap
    // set inline or in the component styles, and the class scan covers the utility route
    // the regression actually took, for any height cap rather than the one literal value.
    const clipping = (element: HTMLElement) => {
      const computed = getComputedStyle(element);
      return {
        maxHeight: computed.maxHeight,
        overflowY: computed.overflowY,
        clippingClasses: Array.from(element.classList).filter((name) =>
          /^max-h-|^overflow-(y-)?hidden$/.test(name),
        ),
      };
    };
    const uncapped = {maxHeight: 'none', overflowY: 'visible', clippingClasses: []};

    expect(burndownCard).toBeTruthy();
    expect(statusCard).toBeTruthy();
    expect(burndownContent).toBeTruthy();
    expect(clipping(burndownCard)).toEqual(uncapped);
    expect(clipping(statusCard)).toEqual(uncapped);
    expect(clipping(burndownContent)).toEqual(uncapped);
  });
});
