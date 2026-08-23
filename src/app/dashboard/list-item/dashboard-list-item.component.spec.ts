import {beforeEach, describe, expect, it} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatIconModule} from '@angular/material/icon';
import {TaskDefinition} from '../../api/models/task-definition';
import {
  DashboardListItemComponent,
  DashboardTask,
  getDueDateWarning,
} from './dashboard-list-item.component';

describe('getDueDateWarning', () => {
  const now = new Date('2026-08-23T00:00:00.000Z');
  const day = 24 * 60 * 60 * 1000;

  it.each([
    {offset: -1, state: 'overdue', label: 'Overdue', icon: 'error'},
    {
      offset: day,
      state: 'within24Hours',
      label: 'Due within 24 hours',
      icon: 'schedule',
    },
    {
      offset: day + 1,
      state: 'within3Days',
      label: 'Due within 3 days',
      icon: 'warning',
    },
    {
      offset: 3 * day,
      state: 'within3Days',
      label: 'Due within 3 days',
      icon: 'warning',
    },
    {
      offset: 3 * day + 1,
      state: 'within7Days',
      label: 'Due within 7 days',
      icon: 'event',
    },
    {
      offset: 7 * day,
      state: 'within7Days',
      label: 'Due within 7 days',
      icon: 'event',
    },
  ])('returns $state at the expected boundary', ({offset, state, label, icon}) => {
    expect(getDueDateWarning(new Date(now.getTime() + offset), true, now)).toEqual({
      state,
      label,
      icon,
    });
  });

  it('treats a task due now as due within 24 hours', () => {
    expect(getDueDateWarning(now, true, now)?.state).toBe('within24Hours');
  });

  it('does not warn more than seven days before the due date', () => {
    expect(getDueDateWarning(new Date(now.getTime() + 7 * day + 1), true, now)).toBeNull();
  });

  it('does not warn for a submitted task', () => {
    expect(getDueDateWarning(new Date(now.getTime() - day), false, now)).toBeNull();
  });

  it.each([null, undefined, new Date('invalid')])(
    'ignores a missing or invalid date',
    (dueDate) => {
      expect(getDueDateWarning(dueDate, true, now)).toBeNull();
    },
  );
});

describe('DashboardListItemComponent', () => {
  let component: DashboardListItemComponent;
  let fixture: ComponentFixture<DashboardListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardListItemComponent],
      imports: [MatIconModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardListItemComponent);
    component = fixture.componentInstance;
    component.task = {
      title: 'Accessible task',
      subtitle: '1.1P - Pass Task',
      statusLabel: 'Not Started',
      abbreviation: '1.1P',
      color: '#123456',
      comments: 0,
      status: 'not_started',
      weight: 0,
      projectId: 1,
      description: 'Description',
      taskDef: {} as TaskDefinition,
      unitCode: 'COS10001',
      dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
      showDueWarning: true,
    } satisfies DashboardTask;
    fixture.detectChanges();
  });

  it('renders warning text and an icon without replacing the task status colour', () => {
    expect(component.dueDateWarning?.state).toBe('within24Hours');

    const badge = fixture.nativeElement.querySelector('.bg-orange-100') as HTMLElement;
    const icon = badge.querySelector('mat-icon') as HTMLElement;
    const statusStrip = fixture.nativeElement.firstElementChild.firstElementChild as HTMLElement;

    expect(badge.textContent).toContain('Due within 24 hours');
    expect(icon.textContent.trim()).toBe('schedule');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(statusStrip.style.backgroundColor).toBe('rgb(18, 52, 86)');
  });
});
