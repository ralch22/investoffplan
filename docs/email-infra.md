# Email infrastructure (Resend)

Transactional email sending for investoffplan, built on [Resend](https://resend.com).
Mirrors the GHL degrade-gracefully pattern: when `RESEND_API_KEY` is not set,
`sendEmail()` returns `{ ok: false, status: "skipped" }` (and logs a `skipped`
row to `email_log`) — it never throws and never blocks a request.

## Pieces

| Piece | Path |
| --- | --- |
| Send lib | `src/lib/email/resend.ts` (`sendEmail`, `isEmailConfigured`) |
| Templates | `src/lib/email/templates.ts` (`magicLinkEmail`, `testEmail`; EN + AR) |
| Audit log | `email_log` table — migration `drizzle/migrations/0006_email_log.sql`, schema `emailLog` in `src/lib/db/schema.ts` |
| Health | `GET /api/health` → `email.configured` (boolean, no secrets) |

## Setting RESEND_API_KEY

The secret must be set on **both** workers (the two wrangler configs are two
separate Workers — a secret set on one does not exist on the other):

```sh
# Preview worker (investoffplan-preview)
npx wrangler secret put RESEND_API_KEY --config wrangler.jsonc

# Production worker (investoffplan)
npx wrangler secret put RESEND_API_KEY --config wrangler.production.jsonc
```

Per the secure-keys handshake (`~/.claude` skill): Claude runs the interactive
`wrangler secret put` prompt and **Rami pastes the key value into the prompt
himself** — the key must never appear in chat, in a file, or in shell history.
Get the key from the Resend dashboard (API Keys → Create; `sending` permission
scoped to the `investoffplan.com` domain is enough).

For local dev, put `RESEND_API_KEY=...` in `.dev.vars` (gitignored). Without
it, sends log as `skipped` — everything else works.

## EMAIL_FROM

Default sender: `invest off-plan <noreply@investoffplan.com>`.
Override with an `EMAIL_FROM` env var (plain var, not a secret — set it in
`wrangler.jsonc` / `wrangler.production.jsonc` `vars` if needed). The from
domain must be a verified domain in Resend.

## Migration

```sh
# Local
npx wrangler d1 migrations apply DB --local --config wrangler.jsonc
# Preview / production (remote)
npx wrangler d1 migrations apply DB --remote --config wrangler.jsonc
npx wrangler d1 migrations apply DB --remote --config wrangler.production.jsonc
```

Note: migrations `0007` and `0008` are reserved by parallel branches — the next
new migration here is `0009`.

## Deliverability notes

- **Domain auth first**: add the SPF + DKIM DNS records Resend generates for
  `investoffplan.com` (Resend dashboard → Domains) before any real sends.
  Also set a DMARC record (`p=none` to start, tighten to `quarantine` later —
  same playbook as the emergedigital domains).
- **Warm-up**: a fresh domain/IP has no reputation. Start with low-volume
  transactional mail (magic links, test sends) for 2–4 weeks before any
  higher-volume alert sends; ramp gradually.
- **List-Unsubscribe (later, for bulk)**: transactional magic-link/welcome
  mail doesn't need it, but saved-search alert emails are bulk-ish — before
  scaling those, add `List-Unsubscribe` + `List-Unsubscribe-Post` headers
  (Resend supports custom headers) and a working one-click unsubscribe.
  Gmail/Yahoo require this above ~5k/day to the same provider.
- **Monitoring**: every send attempt lands in `email_log`
  (`status` = `sent` / `skipped` / `failed`, with the Resend id or error), so
  failures are queryable:
  `SELECT kind, status, COUNT(*) FROM email_log GROUP BY 1, 2;`
