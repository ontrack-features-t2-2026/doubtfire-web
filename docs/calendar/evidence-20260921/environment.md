# Calendar verification environment

This evidence uses the actual application with synthetic database records. The final local verification runtime sets `enableDemoTools: false` so the development masking interceptor cannot alter the data shown by the UI; demo mode and response mocks are not used.

| Component | Source used on 21 September 2026 |
| --- | --- |
| Web | `283b493367681d1abab23e5fe7c633ba3a57e5c2` on `11.0.x`, including merged calendar PR #260 |
| API | `d7f7a5b9c2d34ef279ac3a70bc58823def64005c` on `11.0.x` |
| Browser timezone | Australia/Melbourne |
| API runtime | Ruby 3.4.10, Rails 8.0.5.1 |
| Database / queue | Separate MariaDB 12.3 and Redis 7 containers |
| Local web / API | Ports 4301 / 3301, bound to loopback |

The web evidence branch only adds documentation and recorded evidence to the stated web base. The `enableDemoTools: false` setting is confined to a separate disposable runtime checkout; it is not a product-code change in this evidence PR. The reproducible seed was also smoke-tested against a second fresh, isolated database: both units, all five tasks, completed student profile, and initially disabled WebCal were confirmed. The original UI run reused an existing API dependency image and web dependencies; `bundle check` and the Angular development build passed. The application source came from the listed checkouts. The fresh setup below builds dependencies from the API checkout instead.

## Fixture and expected results

[seed.rb](seed.rb) creates synthetic `calendar_student` and `calendar_convenor` accounts, a completed student profile, and two active units. Set the account password locally with `CALENDAR_QA_PASSWORD`; no password, authentication token, or personal subscription URL belongs in committed evidence. The `.test` email addresses are not real recipients. Research participation and email notification preferences are disabled. No background email worker is started.

The recorded reference date is **21 September 2026**. Both projects target **High Distinction**, and CAL101 contains exactly these four dated tasks:

| Task | Grade | Status | Due date |
| --- | --- | --- | --- |
| 1P — Pass submitted for feedback | Pass | Ready for Feedback | 23 September 2026 |
| 2C — Credit completed exercise | Credit | Complete | 24 September 2026 |
| 3D — Distinction redo exercise | Distinction | Redo | 25 September 2026 |
| 4HD — High Distinction revision | High Distinction | Fix and Resubmit | 28 September 2026 |

With submitted-task exclusion **off**, **Up to this grade** gives 1, 2, 3, and 4 tasks for P, C, D, and HD. **HD + This grade and above** gives one task. With exclusion **on**, **HD + Up to this grade** gives two tasks, preserving Redo and Fix and Resubmit; **Pass + Up to this grade** gives zero and disables Download. CAL102 contains one additional Pass task due 29 September, for testing subscription unit inclusion.

WebCal starts disabled so that enabling it can be recorded through the UI. Its live feed includes both units and submitted/completed work by default. Unit-download filters do not change that feed.

## Reproduce in an isolated local environment

Use disposable sibling `doubtfire-api` and `doubtfire-web` checkouts, with application source at the bases above and this evidence directory available in the web checkout. Run these commands from their parent directory. Docker Desktop and a Node version supported by the web checkout are required. Do not attach the containers to an existing application database.

```sh
API_CHECKOUT="$PWD/doubtfire-api"
WEB_CHECKOUT="$PWD/doubtfire-web"
: "${CALENDAR_QA_PASSWORD:?Set a local fixture password of at least 12 characters first}"
export CALENDAR_QA_PASSWORD

docker build --target development -t calendar-qa-api:20260921 "$API_CHECKOUT"
docker network create calendar-qa-20260921
docker run -d --name calendar-qa-db-20260921 --network calendar-qa-20260921 \
  -e MARIADB_ALLOW_EMPTY_ROOT_PASSWORD=yes \
  -e MARIADB_DATABASE=calendar_manual_20260921 mariadb:12.3
docker run -d --name calendar-qa-redis-20260921 --network calendar-qa-20260921 redis:7.0
docker run -d --name calendar-qa-api-20260921 --network calendar-qa-20260921 \
  -p 127.0.0.1:3301:3000 \
  -v "$API_CHECKOUT:/doubtfire" \
  -v "$WEB_CHECKOUT/docs/calendar/evidence-20260921:/calendar-evidence:ro" \
  -w /doubtfire -e RAILS_ENV=development \
  -e DF_DEV_DB_ADAPTER=mysql2 -e DF_DEV_DB_DATABASE=calendar_manual_20260921 \
  -e DF_DEV_DB_HOST=calendar-qa-db-20260921 -e DF_DEV_DB_USERNAME=root \
  -e DF_DEV_DB_PASSWORD= \
  -e DF_REDIS_SIDEKIQ_URL=redis://calendar-qa-redis-20260921:6379/0 \
  -e DF_INSTITUTION_HOST=http://localhost:4301 \
  --entrypoint sleep calendar-qa-api:20260921 infinity
```

Wait until `docker exec calendar-qa-db-20260921 mariadb-admin ping` succeeds, then initialise this new database and run the fixture once:

```sh
docker exec calendar-qa-api-20260921 bundle exec rails db:schema:load
docker exec -e CALENDAR_QA_SEED=1 -e CALENDAR_QA_PASSWORD \
  calendar-qa-api-20260921 bundle exec rails runner /calendar-evidence/seed.rb
docker exec -d calendar-qa-api-20260921 \
  bundle exec rails server -b 0.0.0.0 -p 3000
```

The fixture refuses a production environment, a differently named database, absent explicit opt-in, or existing unit/non-bootstrap user data. It does not reset a database. Use a new dedicated database to rerun it. The API's standard `db:init` task supplies the normal role/status catalogue and bootstrap admin; use the synthetic student for these checks.

For a later verification session, set `CALENDAR_QA_REFERENCE_DATE` to a current ISO date and pass it with `docker exec -e CALENDAR_QA_REFERENCE_DATE`. Due dates become reference date +2/+3/+4/+7 days, with CAL102 at +8 days. Record the changed dates; they do not reproduce the historical screenshots exactly.

Start the real frontend in a separate terminal. In this disposable web checkout, change `enableDemoTools: true` to `enableDemoTools: false` in `src/environments/environment.ts` before serving. Keep this local test configuration out of commits. Merely leaving the demo toggle off is insufficient: at this base, `DemoModeStore.shouldMaskApiData` is true when demo tools are available and demo mode is off, and `DemoDataMaskInterceptor` then reduces the project list to the first project. Disabling demo tools avoids that masking. This was identified when CAL102 appeared in the real API feed but its chip was absent from the initial Web calendar UI.

The initial CAL101 screenshots and option-filter exports were recorded with the default development flag and real CAL101 task data. They establish the single-unit controls and exported bytes. Multi-unit subscription observations must use the unmasked runtime and its subsequent screenshots.

```sh
cd doubtfire-web
npm ci
mkdir -p .angular
cat > .angular/calendar-qa-proxy.json <<'JSON'
{"/api":{"target":"http://127.0.0.1:3301","secure":false}}
JSON
npx ng serve --configuration development --host 127.0.0.1 --port 4301 \
  --proxy-config .angular/calendar-qa-proxy.json
```

Check `http://127.0.0.1:4301/api/settings/public`, sign in as `calendar_student` using the locally selected password, and open the CAL101 Progress Dashboard. The seed prints unit/project IDs; in the fresh recorded database CAL101 was `/projects/1/dashboard`, and CAL102 was project 2. The student profile is already complete, so `/welcome` should not interrupt the calendar workflow.

The initial run returned HTTP 200 for public settings, projects, CAL101 project/unit details and WebCal settings, and HTTP 201 for student sign-in. Calendar-client imports and assistive-technology outcomes must be established by the accompanying actual UI evidence, not by these HTTP checks.

Stop the dedicated containers and frontend after verification. This does not require removing or altering any existing application environment.

```sh
docker stop calendar-qa-api-20260921 calendar-qa-db-20260921 calendar-qa-redis-20260921
```
