# Real database authentication check — 21 September 2026

The production web build passed nine checks against a newly created, isolated
Rails/MariaDB stack. No API responses were mocked. The browser used the normal
application sign-in and sign-out controls and loaded seven synthetic notification
records from the API.

| Check                                                          | Observed result                                                   |
| -------------------------------------------------------------- | ----------------------------------------------------------------- |
| Open `/notifications` while signed out                         | Redirected to `/sign_in`                                          |
| Incorrect password                                             | API rejected with HTTP 401                                        |
| Valid database sign-in                                         | HTTP 201; returned to `/notifications`                            |
| Authenticated notifications                                    | HTTP 200; seven database records rendered                         |
| Reload with “Stay logged in” checked                           | Session restored using refresh cookie                             |
| Sign out                                                       | HTTP 204; sign-in form displayed                                  |
| Replay the access token captured before sign-out               | Rejected with HTTP 419, the API's expired/invalid-token status    |
| Request an access token with the browser's post-logout cookies | No token returned; this API returns HTTP 201 with an empty result |
| Reopen `/notifications` after logout                           | Redirected to `/sign_in`                                          |

`results.json` records response methods, paths and status codes. It deliberately
omits request headers, response bodies, passwords and tokens. Browser errors were
empty. The screenshot data is entirely synthetic. The harness reads its password
from `QA_PASSWORD`; no account password is committed here.

## Provenance and boundary

- Web source: `28779a601d6aec4e242bf0dd0a991d868f78d832`.
- Production `ngsw.json` SHA-256: `24eec5788aaf65d3860e9778c9d914e185cf45d6453026993095c2c329f2441a`.
- API source: `d7f7a5b9c2d34ef279ac3a70bc58823def64005c`, copied from a clean
  checkout with `.git`, credentials, keys, environment files, logs, temporary data
  and local integration overrides excluded.
- API dependency/runtime image: `ontrack-unit-hub-release-preview-api:20260914`;
  Ruby 3.4.10, Rails 8.0.5.1 and Puma 7.2.1. `bundle check` passed against the copied
  API source. The source bind mount, rather than the image's bundled application,
  was executed.
- Database: MariaDB 12.3, new named volume and dedicated network; Redis 7.0.
- Fixture: the API repository's guarded `db:all_features_demo` task, with its
  required development database name `doubtfire-all-features-demo` and
  `DF_DEMO_DATA_PROFILE=all-features`. `db:all_features_demo_verify` passed.
- Browser: Google Chrome 153.0.8010.48, headless via Playwright 1.62.1, on macOS 27.0
  (26A428), 1440 × 1000 viewport and a newly created disposable profile.
- Loopback origin: `http://localhost:4332`; genuine API reverse proxy to
  `127.0.0.1:4331`. This uses development cookie behavior, not production HTTPS.
- Database authentication only. Turnitin, D2L and Overseer were disabled. VAPID
  keys were not configured and no push-delivery claim is made.

This does not establish institutional SSO, authenticated Safari behavior,
authenticated native app-window behavior, task submissions, downloads, real Web
Push delivery, production HTTPS cookie behavior or production deployment. Native
installation and service-worker update/rollback checks are documented separately.

## Reproduce

Use Docker, a compatible Ruby dependency image, Node with Playwright 1.62.1 available,
Google Chrome, and the web production build. Build the API dependency image from
the recorded source if the local image named above is unavailable. Never attach
this check to a shared or production database.

Install the browser harness dependency in a temporary directory, leaving the web
repository's package files unchanged:

```sh
qa_browser_dependencies="$(mktemp -d)"
npm install --prefix "$qa_browser_dependencies" --no-package-lock playwright@1.62.1
export NODE_PATH="$qa_browser_dependencies/node_modules"
```

The harness uses the locally installed Google Chrome application (`channel:
'chrome'`); it does not require a Playwright Chromium download.

Create uniquely named `desktop-pwa-qa-*` containers, network and volumes. Copy the
API checkout into a disposable directory, excluding credentials, `.env*`, `*.key`,
`master.key`, `.git`, `tmp`, `log`, `student_work`, `node_modules`, coverage and
`zz_local*`. Mount that copy at `/desktop-pwa-qa`, use it as the API working
directory, and mount a new volume at `/student-work`.

Create mode-600 environment files outside the repository. Generate fresh local
database and Rails secret values; do not reuse an institution's secrets. Configure:

| Setting                                                            | Local value                                     |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| `RAILS_ENV`                                                        | `development`                                   |
| `DF_AUTH_METHOD`                                                   | `database`                                      |
| `DF_DEV_DB_ADAPTER`                                                | `mysql2`                                        |
| `DF_DEV_DB_HOST`                                                   | The new MariaDB container's network name        |
| `DF_DEV_DB_DATABASE`                                               | `doubtfire-all-features-demo`                   |
| `DF_DEV_DB_USERNAME`, `DF_DEV_DB_PASSWORD`                         | New isolated database credentials               |
| `DF_SECRET_KEY_BASE`, `DF_SECRET_KEY_ATTR`, `DF_SECRET_KEY_DEVISE` | Fresh local values                              |
| `DF_REDIS_CACHE_URL`, `DF_REDIS_SIDEKIQ_URL`                       | The isolated Redis container, databases 0 and 1 |
| `DF_INSTITUTION_HOST`                                              | `http://localhost:4332`                         |
| `DF_INSTITUTION_EMAIL_DOMAIN`                                      | `example.invalid`                               |
| `DF_STUDENT_WORK_DIR`                                              | `/student-work`                                 |
| `DF_DEMO_DATA_PROFILE`                                             | `all-features`                                  |
| `DF_PPI_MINIMUM_COHORT_SIZE`                                       | `21`                                            |
| `DF_PPI_STALE_AFTER_HOURS`                                         | `24`                                            |
| `RAILS_MAX_THREADS`                                                | `1`                                             |
| `TII_ENABLED`, `D2L_ENABLED`, `OVERSEER_ENABLED`                   | `0`                                             |

Start MariaDB with a new named volume and matching `MARIADB_DATABASE`,
`MARIADB_USER` and `MARIADB_PASSWORD`; generate a separate local root password.
Start Redis on the same isolated network. Publish only the API container's port
3000 to `127.0.0.1:4331`. No database or Redis port needs publishing. Start the API
container with `sleep infinity`, then:

```sh
docker exec desktop-pwa-qa-api bundle check
docker exec -e SKIP_TEST_DATABASE=1 desktop-pwa-qa-api \
  bundle exec rake db:schema:load db:init db:all_features_demo db:all_features_demo_verify
docker exec -d desktop-pwa-qa-api bundle exec rails server -b 0.0.0.0 -p 3000
curl --fail http://127.0.0.1:4331/api/auth/method
```

`SKIP_TEST_DATABASE=1` is required because Rails otherwise also attempts to load
the test database while executing `db:schema:load` in development. The original
run loaded the development schema, encountered that missing-test-configuration
error, and then successfully ran the init, fixture and verification tasks
separately. The commands above incorporate that setup correction.

Set `QA_PASSWORD` in your environment to the authorized synthetic fixture
account's password. The fixture implementation in the API repository defines
that account; the default username for this harness is `demo_student`. Then run
from the web repository root:

```sh
WEB_DIST_DIR="$PWD/dist/browser" \
node docs/evidence/desktop-pwa-20260921/authenticated-checks/check.cjs
```

Each execution prints a unique output directory under the operating system's
temporary directory. `QA_OUTPUT_DIR` can instead name an existing parent directory
outside the repository and served build. The harness resolves symlinks and rejects
parents inside either protected directory before writing any output. It always
creates a fresh child directory, so repeated runs preserve the checked-in evidence.

Set `QA_API_PORT`, `QA_WEB_PORT` and `QA_USERNAME` if using different local values.
`--serve-only` runs the same real API proxy for manual browser checks without
launching Playwright. The automated check removes its temporary Chrome profile
and closes the proxy when finished.

The checked-in results and screenshots remain the original database execution
record. The later output-directory protection and explicit assertion that there
are no uncaught browser page errors were checked for JavaScript syntax and
repository formatting without recreating the database stack.

The application currently loads Monaco and fonts from its existing public
jsDelivr/Google Fonts URLs; the harness permits those assets and blocks other
external requests. An initial attempt that blocked those required assets stalled
application bootstrap, so it is not included as a product failure. No response
mocking is used to make those dependencies pass.

After verification, remove only this check's containers, volumes and network:

```sh
docker stop desktop-pwa-qa-api desktop-pwa-qa-redis desktop-pwa-qa-db
docker rm desktop-pwa-qa-api desktop-pwa-qa-redis desktop-pwa-qa-db
docker volume rm desktop-pwa-qa-db desktop-pwa-qa-student-work
docker network rm desktop-pwa-qa-network
```

Delete the disposable source copy and private environment files when no longer
needed. The 21 September run removed all containers, volumes and its network.
