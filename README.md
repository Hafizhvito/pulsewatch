# PulseWatch

PulseWatch is a self-hosted uptime and API monitoring application. It performs scheduled HTTP checks, records response times, and tracks outages and recovery in MySQL.

## Features

- Credentials registration, login, and logout using NextAuth and bcrypt.
- User-owned monitors with create, edit, pause/resume, and permanent deletion.
- GET, HEAD, and empty-body POST requests; exact expected status, 1 to 1440 minute intervals, and 1 to 30 second timeouts.
- Independent worker with bounded concurrency, database leases, atomic result persistence, and incident transitions.
- 24-hour, 7-day, and 30-day check-based uptime, average response latency, hourly charts, and latest 50 checks.
- Paginated incident history, responsive navigation, and useful empty, loading, and error states.
- Server-side ownership enforcement and SSRF protection, including public DNS validation and socket address pinning.

## Stack

Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, Lucide, Recharts, NextAuth 4 credentials/JWT, bcrypt, Zod, Prisma 6, and MySQL 8. npm is the package manager. No Redis or alternative database is required.

Prisma 6 is intentionally pinned to its stable major for the classic MySQL client. `deepmerge-ts` is overridden to version 8 to address GHSA-ggr8-5vv4-36mx in Prisma's development configuration tooling; generation and migration are verified with this override.

## Getting started

Prerequisites: Node.js 22.12+ (Node 24 recommended), npm, and a running MySQL 8 server.

```sh
npm install
cp .env.example .env
```

On Windows, use `Copy-Item .env.example .env` instead of `cp` if necessary. If your checkout path contains `&`, npm's dependency install shims may fail. Use `npm install --ignore-scripts`, then `npm run db:generate`. The application scripts invoke Node directly so `npm run dev` and `npm run worker` work from this project's path. Bcrypt ships platform prebuilt binaries for supported systems; unsupported platforms need a native build toolchain.

Create a database and dedicated local account as a MySQL administrator. Replace the example password before executing:

```sql
CREATE DATABASE pulsewatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pulsewatch'@'localhost' IDENTIFIED BY 'replace-with-a-strong-password';
GRANT ALL PRIVILEGES ON pulsewatch.* TO 'pulsewatch'@'localhost';
```

Configure `.env`:

```dotenv
DATABASE_URL="mysql://pulsewatch:your-url-encoded-password@localhost:3306/pulsewatch"
AUTH_SECRET="your-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secret with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Never commit `.env`. URL-encode special characters in database passwords. This local workspace uses a dedicated `pulsewatch_app` MySQL account limited to SELECT, INSERT, UPDATE, and DELETE on `pulsewatch`. Its generated password is stored only in the ignored `.env`. For future schema migrations, temporarily supply a separate administrator/migration `DATABASE_URL`; the runtime account intentionally cannot create or alter tables.

Apply the checked-in migration and generate the client:

```sh
npm run db:deploy
npm run db:generate
```

For subsequent schema development, run `npm run db:migrate -- --name describe_change`. Prisma's development migration command needs permission to create a shadow database; use an appropriate development database account or configure a separate shadow database. Production migration credentials should be separate from runtime credentials. Normal runtime only needs SELECT, INSERT, UPDATE, DELETE.

Run two terminals:

```sh
# Terminal 1: web app at http://localhost:3000
npm run dev
```

```sh
# Terminal 2: real background monitoring
npm run worker
```

Open `/register`, create your own account, then add a public URL. New monitors are due immediately; allow one worker cycle (approximately five seconds) plus request duration. The UI refreshes every 30 seconds while visible. Without the worker, account management works but checks do not run.

## Optional development demo

Normal operation does not need seeded records. Set `SEED_EMAIL` and `SEED_PASSWORD` (at least 10 characters) in `.env`, then run:

```sh
npm run db:seed
```

The seed creates one account, three clearly labeled demo monitors, 24 hours of **synthetic historical checks**, and one resolved incident. Use the credentials you supplied to log in. It refuses to overwrite an existing account and refuses to run in production. Subsequent worker results are real. Do not use demo credentials in production.

## Architecture

```text
src/app/(auth)/       Login and registration
src/app/(app)/        Protected overview, monitors, incidents
src/app/actions.ts    Consistent monitor mutation Server Actions
src/app/api/          NextAuth handlers and registration endpoint
src/components/      Layout, forms, tables, charts, shared UI
src/lib/             Auth, Prisma singleton, validation, request safety
src/services/        Monitor access, analytics, incidents, worker cycle
scripts/worker.ts    Independent worker process
prisma/              MySQL schema, migration, optional seed
tests/               Security, HTTP, scheduling, and persistence tests
```

The web process reads MySQL and handles authenticated actions. The worker selects due monitors in MySQL in batches of 50, runs at most five requests concurrently, and polls every five seconds. It claims each monitor with a token and expiration before requesting it. A short transaction locks the monitor, verifies its lease, stores the check, updates current state, and opens or resolves incidents. Edits and pause/resume invalidate in-flight leases, so stale results are discarded. Expired leases can be reclaimed after a worker crash. Graceful shutdown lets the active bounded batch complete before disconnecting.

One worker is recommended for the MVP. Lease fencing protects against accidental overlapping workers, but this is not a distributed queue or high-throughput scheduler.

## Data model and analytics

- **User** owns monitors; unique email; only the bcrypt hash is stored.
- **Monitor** holds check settings, current status, last result, and worker lease fields.
- **MonitorCheck** stores each accepted attempt, exact status code, response latency or null, error, and UTC timestamp.
- **Incident** records a DOWN transition and its eventual recovery. Consecutive DOWN checks do not duplicate an incident.

Foreign-key cascades remove related history when a monitor is deleted. Composite indexes support user listings, check time windows, and incident lookups. Analytics are aggregated in MySQL; history is never loaded without limits. Charts contain at most 25 hourly buckets, recent checks are capped at 50, and incidents paginate by 20.

Uptime is successful checks / total checks, not wall-clock availability. No checks means “No data,” not 100%. Dashboard average uptime is the unweighted average of measured monitors. Average latency includes successful and failed HTTP responses, excluding failures with no HTTP response. Latency measures DNS, connection, TLS, and time to response headers; bodies are not downloaded. Stored timestamps use UTC semantics; the UI formats them in the viewer's timezone.

Pausing stops new checks and retains historical status/incidents. An open incident stays open until an actual recovery is observed; its duration includes paused time. Editing settings retains history. Create a new monitor if historical continuity is not desired.

## Security notes

- Every protected page verifies the session, and each mutation scopes its database condition to the authenticated owner. Check and incident reads also scope by owner. JWT sessions last seven days; signing out clears the browser session.
- Passwords use bcrypt cost 12, with a 72-byte limit. Hashes are never sent to the client. Registration and login have bounded, in-memory throttles. These reset on restart and are per process; add trusted reverse-proxy rate limiting before exposing registration publicly.
- Monitor settings are validated on the server. HTTP and HTTPS are the only allowed protocols. URL credentials, fragments, private/loopback/link-local/reserved ranges, IPv4-mapped private IPv6, and obvious internal hostnames are rejected.
- DNS answers are checked at save time and every check. Mixed public/private answers are rejected. The selected public address is pinned to the actual socket lookup to prevent DNS rebinding. Redirects are **not followed**, preventing redirects into internal networks. Configure the final URL or expect the redirect's status explicitly.
- TLS certificate verification remains enabled. AbortController bounds the total check including DNS resolution. A timed-out DNS lookup may finish in the OS but cannot initiate a request.
- Add outbound firewall rules that deny private infrastructure as defense in depth. App validation is not a replacement for network isolation.
- Server Actions provide origin checking; the registration handler explicitly checks the Origin header. NextAuth handles authentication CSRF. Do not trust arbitrary forwarded headers in a reverse proxy.
- Keep deployment HTTPS-only, use a dedicated least-privilege database account, back up MySQL, and keep dependencies patched. Registration is open in this MVP; deploy on a trusted network or restrict access at your reverse proxy.

## Verification

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

Run the MySQL integration test explicitly against a **development database**:

```sh
# macOS / Linux
INTEGRATION_TESTS=1 npm test
```

```powershell
# Windows PowerShell
$env:INTEGRATION_TESTS = '1'
npm test
```

Integration tests create a uniquely named account, test concurrent lease writes and DOWN/DOWN/UP transitions, then delete only their own records. HTTP tests mock transport and DNS to deterministically verify status mismatches, redirect handling, timeouts, and mixed DNS rejection. URL tests include metadata endpoints, private ranges, integer/hex IPv4, and IPv6 variants.

## Production

```sh
npm ci
npm run db:deploy
npm run build
npm start
# In a separate supervised process:
npm run worker
```

Set `NODE_ENV=production`, `NEXTAUTH_URL` to the trusted HTTPS origin, and a strong `AUTH_SECRET`. Use a process supervisor for both web and worker. This project is built for a persistent Node server and MySQL; a request-only serverless deployment will not run the independent worker automatically.

## Screenshots

Capture the overview and monitor detail after collecting checks in your own workspace. Use a development account and redact private endpoint details before sharing screenshots.

## Current limitations and roadmap

The MVP caps accounts at 200 monitors, sends no POST body/custom headers, does not retry before declaring downtime, and has no password reset, email verification, retention cleanup, maintenance windows, or notifications. Checks/incident history grow until manually managed. Continuous uptime metrics require the worker to remain running.

Next steps: email/Discord/Slack alerts; SSL and domain expiration checks; custom headers and POST bodies; keyword checks; outage confirmation retries; public status pages; teams; Redis/BullMQ distributed scheduling; Docker and deployment automation; retention policies; maintenance windows.
