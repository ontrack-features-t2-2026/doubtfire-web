import {Task} from '../models/task';

export interface CalendarEvent {
  /**
   * Raw, unescaped event title: "{unit.code}: {taskDef.abbreviation}: {taskDef.name}".
   * Matches webcal.rb's event_name_for_task_definition bare-name case (no Start:/End: prefix).
   * Deliberately not escaped for any target format. URL encoding and ICS text escaping are
   * incompatible schemes over the same string, and the icalendar gem already escapes at
   * serialization time on the ICS side. Each consumer (CAL-F01, CAL-F02) must escape this for
   * its own protocol at the point of use.
   */
  title: string;

  /**
   * Single all-day date, not a start/end pair. webcal.rb sets DTEND == DTSTART for its ICS
   * output, while Google Calendar's TEMPLATE URL needs an exclusive end date one day later.
   * Those two conventions are incompatible, so there is no one (start, end) pair that would be
   * correct for both consumers. Consumers derive their own end value from this single date.
   * Do not "fix" this into a date range.
   */
  date: Date;

  /**
   * ICS-consumer-only. Mirrors webcal.rb's "E-{taskDefinitionId}" scheme, keyed on the task
   * definition, not the task instance, so every student on the same task shares this UID. This
   * is WebCal's existing behaviour, matched here deliberately, not a bug to fix. Google
   * Calendar's TEMPLATE URL has no identifier parameter, so CAL-F01 cannot use this field.
   */
  uid: string;
}

/**
 * Builds a calendar event description for a single student's task, matching WebCal's event
 * format (see webcal.rb) so events built here look identical to the existing WebCal feed.
 * Returns null when the task has no resolvable due date, since a calendar event with no date
 * is meaningless. Callers use the null case to hide calendar-related UI, not as an error.
 */
export function buildCalendarEvent(task: Task): CalendarEvent | null {
  const date = task.localDueDate();
  if (!date) {
    return null;
  }

  return {
    title: `${task.unit.code}: ${task.definition.abbreviation}: ${task.definition.name}`,
    date,
    uid: `E-${task.definition.id}`,
  };
}
