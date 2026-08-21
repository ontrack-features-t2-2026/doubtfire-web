import {describe, expect, it} from 'vitest';
import {Task} from '../models/task';
import {TaskDefinition} from '../models/task-definition';
import {Unit} from '../models/unit';
import {buildCalendarEvent} from './calendar-event-builder';

function buildTask(overrides: {
  unitCode?: string;
  abbreviation?: string;
  name?: string;
  taskDefId?: number;
  dueDate?: Date;
}): Task {
  const unit = new Unit();
  unit.code = overrides.unitCode ?? 'COS10001';
  unit.allowFlexibleDates = false;

  const definition = new TaskDefinition(unit);
  definition.id = overrides.taskDefId ?? 42;
  definition.abbreviation = overrides.abbreviation ?? '1.1P';
  definition.name = overrides.name ?? 'Hello World';
  definition.targetDate = undefined;

  const task = new Task(unit);
  task.definition = definition;
  task.dueDate = overrides.dueDate;

  return task;
}

describe('buildCalendarEvent', () => {
  it('builds the title, uid and date for a normal task', () => {
    const dueDate = new Date(2026, 8, 15);
    const task = buildTask({
      unitCode: 'COS10001',
      abbreviation: '1.1P',
      name: 'Hello World',
      taskDefId: 42,
      dueDate,
    });

    const event = buildCalendarEvent(task);

    expect(event).not.toBeNull();
    expect(event.title).toBe('COS10001: 1.1P: Hello World');
    expect(event.uid).toBe('E-42');
    expect(event.date).toBe(dueDate);
  });

  it('returns null when the task has no resolvable due date', () => {
    const task = buildTask({dueDate: undefined});

    const event = buildCalendarEvent(task);

    expect(event).toBeNull();
  });

  it('returns the title raw and unescaped, leaving escaping to the consumer', () => {
    const dueDate = new Date(2026, 8, 15);
    const task = buildTask({
      unitCode: 'COS10001',
      abbreviation: '1.1P',
      name: "Report, Part 1; Draft's Notes",
      dueDate,
    });

    const event = buildCalendarEvent(task);

    // Raw comma, semicolon and apostrophe survive untouched. Neither URL-encoding nor
    // ICS text-escaping (backslash before , ; and newlines) has been applied here. Both
    // are the consumer's responsibility at the point each is serialized.
    expect(event.title).toBe("COS10001: 1.1P: Report, Part 1; Draft's Notes");
  });
});
