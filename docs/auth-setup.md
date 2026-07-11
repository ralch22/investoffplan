# Auth setup (better-auth)

Auth ships **dormant**: without secrets the worker boots fine, the Sign in UI
works, but no provider is enabled and magic-link emails log `skipped`.

## Secrets (wrangler secrets on BOTH configs — preview + production)

| Secret | How to get it |
|---|---|
| `BETTER_AUTH_SECRET` | `openssl rand -hex 32` — required before enabling any sign-in |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth client (Web application) |
| `GOOGLE_CLIENT_SECRET` | same OAuth client |
| `RESEND_API_KEY` | lands with **feat/email-infra** — magic-link emails are `skipped` until it's merged AND set |

Optional var: `BETTER_AUTH_URL` — overrides the base URL (defaults to
`NEXT_PUBLIC_SITE_URL` → `https://investoffplan.com`). Set it on the preview
worker so OAuth state/cookies use the workers.dev origin.

```sh
npx wrangler secret put BETTER_AUTH_SECRET            # preview (wrangler.jsonc)
npx wrangler secret put BETTER_AUTH_SECRET -c wrangler.production.jsonc
```

## Google OAuth console config

better-auth's OAuth callback endpoint is `/callback/:providerId` under the
auth base path (`/api/auth`), verified against the installed 1.6.23 source
(`dist/api/routes/callback.mjs`: `createAuthEndpoint("/callback/:id")`, and
the provider is created with `redirectURI: ${baseURL}/callback/google`).

**Authorized redirect URIs** (add every origin you enable):

- `https://investoffplan.com/api/auth/callback/google`
- `https://www.investoffplan.com/api/auth/callback/google`
- `https://investoffplan-preview.emerge-digital.workers.dev/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/google` (dev)

**Authorized JavaScript origins:** the same four origins without the path.

## Build-time flag

`NEXT_PUBLIC_AUTH_GOOGLE=1` — baked at **build** time; shows the
"Continue with Google" button in the sign-in modal. Flip it in the deploy
environment only once `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set,
otherwise the button renders but the server rejects the flow.

## Database

Tables land in `drizzle/migrations/0007_auth.sql`
(users / sessions / accounts / verifications). Timestamps are INTEGER epoch-ms
(drizzle `timestamp_ms`) because better-auth round-trips Date objects and D1
can't bind a Date to TEXT. Apply with the usual migration flow, e.g.:

```sh
npx wrangler d1 execute <DB> --remote --file drizzle/migrations/0007_auth.sql
```

## Invariants

- **ISR discipline:** never call `cookies()`, `headers()`, or
  `auth.api.getSession()` in any page/layout under `(en)`/`(ar)`. Session is
  read client-side (`useSession` from `src/lib/auth/client.ts`) or inside
  force-dynamic API routes (`getSessionFromRequest` from
  `src/lib/auth/server.ts`).
- The better-auth instance is per-request (`getAuth()`), because the D1
  binding comes from `getCloudflareContext` per request.
- Magic-link sending depends on `src/lib/email/resend.ts` +
  `src/lib/email/templates.ts` — placeholders in this branch; the real
  implementation arrives with **feat/email-infra** (merge resolves to theirs).
