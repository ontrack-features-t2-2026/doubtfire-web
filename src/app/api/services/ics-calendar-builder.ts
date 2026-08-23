import {Task} from '../models/task';
import {buildCalendarEvent} from './calendar-event-builder';

const DEFAULT_PRODID = '-//Doubtfire//Calendar Download//EN';

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatIcsDate(civilDate: string): string {
  return civilDate.replaceAll('-', '');
}

function formatIcsTimestamp(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T` +
    `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  );
}

/**
 * Builds a VCALENDAR string, one VEVENT per task with a resolvable due date. Tasks
 * buildCalendarEvent cannot resolve a date for are skipped, not an error, matching
 * buildCalendarEvent's own null contract, not something reimplemented here. A pure function,
 * not a service and not inlined into any component, so CAL-F08's modal download can reuse it
 * directly.
 *
 * Matches webcal.rb's ICS conventions deliberately: DTSTART and DTEND are both set to the
 * same date, no exclusive-end advance, that convention belongs to CAL-F01's Google Calendar
 * URL, not to ICS. STATUS:CONFIRMED and the X-DOUBTFIRE-UNIT / X-DOUBTFIRE-TASK custom
 * properties are set per VEVENT, read from the task itself so every event is correctly
 * attributed even if the tasks span more than one unit.
 */
export function buildIcsCalendar(
  tasks: readonly Task[],
  now: Date = new Date(),
  productName: string = DEFAULT_PRODID,
): string {
  const dtstamp = formatIcsTimestamp(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${productName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const task of tasks) {
    const event = buildCalendarEvent(task);
    if (!event) {
      continue;
    }

    const date = formatIcsDate(event.date);

    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      'STATUS:CONFIRMED',
      `DTSTART;VALUE=DATE:${date}`,
      `DTEND;VALUE=DATE:${date}`,
      `DTSTAMP:${dtstamp}`,
      `X-DOUBTFIRE-UNIT:${task.unit.id}`,
      `X-DOUBTFIRE-TASK:${task.definition.id}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n') + '\r\n';
}
