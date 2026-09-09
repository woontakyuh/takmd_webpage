# Public visit counter

The homepage footer displays visits recorded after this feature was introduced. This is a browser-tab session count, not a unique-person estimate. A random UUID lives in `sessionStorage`, so refreshing or revisiting the homepage in that tab does not increment again. A fresh tab normally starts another session; browsers may copy an opener's session storage into a duplicated tab, which remains deduplicated.

The client sends a same-origin JSON POST when its document becomes visible. GET reads never increment. If browser storage is blocked, the client uses a read-only GET. The five-second request timeout, unavailable API, disabled previews and invalid responses all leave the counter hidden.

Only the random session identifier is stored per visit. The application counter does not read or store IP addresses, user agents, referrers, URLs, account details or cookies. Session identifiers remain in D1 as idempotency keys. The total and collection start date are stored separately. Platform request logging is outside this counter's application data.

## Storage and routing

- D1 database: `takmd-visitor-counter` (`31e3554b-ae75-4867-a393-4a95367763df`), APAC.
- Binding: `VISITOR_DB` in `wrangler.toml`.
- Migration: `migrations/0001_visitor_counter.sql` creates a zero total and no historical visits. Applied remotely on 2026-09-09; the initial readback was count 0, session count 0, since 2026-09-09.
- A primary-key insert and SQL trigger increment the total atomically. A D1 transaction batches the idempotent insert with its resulting total read. Retries and concurrent requests with the same identifier do not add visits.
- `public/_routes.json` invokes Functions only for `/api/visits` and `/api/visits/`. Static pages, images, models and scripts do not enter the counter function.
- Production enables `VISITOR_COUNTER_ENABLED`; local/preview configuration defaults to disabled. Preview requests return 204 without touching D1. Local tests enable the flag against isolated local D1 storage.

The database was created within the existing account, with no paid-plan or billing changes. Deployment is a separate operation. Run migrations before deploying any version that needs a newer schema:

```sh
npm exec --yes --package=wrangler@4.129.0 -- wrangler d1 migrations apply takmd-visitor-counter --remote
```

Integrate `VisitorCount` inside `.studio-end-identity` in `StudioExperience.tsx`. It imports its own small stylesheet and requires no additional package.

## Verification

```sh
node scripts/test-visitor-counter.mjs
node scripts/test-visitor-count-ui.mjs
bunx tsc --noEmit --strict --noUncheckedIndexedAccess --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --skipLibCheck functions/api/visits.ts src/components/studio/VisitorCount.tsx
```

The API suite starts a separate Wrangler Pages runtime with a fresh local D1 database; it never uses the production database or the main site build. It covers zero initialization, duplicate and concurrent inserts, read-only crawler requests, malformed and bounded input, origin checks, unsupported requests, cache policy, static routes, disabled previews and database failures. The browser suite builds an isolated component fixture and uses real Chrome for sessions, refresh, blocked storage, unavailable/malformed responses and responsive layout. Set `VISITOR_COUNTER_EVIDENCE` to an output directory to save fixture screenshots; their counts are test data.

Cloudflare references: [D1 transactions](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Pages invocation routes](https://developers.cloudflare.com/pages/functions/routing/), [Wrangler environment configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/), [D1 free-plan limits](https://developers.cloudflare.com/d1/platform/pricing/).
