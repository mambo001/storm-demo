# storm-demo

Cloudflare-first MVP demo for storm coverage monitoring.

## Apps

- `apps/backend`: Hono + Effect + Cloudflare Worker + D1
- `apps/web`: React + Vite + Leaflet client portal

## Quick start

```bash
bun install
bun run --filter @storm-demo/backend db:migrate:local
bun run --filter @storm-demo/backend dev
bun run --filter @storm-demo/web dev
```

Use `admin@stormdemo.local` during sign-up to get the admin role by default.
