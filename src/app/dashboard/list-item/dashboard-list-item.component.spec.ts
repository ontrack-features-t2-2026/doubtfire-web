import {beforeEach, describe, expect, it} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {TaskDefinition} from '../../api/models/task-definition';
import {DashboardListItemComponent, DashboardTask} from './dashboard-list-item.component';

describe('DashboardListItemComponent', () => {
  let fixture: ComponentFixture<DashboardListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardListItemComponent],
      imports: [MatButtonModule, MatIconModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardListItemComponent);
    fixture.componentInstance.task = {
      title: 'Security Review',
      subtitle: '1.1P - Pass Task',
      statusLabel: 'Resubmit',
      abbreviation: '1.1P',
      color: '#123456',
      comments: 0,
      status: 'fix_and_resubmit',
      targetGrade: 0,
      targetGradeLabel: 'Pass',
      weight: 0,
      projectId: 1,
      description: 'Review the security findings.',
      taskDef: {} as TaskDefinition,
      unitCode: 'SIT764',
      dueDate: new Date(2026, 7, 12),
    } satisfies DashboardTask;
    fixture.detectChanges();
  });

  it('shows a textual status without requiring the colour indicator', () => {
    expect(fixture.nativeElement.textContent).toContain('Status: Resubmit');
  });

  it('uses a labelled native button with expanded state for task details', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Expand Security Review details');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-label')).toBe('Collapse Security Review details');
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });
});
