# InvestOffPlan

Next.js 16 off-plan property portal (Property Finder / OPR.ae parity), deployed via OpenNext to Cloudflare Workers.

**Production:** https://investoffplan.com

## Getting Started

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verify (local gate)

Same contract as CI:

```bash
npm run build && npm run test:e2e
```

Playwright starts `next start` on port **3010**. Free the port and avoid concurrent e2e runs (see `AGENTS.md` / ship skill).

## CI / PR gate

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

- Triggers on `pull_request` → `main`
- Steps: `npm ci` → Playwright browser cache/install → `npm run build` → local D1 migrate/seed → `npm run test:e2e`
- Required status check name for branch protection: **`build and e2e`**

`main` branch protection requires that check before merge.

## Deploy

```bash
CLOUDFLARE_ACCOUNT_ID=4a75e91d6fca8bc58467fb80ce1b9c2e npm run deploy
```

Production deploy uses `npm run deploy:production` (authorized only when explicitly requested).
