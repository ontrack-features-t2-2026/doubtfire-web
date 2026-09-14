import {beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {Observable, of, throwError} from 'rxjs';
import {UserService} from 'src/app/api/models/doubtfire-model';
import {SubmissionHistory} from 'src/app/api/models/submission-history';
import {Task} from 'src/app/api/models/task';
import {OverseerAssessmentService} from 'src/app/api/services/overseer-assessment.service';
import {OverseerStepResultService} from 'src/app/api/services/overseer-step-result.service';
import {SubmissionHistoryService} from 'src/app/api/services/submission-history.service';
import {EmptyStateComponent} from 'src/app/common/empty-state/empty-state.component';
import {AlertService} from 'src/app/common/services/alert.service';
import {TaskOverseerReportComponent} from './task-overseer-report.component';

// The files dialog imports Monaco, which reaches for browser APIs jsdom does not have as
// soon as it loads. The dialog is never opened in these tests.
vi.mock('monaco-editor', () => ({}));

function taskStub(): Task {
  return {
    unit: {staff: []},
    definition: {overseerStepsCache: {currentValues: []}},
  } as unknown as Task;
}

function historyStub(id: number): SubmissionHistory {
  return {id, timestamp: new Date(2026, 8, id, 10, 30)} as SubmissionHistory;
}

describe('TaskOverseerReportComponent', () => {
  let fixture: ComponentFixture<TaskOverseerReportComponent>;
  let nextHistories: () => Observable<SubmissionHistory[]>;
  let queryHistories: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    nextHistories = () => of([]);
    queryHistories = vi.fn(() => nextHistories());

    await TestBed.configureTestingModule({
      declarations: [TaskOverseerReportComponent],
      imports: [EmptyStateComponent],
      providers: [
        {provide: AlertService, useValue: {error: vi.fn(), message: vi.fn()}},
        {provide: SubmissionHistoryService, useValue: {queryForTask: queryHistories}},
        {provide: OverseerAssessmentService, useValue: {queryForTask: () => of([])}},
        {provide: OverseerStepResultService, useValue: {}},
        {provide: MatDialog, useValue: {}},
        {provide: UserService, useValue: {currentUser: {id: 1}}},
      ],
      // The Material panels, menus and editors are not under test here.
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  function render(loadOverseerAssessmentId?: number): void {
    fixture = TestBed.createComponent(TaskOverseerReportComponent);
    fixture.componentRef.setInput('task', taskStub());
    if (loadOverseerAssessmentId) {
      fixture.componentRef.setInput('loadOverseerAssessmentId', loadOverseerAssessmentId);
    }
    fixture.detectChanges();
  }

  function text(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ');
  }

  function buttonLabelled(label: string): HTMLButtonElement | undefined {
    return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => button.textContent.trim() === label,
    );
  }

  it('gives the tab a header with a named refresh button that reloads the history', () => {
    render();

    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Submission history');
    const refresh = fixture.nativeElement.querySelector(
      'button[aria-label="Refresh history"]',
    ) as HTMLButtonElement;
    expect(refresh).not.toBeNull();
    expect(refresh.getAttribute('type')).toBe('button');

    refresh.click();
    fixture.detectChanges();

    expect(queryHistories).toHaveBeenCalledTimes(2);
  });

  it('shows the empty state when no earlier submissions are kept', () => {
    render();

    expect(text()).toContain('No earlier submissions');
    expect(text()).toContain('Earlier submissions of this task will show here.');
    expect(fixture.nativeElement.querySelector('mat-accordion')).toBeNull();
  });

  it('lists the kept submissions newest first and counts them in the header', () => {
    nextHistories = () => of([historyStub(2), historyStub(1)]);
    render();

    const panels = fixture.nativeElement.querySelectorAll('mat-expansion-panel');
    expect(panels.length).toBe(2);
    expect(panels[0].textContent).toContain('Submission 2');
    expect(panels[0].textContent).toContain('(Most recent)');
    expect(panels[1].textContent).toContain('Submission 1');
    expect(panels[1].textContent).not.toContain('(Most recent)');
    expect(text()).toContain('2 submissions kept, newest first.');
    expect(text()).not.toContain('No earlier submissions');
  });

  it('shows an error state with Try again when the history fails to load', () => {
    nextHistories = () => throwError(() => new Error('offline'));
    render(5);

    expect(text()).toContain('The history did not load');
    expect(text()).not.toContain('No earlier submissions');

    nextHistories = () => of([historyStub(1)]);
    const tryAgain = buttonLabelled('Try again');
    expect(tryAgain).toBeDefined();
    tryAgain.click();
    fixture.detectChanges();

    expect(queryHistories).toHaveBeenCalledTimes(2);
    expect(text()).not.toContain('The history did not load');
    expect(text()).toContain('Submission 1');
    // A retry is not a refresh, so the assessment the tab was opened on stays selected.
    expect(fixture.componentInstance.loadOverseerAssessmentId).toBe(5);
  });
});
