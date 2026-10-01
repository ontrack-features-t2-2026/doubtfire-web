import {describe, expect, it} from 'vitest';
import {Notification} from 'src/app/api/models/notification';
import {Project} from 'src/app/api/models/project';
import {Task} from 'src/app/api/models/task';
import {TaskStatusEnum} from 'src/app/api/models/task-status';
import {buildStudentAttention} from './student-attention';

const now = new Date('2026-10-01T10:00:00Z');

function task(id: number, status: TaskStatusEnum = 'not_started', due = '2026-10-03'): Task {
  return {
    status,
    definition: {id, abbreviation: `${id}.1P`, name: `Task ${id}`, targetGrade: 0},
    effectiveDeadlineDate: new Date(`${due}T00:00:00`),
    effectiveDeadline: new Date(`${due}T23:59:59Z`),
    localDueDate: () => new Date(`${due}T00:00:00`),
    isPastDueDate: () => new Date(`${due}T23:59:59Z`) < now,
    numNewComments: 0,
  } as unknown as Task;
}

function project(tasks: Task[], id = 12, active = true): Project {
  return {
    id,
    unit: {isActive: active, code: `UNIT${id}`},
    tasks,
    targetGrade: 0,
  } as unknown as Project;
}

function notice(event: string, read = false): Notification {
  return Object.assign(new Notification(), {
    id: 1,
    event,
    projectId: 12,
    taskDefinitionId: 1,
    readAt: read ? now : null,
  });
}

describe('student attention priorities', () => {
  it('keeps submitted, help-requested and completed work out of the overdue list', () => {
    const summary = buildStudentAttention(
      [
        project([
          task(1, 'not_started', '2026-09-20'),
          task(2, 'ready_for_feedback', '2026-09-20'),
          task(3, 'complete', '2026-09-20'),
          task(4, 'need_help', '2026-09-20'),
        ]),
      ],
      [],
      now,
    );
    expect(summary.items.map((item) => item.abbreviation)).toEqual(['1.1P']);
    expect(summary.items[0].reason).toBe('Past your due date');
    expect(summary.waiting).toBe(2);
  });

  it('prioritises unread messages and returned feedback without calling old feedback unread', () => {
    const unread = Object.assign(task(2, 'complete'), {numNewComments: 2});
    const historical = Object.assign(task(3, 'complete'), {hasFeedback: true});
    const summary = buildStudentAttention(
      [project([task(1, 'fix_and_resubmit'), unread, historical])],
      [],
      now,
    );
    expect(summary.items.map((item) => item.reason)).toEqual([
      '2 unread messages',
      'Feedback needs your action',
    ]);
    expect(summary.items[0].route).toEqual(['/projects', 12, 'dashboard', '2.1P', 'feedback']);
  });

  it('uses only unread date events for the matching project, without claiming an extension was approved', () => {
    const projects = [
      project([task(1, 'not_started', '2026-10-25')]),
      project([task(1, 'not_started', '2026-10-25')], 33),
    ];
    const summary = buildStudentAttention(projects, [notice('extension_assessed')], now);
    expect(summary.items).toHaveLength(1);
    expect(summary.items[0].reason).toBe('Your extension request has an update');
    expect(summary.items[0].action).toBe('Check outcome');
    expect(
      buildStudentAttention(projects, [notice('extension_assessed', true)], now).items,
    ).toEqual([]);
  });

  it('does not move an AoE deadline to the start of the displayed calendar date', () => {
    const extended = Object.assign(task(1, 'not_started', '2026-09-30'), {
      effectiveDeadline: new Date('2026-10-01T11:59:59Z'),
      effectiveDeadlineReason: 'approved_extension',
    });
    const item = buildStudentAttention([project([extended])], [], now).items[0];
    expect(item.reason).not.toBe('Past your due date');
    expect(item.extension).toBe('Approved extension included');
    expect(
      buildStudentAttention([project([extended])], [], new Date('2026-10-01T12:00:00Z')).items[0]
        .reason,
    ).toBe('Past your due date');
  });

  it('excludes previous units and unstarted tasks above target grade, but keeps their unread messages', () => {
    const high = Object.assign(task(2), {
      definition: {id: 2, abbreviation: '2.1HD', targetGrade: 3},
    });
    expect(
      buildStudentAttention([project([task(1)], 44, false), project([high])], [], now).items,
    ).toEqual([]);
    high.numNewComments = 1;
    expect(buildStudentAttention([project([high])], [], now).items[0].reason).toBe(
      '1 unread message',
    );
  });

  it('labels a flexible target as planned work and keeps extensions separate from new updates', () => {
    const planned = project([
      Object.assign(task(1, 'working_on_it', '2026-09-20'), {extensions: 1}),
    ]);
    planned.unit.allowFlexibleDates = true;
    const item = buildStudentAttention([planned], [], now).items[0];
    expect(item.reason).toBe('Past your planned submission date');
    expect(item.dateLabel).toBe('Planned submission');
    expect(item.extension).toBe('Includes 1 week of extension');
  });
});
