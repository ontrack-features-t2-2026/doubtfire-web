# Unit Hub: announcements and teaching sessions

Unit Hub gives students a single place to find announcements, HelpHubs, lectures, seminars and workshops for their active units. It is available at `/unit-hub`, through the home-page card and in the account menu. It uses the same responsive Angular application on a phone, tablet, desktop and installed OnTrack PWA.

## Normal use

The normal version reads the signed-in user's authorised `/api/unit_hub` response. A student enrolled in SIT111 does not receive SIT102 content. The unit selector only narrows the units returned by the server. A direct link such as `/unit-hub?unit=111` cannot add access to a unit. No content is fabricated when loading fails; the page shows a retry action.

The feed displays published, unexpired announcements and a bounded window of published session occurrences. The page shows the server's window end and warns when the announcement list is truncated. Content is plain text. Original-post links and meeting links open in a separate tab and must use HTTPS. A Teams meeting can still require the student's university sign-in.

## Publishing content

A staff member with the unit's `can_manage` permission sees **Manage updates**. Choose the unit, then **New announcement** or **New session**. Leave **Publish to this unit** unchecked to save a draft. Staff can edit drafts and published records, remove announcements, and cancel sessions.

For a session, enter the local start and end times and the IANA time zone, such as `Australia/Melbourne`. Weekly sessions keep the specified local time across daylight saving changes. Choose a final repeat date within six months. Create a separate weekly schedule for each weekday: a Thursday and Friday HelpHub needs two schedules. Editing or cancelling a repeating record affects the entire series. A cancelled session remains visible with its joining and calendar-copy actions removed, so students can see the cancellation.

Content can be published in OnTrack by the teaching team or imported through the companion API's optional Microsoft Teams announcement synchronisation. The university administrator must configure tenant-approved Microsoft Graph access and explicitly map each unit offering to its channel. Microsoft SSO alone does not enable this connection; students do not connect a separate personal account. It is off by default.

When a unit's connection is configured, the management page explains that posts appear after successful updates. “Configured” describes the presence of settings, not proof of working tenant permissions or a successful import. Imported announcements are labelled **From Teams**, are read-only in OnTrack, and provide **Manage in Teams** through their original-post link. Staff should change them at their source. No timetable is inferred from announcement text. Session schedules remain staff-maintained in OnTrack.

## Calendar choices

- **Add to Google Calendar** opens a draft for one occurrence. The user chooses whether to save it.
- **Download .ics** creates a copy of one occurrence for compatible calendar apps.
- **Calendar settings → Include unit HelpHubs, lectures and classes** opts the user into sessions in their existing private OnTrack calendar subscription. It is off by default. Existing unit exclusions also apply to sessions.

One-off Google drafts and imported files do not receive schedule changes. Subscribed calendars receive changes when the calendar provider refreshes the feed; refresh timing is controlled by the provider. In Google Calendar, the **From URL** subscription setup is performed in a desktop browser. Once subscribed, the calendar is available on mobile too. Session times and joining links are shared with the selected calendar provider. Keep the subscription URL private.

## Demonstration

In a local build with demo tools enabled, open **Demo controls**, turn **Demo mode on**, then open **Unit Hub**. The existing switch reloads the application; accounts without a remembered session may need to sign in again.

The Unit Hub demo is a fictional student enrolled only in SIT111. It shows two announcements, a HelpHub and a lecture. The raw fixture contains SIT102 records specifically to exercise filtering; these do not appear. The fixture includes no names, account details or copied posts from real students or staff.

Demo mode does not read the Unit Hub API and blocks staff reads and writes. The joining button is a disabled sample. Google drafts and .ics downloads are available only through an explicit user action, are labelled **DEMO**, and omit the placeholder meeting link. Demo .ics filenames and event UIDs have their own namespace. Session-subscription changes remain disabled even when Calendar is opened from the account menu. Turn demo mode off to return to the real authorised endpoint, including in development builds; the unrelated development quiet-data mask does not hide real Unit Hub records.

Production builds disable demo tools and cannot activate the Unit Hub fixtures. This release supports the installed web app, not a separately implemented native iOS or Android application.

## Frontend and API contract

| Operation                                            | Endpoint                                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Published content for the signed-in account          | `GET /api/unit_hub`                                                                                                                   |
| Staff announcements including drafts                 | `GET /api/units/:unit_id/announcements`                                                                                               |
| Create / update / remove announcement                | `POST /api/units/:unit_id/announcements`, `PUT /api/units/:unit_id/announcements/:id`, `DELETE /api/units/:unit_id/announcements/:id` |
| Staff sessions including drafts and cancelled series | `GET /api/units/:unit_id/sessions`                                                                                                    |
| Create / update / cancel session                     | `POST /api/units/:unit_id/sessions`, `PUT /api/units/:unit_id/sessions/:id`, `DELETE /api/units/:unit_id/sessions/:id`                |
| Read / change subscription preference                | `GET /api/webcal`, `PUT /api/webcal`                                                                                                  |

Writes use `{announcement: {...}}`, `{session: {...}}` and the existing `{webcal: {...}}` wrappers. The calendar preference is `include_learning_sessions` on the wire and `includeLearningSessions` in the Angular model. Feed rows have `unit_id`; `units` provide the id, code, name, `can_manage`, and `teams_sync` (`configured` or `not_configured`). Announcements include `source_provider` (`manual` or `microsoft_teams`) and `managed_externally`; no tenant, client or channel identifiers are exposed. The public session feed contains occurrence dates, whereas staff editing uses the original series dates. See `src/app/unit-hub/unit-hub.models.ts` for the field types.

The [companion API change](https://github.com/ontrack-features-t2-2026/doubtfire-api/pull/160) must be deployed and migrated before this frontend. The API is the authority for authentication, enrolment, role checks, draft visibility and unit access. The client adds defence in depth by removing rows outside the returned unit list, rejecting unsafe links, and cancelling obsolete subscriptions when the route, unit or demo mode changes. The service keeps no shared content cache. Authenticated content is not added to the service worker's data cache.

Calendar exports use explicit UTC instants. Local-time entry rejects daylight-saving gaps and repeated times, preventing silent schedule movement. ICS text is escaped and folded at UTF-8 byte boundaries to prevent content from injecting calendar properties.

## Verification

The implementation passed Angular template/type checking, the production build, deployment configuration verification and 117 targeted Vitest tests across the Unit Hub, calendar dialog, demo controls, header and role-guard suites. The 36 Unit Hub tests cover enrolled-unit filtering, no fallback data on failure, demo/live isolation, blocked demo writes, cancellation of in-flight operations, staff wrappers, route reachability, plain-text rendering, draft forms, time-zone conversion, safe links, Google encoding, ICS injection/folding separate demo event identities, configured Teams wording and read-only imported posts.

Run the relevant checks:

```sh
npm run typecheck
npm run lint
npm run test:ci -- --include='src/app/unit-hub/**/*.spec.ts' --include='src/app/common/modals/calendar-modal/calendar-modal.component.spec.ts' --include='src/app/demo/demo-controls/demo-controls.component.spec.ts' --include='src/app/common/header/header.component.spec.ts' --include='src/app/common/guards/spec/role-whitelist.guard.spec.ts'
npm run build -- --configuration production
```

On this macOS validation host, the native Angular disk-cache addon aborted during local production builds. `CI=1` disables that cache and avoids the native failure without changing application or production settings. Font inlining also needs network access to Google Fonts. Use Node 22.23.2 with `CI=1 NG_BUILD_MAX_WORKERS=2 NODE_OPTIONS="--max-old-space-size=8192 --max-semi-space-size=128"` if the same host issue occurs.
