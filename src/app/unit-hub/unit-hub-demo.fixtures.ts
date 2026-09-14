import {UnitHubFeed} from './unit-hub.models';

/** Synthetic content only. SIT102 deliberately exists in the raw fixture as an isolation test. */
export function unitHubDemo(now = new Date()): UnitHubFeed {
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(17, 0, 0, 0);
  const lecture = new Date(start.getTime() + 86400000);
  const shared = {
    description: 'Bring your questions and join the teaching team for a guided session.',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    published: true,
    cancelled: false,
    recurrence: 'none' as const,
    join_url: 'https://example.invalid/sample-meeting',
    location: 'Online in Teams',
  };
  return {
    units: [{id: 111, code: 'SIT111', name: 'Computer Systems', can_manage: false}],
    announcements: [
      {
        id: 1,
        unit_id: 111,
        title: 'Your week in Computer Systems',
        body: 'Review the hardware concepts, bring questions to HelpHub and check your upcoming classes here. This is a fictional example for the OnTrack demonstration.',
        published_at: now.toISOString(),
        pinned: true,
      },
      {
        id: 2,
        unit_id: 111,
        title: 'Extra help before your next task',
        body: 'The teaching team has added an online HelpHub. Open the session card for its time and meeting options.',
        published_at: new Date(now.getTime() - 86400000).toISOString(),
        pinned: false,
      },
      {
        id: 3,
        unit_id: 102,
        title: 'SIT102 announcement must stay hidden',
        body: 'Other unit sample',
        published_at: now.toISOString(),
        pinned: false,
      },
    ],
    sessions: [
      {
        ...shared,
        id: 1,
        unit_id: 111,
        title: 'Computer Systems HelpHub',
        kind: 'helphub',
        start_at: start.toISOString(),
        end_at: new Date(start.getTime() + 3600000).toISOString(),
      },
      {
        ...shared,
        id: 2,
        unit_id: 111,
        title: 'Hardware review lecture',
        kind: 'lecture',
        start_at: lecture.toISOString(),
        end_at: new Date(lecture.getTime() + 3600000).toISOString(),
      },
      {
        ...shared,
        id: 3,
        unit_id: 102,
        title: 'SIT102 HelpHub must stay hidden',
        kind: 'helphub',
        start_at: start.toISOString(),
        end_at: new Date(start.getTime() + 3600000).toISOString(),
      },
    ],
  };
}
