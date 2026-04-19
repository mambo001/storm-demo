# Storm Demo

Storm alert MVP demo focused on system design under tight product scope.

Core capabilities:

- client auth
- coverage area setup
- storm visualization against coverage zones
- admin-side alert operations

The focus is not feature breadth. It is a small architecture for ingesting external storm data, normalizing it, matching it to customer-defined geography, and exposing it through an operational web app.

## Scope

In scope:

- email/password signup and login
- radius-based coverage areas
- recent hail and wind event map
- severity-based storm normalization
- admin visibility into users, storms, and alerts
- manual alert triggering for demo purposes

## Constraints

- MVP-first delivery over platform completeness
- low hosting and operational cost
- low-friction client onboarding
- dependence on public or low-cost weather sources
- web-only product surface

These constraints drive most of the design choices in the repo.

## Architecture Summary

```text
React client
  |
  v
Hono API on Cloudflare Workers
  |
  +--> auth + session management
  +--> coverage area API
  +--> storm query API
  +--> admin operations
  |
  v
Cloudflare D1
  - users
  - sessions
  - coverage_areas
  - storm_events
  - alerts

Scheduled ingestion
  |
  v
Weather provider layer
  - demo seed provider
  - NOAA SPC reports
  - NWS alerts
  |
  v
normalized storm events
```

## Design Decisions

### Single Repo, Two Apps

The repo is split into:

- `apps/web`: client and admin UI
- `apps/backend`: API, ingestion, persistence, and integration logic

This keeps the system small while making the frontend/backend contract explicit.

### Edge-First Backend

The backend runs on Cloudflare Workers with D1 as the primary datastore.

Why this fits:

- low operational overhead
- enough relational structure for users, sessions, storms, and alerts
- simple deployment model for an MVP

Tradeoff:
Good fit for a lightweight operational app, but not for heavier geospatial workloads, complex analytics, or high-volume asynchronous delivery.

### Radius-Based Coverage Model

Coverage areas are stored as:

- center latitude
- center longitude
- radius in miles
- severity threshold

This is intentionally simpler than polygons, zip-boundary ingestion, or county overlays.

Tradeoff:
Less precise, but much cheaper to build, easier for users to configure, and sufficient for an MVP where the main question is whether a storm is plausibly relevant to a client.

### Normalized Storm Event Model

Upstream providers do not share a common structure, so the backend normalizes all events into one internal `storm_events` shape.

That internal model carries:

- source and source event ID
- hail or wind event type
- occurrence time
- lat/lng
- city and region
- normalized severity
- optional hail size or wind speed

Why this matters:

- provider-specific complexity stays in the ingestion layer
- coverage matching works against one model
- the UI does not branch on upstream source semantics

### Server-Side Matching

Storm-to-coverage evaluation happens in the backend before data is returned to the client.

Why this fits:

- matching rules stay consistent across all clients
- the browser stays thin
- the same matching path can be reused by future alert automation

Tradeoff:
This increases backend responsibility, but keeps decision logic centralized.

## Data Flow

### 1. Onboarding Flow

1. Client signs up or logs in.
2. API creates a cookie-backed session.
3. Client creates one or more coverage areas.
4. Dashboard loads coverage and recent storms.

### 2. Ingestion Flow

1. Scheduled backend job requests recent storm data.
2. Provider layer fetches from demo mode or live NOAA-backed sources.
3. Events are normalized into a shared internal shape.
4. Events are deduplicated and upserted into `storm_events`.

### 3. Query Flow

1. Client requests recent storms.
2. Backend loads the user's coverage areas.
3. Backend evaluates storm-to-coverage overlap.
4. Response returns storms already annotated for presentation.

### 4. Alert Flow

1. Admin selects a target client and storm event.
2. Backend constructs an alert message.
3. Mailer sends the notification.
4. Alert is persisted as an auditable record.

## Backend Structure

The backend follows a layered structure:

- `interface`: HTTP routes, scheduled handlers, queue entrypoints
- `application`: commands and queries
- `domain`: entities, ports, matching rules
- `infra`: repositories, mailer, weather providers

The point is to isolate the volatile parts of the system:

- weather sources can change
- notification providers can change
- persistence details can change
- coverage and alert rules can evolve

The application layer stays focused on use cases rather than transport or vendor code.

## Operational Model

There are two primary execution paths:

- request/response for auth, coverage, storm queries, and admin actions
- scheduled ingestion for weather data collection

This split matters because ingestion updates the internal dataset, while the UI and admin surfaces read from persisted normalized events rather than directly from upstream APIs.

## Data Model

Primary tables:

- `users`: client and admin accounts
- `sessions`: cookie-auth session records
- `coverage_areas`: per-user service zones and thresholds
- `storm_events`: normalized weather events
- `alerts`: sent or attempted notifications

This schema is intentionally narrow. Most of the complexity is in ingestion and matching, not transactional business workflows.

## Failure Modes

Primary failure cases:

- upstream weather feeds are unavailable or delayed
- provider response formats change
- duplicate events appear across sources
- coverage boundary cases are ambiguous
- notification delivery fails independently of ingestion

Current posture:

- live provider complexity is isolated behind ingestion
- persisted storm events decouple reads from provider uptime
- alert records provide a basic operational audit trail

## Operational Considerations

- Ingestion should be idempotent because the same upstream event may be seen multiple times.
- Source normalization is the highest-risk integration point because external schemas change.
- Persisting normalized storm events reduces dependence on live provider latency.
- Alert delivery should ultimately be asynchronous so notification failures do not block other workflows.
- Coverage evaluation logic should remain reusable by both read APIs and future automated alerting.

## Key Tradeoffs

- Simplicity over geospatial precision: circles instead of polygons or zip-boundary processing.
- Internal normalization over provider leakage: source complexity is absorbed at ingestion time.
- Server-side matching over client-side computation: easier to keep rules consistent.
- Cookie sessions over token-heavy auth: better fit for a first-party web app.
- Operational admin tooling over a full back-office system: consistent with MVP scope.
- Demo mailer over full delivery infrastructure: enough to show the alert lifecycle without overbuilding.

## Current Limits

This repo intentionally stops short of a production-ready alert platform.

Notable limits:

- no fully implemented async alert queue pipeline
- no automatic storm-to-alert dispatch engine yet
- no advanced deduplication confidence model across providers
- no polygon, zip, or county-based geospatial support
- no delivery retries, throttling, or client notification preferences

## If Extended Further

Next technical steps:

1. Move alert delivery onto a real queue with retry and failure handling.
2. Add automatic alert evaluation when new storm events are ingested.
3. Upgrade coverage modeling from radius-only to polygon or imported geographic regions.
4. Improve multi-source reconciliation and event confidence scoring.
5. Add provider-backed email and optional SMS delivery.

## Local Run

```bash
bun install
bun run --filter @storm-demo/backend db:migrate:local
bun run --filter @storm-demo/backend dev
bun run --filter @storm-demo/web dev
```

Use `admin@stormdemo.local` during signup to create an admin user in local/demo mode.
