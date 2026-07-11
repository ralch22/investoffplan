# Trust content needed (Rami checklist)

The trust pack (`feat/trust-pack`) shipped three content-gated components. Each
one renders **nothing** in production until real content is added to
`src/content/trust.ts` — this is the fabrication-cannot-ship gate. No code
changes are needed to turn them on: fill the array/object, rebuild, done.

The only trust surface live today is the **data-sources strip** on /about,
because its numbers (projects, unit options, DLD transactions) are computed
from real data at build time.

## 1. Testimonials — unlocks `<TestimonialsSection/>` on /about

For each quote, collect:

- [ ] Verbatim quote text (no editing beyond trimming)
- [ ] Client name (as they consent to be shown)
- [ ] Context, factual only — e.g. "Bought a 1BR in JVC, 2025" (optional)
- [ ] Source: `"google"` (public Google review) or `"direct"`
- [ ] **Written consent** to publish name + quote (email or WhatsApp thread
      saved somewhere retrievable)

Add to `TESTIMONIALS` in `src/content/trust.ts`:

```ts
{ quote: "…", name: "…", context: "…", source: "direct" }
```

## 2. License numbers — unlocks `<LicenseBadge/>` on /about + site footer

- [ ] Real RERA ORN (broker office registration number)
- [ ] Real DED trade license number
- [ ] Optional label (registered entity name) if it should prefix the badge

Fill `LICENSE` in `src/content/trust.ts`:

```ts
export const LICENSE = { orn: "12345", ded: "678910", label: "…" };
```

The badge renders only when **both** ORN and DED are present.

## 3. Team — unlocks the future team section (component TBD)

For each real team member:

- [ ] Name and role
- [ ] Short factual bio (no invented credentials)
- [ ] Photo (consented), placed under `public/images/team/` — set `photoUrl`
- [ ] Consent to be listed on the site

Add to `TEAM` in `src/content/trust.ts`.

## Hard rule

Never add placeholder, illustrative, or AI-written entries to
`src/content/trust.ts`. An empty section is invisible; a fake one is a
liability.
