# investoffplan.com production cutover — joint runbook (2026-07-08)

State discovered: zone lives in the **Arlo Properties** CF account
(`fc2d14b9…`, zone id `90105cc263e0556b20bb09e0e5be0b42`), registrar =
**Namecheap** (external — NS moves freely). Apex/www currently CNAME to
`wp.wpenginepowered.com` (the legacy WP site, unproxied), plus Google
Workspace records that MUST survive the move: MX `smtp.google.com`, DKIM
`google._domainkey`, and the `google-site-verification` TXT.
Workers/D1/R2 all live in the **Emerge** account (`4a75e91d…`).

Everything below the line is scripted; Rami steps are marked 👤.

## Sequence
1. 👤 **Emerge API token** (one-time, 2 min): CF dashboard → Emerge account →
   My Profile → API Tokens → Create Token with `Zone.Zone:Edit`,
   `Zone.DNS:Edit`, `Account.Account Settings:Read`, and
   `Account.Turnstile:Edit` scoped to the Emerge account. Paste to Claude.
2. Claude: create `investoffplan.com` zone in Emerge (free plan) via API →
   returns the two new nameservers.
3. Claude: copy the Google Workspace records (MX, DKIM TXT, site-verification
   TXT) from the Arlo zone into the new Emerge zone via API. Do NOT copy the
   WP Engine CNAMEs.
4. 👤 **Turnstile secret**: CF dashboard → Turnstile → the IOP widget → copy
   the secret key → `printf "<key>" | npx wrangler secret put
   TURNSTILE_SECRET_KEY -c wrangler.production.jsonc`. Also add
   `investoffplan.com` + `www.investoffplan.com` to the widget's domain
   allowlist (or Claude does it with the token from step 1).
5. Claude: uncomment the routes block in `wrangler.production.jsonc`, run
   `npm run deploy:production` (builds with
   `NEXT_PUBLIC_SITE_URL=https://investoffplan.com`).
6. 👤 **Namecheap**: Domain List → investoffplan.com → Nameservers → Custom →
   paste the two Emerge nameservers from step 2.
7. Wait for NS propagation (minutes–hours; old Arlo NS keeps serving the WP
   site meanwhile, so there is no dead window). Verify:
   `curl -sI https://investoffplan.com` → 200 from the worker;
   `dig MX investoffplan.com` → smtp.google.com; sitemap/robots flip to the
   production host automatically (`NEXT_PUBLIC_SITE_URL` guard).
8. Claude: smoke pass (home, /projects, PDP, /ar, /api/catalog, lead form),
   then GSC: verify property (TXT already copied) + submit
   https://investoffplan.com/sitemap.xml.

## Consequences to be aware of
- The legacy WordPress site goes dark at step 7 (that is the point — the
  Astro… er, Next.js app replaces it 1:1 with the same brand).
- Email (Google Workspace) is unaffected if step 3 happened before step 6.
- Rotate the Arlo API token + R2 keys after cutover (they were shared in chat).

## GA4 (same session)
1. 👤 analytics.google.com → Create property "invest off-plan" (AED,
   Asia/Dubai) → Web stream for https://investoffplan.com → copy `G-XXXX`.
2. Claude: set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in both wrangler configs'
   `vars`, redeploy both workers, verify Realtime hit, then mark
   `contact_submit`, `brochure_open`, `compare_add` as key events (Admin →
   Events).
