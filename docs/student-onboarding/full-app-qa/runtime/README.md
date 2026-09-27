# Isolated acceptance runtime (21 September 2026)

API source: merged `11.0.x` at `d7f7a5b9c2d34ef279ac3a70bc58823def64005c`.
API container: `buckets-root-b6c1-acceptance-api`, exposed only at
`http://127.0.0.1:3011`. Redis: `closure-redis-20260921`, its own container.
Database: `bucket_acceptance_20260921`, a separate copy of the synthetic seeded
test database, never a shared database reset. No Sidekiq worker is running.
Rails uses test mail delivery and the runtime disables mail delivery; no VAPID
provider keys were introduced. The API source worktree is detached and unmodified. For faster Docker startup,
the exact git archive was extracted to `/acceptance` inside the container. A local
fixture initializer is the only overlay: `local_acceptance.rb` disables real
Turnitin, inserts synthetic feature metadata in the server process memory cache,
blocks outbound HTTP with WebMock, uses test mail and fakes Sidekiq. These stubs
are test support; this exercise does not validate provider integration.

The seed recipe is `seed-acceptance.rb`; it refuses any environment except test
and that exact disposable database. It creates a fresh student with zero history,
a convenor, a unit with eight enrolled synthetic students, two tutorials and four
task definitions. Factory assessment calls create real model data for analytics.
All named acceptance contacts use `example.invalid`. The password is freshly
randomized and written to a private local file; never commit that file.

After an isolated test environment has been prepared and migrated, copy the
initializer before starting the server. Do not install it in a real deployment:

```sh
docker cp local_acceptance.rb buckets-root-b6c1-acceptance-api:/acceptance/config/initializers/zz_local_acceptance.rb
docker cp seed-acceptance.rb buckets-root-b6c1-acceptance-api:/tmp/seed-acceptance.rb
docker exec -w /acceptance buckets-root-b6c1-acceptance-api bundle exec rails runner /tmp/seed-acceptance.rb
docker cp buckets-root-b6c1-acceptance-api:/tmp/credentials.local.json ./credentials.local.json
chmod 600 credentials.local.json
docker exec -d -w /acceptance buckets-root-b6c1-acceptance-api sh -c 'bundle exec rails server -b 0.0.0.0 -p 3000 > /tmp/acceptance-server.log 2>&1'
```

The seed refuses a duplicate run. Do not reset the database to replay a walkthrough;
use the tutorial account-menu replay for an existing learner. A fresh synthetic
account can be added in this isolated environment when a new first-login test is
necessary. The full web runs on `http://localhost:4320` with `/api` proxied to3011.
No unknown or separately running acceptance service is part of this setup.
