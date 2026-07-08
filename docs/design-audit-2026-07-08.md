# Design-Quality Audit — investoffplan.com — 2026-07-08

## 1. Summary + method

**Scope.** Production (https://investoffplan.com) audited against the Figma exports in `design/figma/` and the "evolve beyond Figma" bar: brand tokens (red `#e60000`, PT Serif italic display, dark surfaces, existing card language) are sacred; the static designs are the floor. Findings must exceed them with motion, richer states, and hierarchy — not redecorate them.

**Method.** Playwright (chromium) full-page/segmented captures at 1440w and 390w of `/`, `/projects`, `/projects/105-residences`, `/developers/emaar-properties`, `/areas/jumeirah-village-circle`, `/guides`, `/news`, `/collections/waterfront`, `/tools/mortgage`, `/contact`, `/ar` (screenshots in the session scratchpad `audit/` dir). Section-by-section comparison against `Homepage.png` and `Search Results Page - Grid.png` crops; source read for every component cited; targeted DOM/asset probes (curl on `/cdn/...` assets, bounding-box inspection of the 390w header); presentation-layer spot-check of propertyfinder.ae/new-projects and opr.ae.

**Verdict in one line.** The token system, dark heroes, and SERP card anatomy are genuinely strong — but production is shipping three visible-daily defects (black heroes from a 404 image, "from FROM" price copy, broken mobile header), the signature red-italic brand gesture from the Figma hero has been dropped, and framer-motion is installed but used in exactly 2 of ~80 components with no reduced-motion gate.

---

## 2. Figma fidelity gaps (live under-delivers the design)

### F1. Hero title loses the red-italic signature — the known suspect, confirmed
- **Template:** Homepage hero (also `PageHero` and AR home).
- **Evidence:** `design/figma/Homepage.png` hero reads **"UAE's *Premier* Off-Plan *Investment* Platform."** with *Premier* and *Investment* in red (`#e60000`-family) PT Serif italic and a red terminal period. Live renders "UAE's Premier Off-Plan Platform" — no "Investment", no red, and the `<em>` carries the self-cancelling classes `not-italic italic text-white/90`, so "Premier" renders as plain white.
- **File:** `src/app/(en)/page.tsx:100–104`; same gap in `src/components/page-hero.tsx:44–48` (`<em className="italic">` with no `text-brand`), and `src/app/(ar)/ar/page.tsx` renders `dict.home.heroTitle` as a plain string with no accent word at all.
- **Fix:** Restore the Figma copy and treatment: `UAE's <em className="italic text-brand-light">Premier</em> Off-Plan <em className="italic text-brand-light">Investment</em> Platform<span className="text-brand">.</span>` (use `--brand-light #ff3333` on the dark overlay for contrast, verify ≥4.5:1). Extend `PageHero` with an `accentWord` treatment (`text-brand` on the italic word) so "Search *Results*", "Latest *News*", "Investment *Guides*" all pick up the red italic + red period from `Search Results Page - Grid.png`.

### F2. Payment-plan ribbon card language flattened to a generic pill
- **Template:** SERP unit cards + showcase cards.
- **Evidence:** Figma cards (`Search Results Page - Grid.png`, Featured section of `Homepage.png`) use a **notched red ribbon** breaking out of the image's left edge ("20/40/40 Payment Plan"), a serif-italic *"Handover in Q4 2029"* line above the title, a developer wordmark watermark top-right of the photo, and an italic property-type label beside the price. Live uses interchangeable rounded pills (`rounded-full bg-brand px-3 py-1`) and buries handover in the small attribution suffix.
- **File:** `src/components/project-card.tsx:101–103` (pill), `:114–119` (handover as suffix); `src/components/showcase-project-card.tsx:64–66`.
- **Fix:** Build one `PaymentRibbon` component: red bar, small corner-notch via `clip-path` (or a rotated pseudo-element), positioned `-start-2 top-4` overlapping the photo edge; move handover to a `font-display italic` line above the H3. This is the single highest-leverage "own the card" move — it is already designed.

### F3. Homepage drops four designed sections / degrades three others
- **Template:** Homepage vs `Homepage.png`.
- **Evidence & files (all `src/app/(en)/page.tsx`):**
  - **Latest News section — absent.** Figma has a "The Latest News." band (1 photo feature + 3 stacked items). Live homepage never links news content.
  - **"Have Questions?" inline lead form — absent.** Figma has a dark contact-form band before the consultation CTA; live has only the "Book a Consultation" button (`:304–318`), i.e. one fewer capture surface on the highest-traffic page.
  - **FAQ: 3 questions vs 8 in Figma** (`:44–57`).
  - **Key Locations: numbered text cards vs Figma photo tiles** (`:185–209` — the `area-card-accent` gradient is a nice touch but the design is image-led; area photos exist for area pages).
  - **Property Types: 4 flat icon cards vs 6 photo tiles with the red circular-arrow affordance** (`:226–244`).
  - **Investment Highlights: 3 plain white stat cards vs image-backed cards** ("10% ROI" over a property photo) (`:264–274`).
  - **Featured Projects section is light (`bg-surface-alt`) where Figma stages it as a dark band** (`home-featured-grid.tsx:46`) — the dark-surface rhythm break is a brand token, and live homepage has no dark section between hero and newsletter.
- **Fix:** Add the news band (content exists at `/news`); reuse `ContactCtaForm` for the pre-footer form; render 8 FAQs; convert Key Locations and Investment Highlights to photo-backed tiles with the existing `card-photo-overlay`; flip Featured Projects onto `bg-surface-darker` with the existing `dark` prop of `ShowcaseProjectCard` (it's already implemented and unused on the homepage).

### F4. Newsletter + footer imagery never shipped
- **Evidence:** Figma newsletter panel shows a printed-brochure mockup; live is a flat red-to-dark gradient with the code comment *"Background image placeholder with brand overlay"* (`src/components/newsletter-section.tsx:10–11`). Figma footer has an aerial-photo panel and a red contact block plus a floating WhatsApp bubble; live left footer panel is an empty gradient with the comment *"Left: dark aerial photo panel"* (`src/components/site-footer.tsx:45–46`), and there is no floating WhatsApp FAB anywhere.
- **Fix:** Drop in a real image (any `public`/R2 aerial asset) under the existing overlay gradients; add a `WhatsAppFab` (bottom-end, `glass-pill-dark`, breathing dot, `iop-btn-press`) — it is drawn in the Figma footer and is the #1 conversion element on both competitors.

### F5. Figma's structured hero search vs live free-text
- **Evidence:** Figma hero: Property Type / Price Range / Beds / Developers pill dropdowns + Location input + red arrow Search. Live: single text input + 5 popular chips (`src/components/hero-search.tsx`).
- **Verdict:** The chips are a legitimate evolution (faster to first result) — keep them — but add at least the Property Type + Max price selects inline on `md:` up, pre-wired to `/projects?type=&maxP=`; the structured row is what PF/OPR users expect and it deep-links into the already-good SERP filter state.

---

## 3. Taste-lens findings (evolve beyond)

### 3.0 Production defects blocking any taste conversation

**T0a — P1 — Black heroes site-wide from one 404 asset, no image fallback.**
`/cdn/projects/105-residences/gallery/000.webp` returns **404** (verified via curl; sibling projects return 200). That exact asset is `featured[0].imageUrl` → it is the hero background of the homepage, and the `imageUrl` passed to `PageHero` on guides/news/contact/mortgage/collections — so every dark hero renders flat black with a broken-image glyph in the top-left corner (visible in all 1440w captures), and the `/projects/105-residences` PDP gallery is a black void. There is no `onError` fallback: `next/image` fill just fails silently.
Files: `src/app/(en)/page.tsx:85–94`, `src/components/page-hero.tsx:29–38`, `src/components/project-gallery.tsx`. Fix: (1) restore/re-migrate the 105-residences R2 assets; (2) add a client `HeroImage` wrapper with `onError` → hide image and keep `bg-surface-dark` + a subtle brand gradient; (3) exclude projects with dead hero assets from `getFeaturedProjects`.

**T0b — P1 — "from FROM AED 1,267,583" double prefix on every grid card.**
`formatFromPrice()` already returns `FROM ${…}` (`src/lib/format.ts:59–61`) and `project-card.tsx:130–133` renders `from {formatFromPrice(…)}`. Every dark SERP card shows "from FROM AED …" (visible in `projects-1440w-s1` capture). One-line fix; instant credibility win.

**T0c — P1 — Mobile header overflows; hamburger menu is off-screen, logo invisible.**
At 390w, measured header `scrollWidth` = **434px** vs 390 viewport; the menu button's box is `x:400–434` (unreachable), the brand logo measures **0×0**, and the whole document scrolls horizontally 44px. Root cause: `PrimaryButton` bakes `inline-flex` into its class list (`src/components/ui/primary-button.tsx:26`) and `site-header.tsx:145–150` tries to hide it with `className="hidden … sm:inline-flex"` — `cn` is plain concat (no tailwind-merge), so `inline-flex` wins and "Area Properties" renders on mobile. Fix: wrap the button in `<div className="hidden sm:block">`, or adopt `tailwind-merge` in `cn`; also give `BrandLogo` explicit width/height so the SVG can't collapse to 0×0.

### 3.1 Homepage

- **P1 — Featured grid composition collapses to two full-width slabs.** Both featured cards get `featured` → `lg:col-span-2` inside `lg:grid-cols-2`, so they stack as two identical full-width rows (`src/components/home-featured-grid.tsx:59–63`, confirmed in `home-1440w-s1`). Figma's composition is 1 hero + 2 support. Fix: `featured` only for index 0, indexes 1–2 as standard cards beside/below — an instant bento rhythm break.
- **P2 — Stats don't move.** "Live catalog intelligence" numbers (`page.tsx:149–167`) are static text with `tabular-nums` already applied. Add a `useInView` count-up (framer-motion `animate` on a motion value, 0.8s, once) — the classic "the catalog is alive" signal, transform/opacity-free and LCP-safe.
- **P2 — Uniform section cadence.** Every band is `py-14`/`py-16`, same `max-w-[1200px]`, light→light→light until the footer. With F3's dark Featured band + photo-tile Key Locations you get the light/dark/light rhythm the Figma establishes. Also vary one section to full-bleed (Key Locations) to break the container monotony.
- **P3 — Copy risk, one line:** the advantage matrix H2 publicly names competitors ("Better than Property Finder + opr.ae *combined.*", `src/components/advantage-matrix.tsx`). Great internally; on a public page it invites comparison-shopping and legal letters. Consider "Everything the portals show you — plus what they don't."

### 3.2 SERP + cards

- **P1 — Motion inconsistency + no reduced-motion gate for JS animation.** Grid cards animate with `initial/animate` + `delay: index * 0.05` (`project-card.tsx:73–76`) so on page change all 20 cards animate simultaneously even when off-screen, while `showcase-project-card.tsx:34–38` correctly uses `whileInView` + `viewport={{ once: true }}`. Neither uses spring physics (`ease: "easeOut"` tween), and **no component uses `useReducedMotion`/`MotionConfig`** (grep: zero hits) — the CSS kill-switch in `globals.css:82–94` does not affect framer-motion's rAF-driven inline styles. Fix: shared `cardReveal` variant (whileInView, `type: "spring", stiffness: 260, damping: 24`, stagger via parent `staggerChildren`), wrapped app-wide in `<MotionConfig reducedMotion="user">` in `page-shell.tsx`.
- **P1 — Press/focus coverage is ~50%.** `iop-btn-press` has 49 uses, but these visible-daily surfaces have neither press nor `focus-ring`: card "View Details"/contact pills (`project-card.tsx:137, 154, 253`), showcase card CTAs (`showcase-project-card.tsx:96–113`), collection chips (`collection-chips.tsx:29–34`), Grid/List/Map segmented toggle and "Show project view" (`projects-page.tsx:355–398`), `dataguru-tool-card.tsx:12`. Fix: sweep-add `iop-btn-press focus-ring`; the utility already exists, this is pure coverage.
- **P2 — Skeleton doesn't match the layout it replaces.** `ProjectsSkeleton` shows 4 light-surface cards in `lg:grid-cols-2` (`projects-skeleton.tsx:10–24`), but the real grid renders **dark** (`bg-surface-dark`) cards in a `flex-wrap` 50%-width layout with a full-width featured first card. The swap flashes light→dark. Fix: mirror the real anatomy — first skeleton full-width, dark `#1a1b1a` base with a darker shimmer variant (`--surface-darker` → `#222` gradient), badge/CTA-row placeholder shapes.
- **P2 — Near-duplicate card runs.** Unit-level SERP shows the same project 2–4× with identical photos and titles (1WOOD Residence ×3 in the capture), differing only in the beds line. Fix: in unit view, add a large bed-count corner tag on the photo (e.g. "2BR" glass pill, top-left) and cycle to a *different* gallery index per sibling unit (`galleryImages[index % n]`) so runs read as a family, not a rendering bug.
- **P3 — Dormant compare bar is permanent noise.** The gray "Compare — Select up to 3 units" strip always renders above results (`compare-bar.tsx:30–39` + `projects-page.tsx:415–423`). Hide until the first selection, then spring in from bottom (`initial={{y: 24, opacity: 0}}`) in its sticky position; the affordance already exists on every card checkbox.
- **P3 — Empty state is decent, could guide.** "No units match your filters" + clear-filters button exists (`projects-page.tsx:439–454`) — good. Add 3 popular-collection chips (Under AED 2M / Waterfront / Studio) so the dead-end becomes a fork.

### 3.3 PDP (`/projects/[slug]`)

- **P1 — Dead right rail + enrichment whitespace craters.** From "About" downward the page is a single ~65ch column with the right half of a 1200px container empty for thousands of pixels, and the enrichment prose renders 80–120px voids between headings and bullets (empty paragraphs from markdown — visible in `pdp-1440w-s1`). Files: `src/components/project-about.tsx`, `src/app/(en)/projects/[slug]/page.tsx:333–351`. Fix: two-column `lg:grid-cols-[1fr_360px]` with a **sticky summary card** (price, payment plan, handover, brochure + WhatsApp CTAs — the OPR pattern below); strip empty `<p>`/`<br>` nodes in the enrichment renderer.
- **P2 — Serif-italic title treatment is a win — extend it.** The auto-italic last word + red-less period on the PDP H1 (`[slug]/page.tsx:184–197`) matches the brand; give the period `text-brand` per Figma and reuse the same helper as `PageHero` (F1) instead of two inline IIFE copies.
- **P2 — Key-fact glass pills could breathe.** Hero stat pills (`:201–215`) are static `bg-white/15`. On a construction-timeline product, a breathing status dot (scale 1→1.15 opacity pulse, 2.4s, transform-only, gated by reduced-motion) on the "Handover Q4 2027" pill is cheap perpetual micro-motion that carries meaning.
- **P3 — Desktop has no persistent CTA.** Mobile gets the excellent fixed bottom bar (`project-detail-ctas.tsx:92–117`); desktop CTAs scroll away after the hero. Add brochure + WhatsApp buttons into the existing sticky `ProjectDetailNav` row once it pins.

### 3.4 Content templates (guides / news / areas / developers)

- **P2 — Guides hub: six clones with the same red checkmark.** All 6 cards render an identical red check circle (`guides-1440w-s0`), the classic generic-3-card-row anti-pattern ×2. File: `src/app/(en)/guides/page.tsx`. Fix: numbered `font-display` italic eyebrows (01–06), reading time, one featured guide spanning 2 columns; the unused `bg-guide-hero` token (`globals.css:132–138`) was designed for this page's hero — use it or delete it.
- **P2 — News: editorial dark cards, zero imagery.** Feature card + grid are flat dark panels (`news-1440w-s0`); the Figma News band is photo-led. If article images don't exist, generate per-post abstract brand covers (red/dark gradient + oversized serif numeral) rather than flat black — never a bare panel.
- **P3 — Area page right rail idles.** "Living in JVC" prose sits in a full-width column (`area-1440w-s0`); the handover-pipeline line ("2025 (1) · 2027 (1) · 2028 (3)", `areas/[slug]/page.tsx`) is begging to be a tiny inline bar/spark chart in a sticky side card.
- **P3 — Developer contact panel's WhatsApp green.** `bg-[#25D366]` (`developer-contact-panel.tsx:47`) is the one hardcoded non-token color in the audited set. WhatsApp-green is a recognized convention — acceptable — but consider the outlined-brand WhatsApp pill used on PDP for chrome consistency.

### 3.5 Tools

- **P2 — Mortgage results teleport.** Recalcs swap numbers instantly (`mortgage-calculator.tsx:88–95`). Animate the monthly-payment figure with a framer-motion value spring (number morph, tabular-nums prevents jitter) and add range sliders (styled `accent-brand`) alongside the number inputs — the red result card is already the best-designed module on the site; make it feel live.
- **P3 — Tool cards are interchangeable white rectangles.** `dataguru-tool-card.tsx` differs only by text. A 60×24 inline SVG motif per tool (mini amortization curve, price-map pin cluster) in `--brand-muted` would make the toolkit hub scannable.

### 3.6 Chrome + i18n

- **P2 — AR homepage has no search.** `/ar` hero renders headline + 2 buttons only — no `HeroSearch`, no popular chips (`src/app/(ar)/ar/page.tsx`), while the EN homepage leads with search. RTL rendering itself is clean (logical properties used throughout — good).
- **P3 — AR nav wraps awkwardly.** "أدوات البيانات" and "اتصل بنا" break onto two lines in the nav at 1440 (also "Data toolkit" wraps in EN). `whitespace-nowrap` on nav links; tighten labels.
- **P3 — Footer social links point at bare `facebook.com` / `instagram.com` / `linkedin.com`** (`site-footer.tsx:110–118`) — placeholder URLs in production chrome.

---

## 4. Competitor steal-list (presentation layer only)

| # | Pattern | Who | Maps to |
|---|---------|-----|---------|
| 1 | **Named-advisor trust block** — advisor name + title + direct phone inside a "Request A Free Call" card, repeated on listing pages | opr.ae (Yulia Berezhnaya block) | New `AdvisorCard` in the PDP sticky rail (3.3) and `developer-contact-panel.tsx`. Real face + name beats "Speak with our team" for off-plan ticket sizes. |
| 2 | **Floating WhatsApp FAB** — persistent bottom-corner bubble | opr.ae + our own Figma footer (`Search Results Page - Grid.png`, bottom-right red bubble) | Global `WhatsAppFab` in `page-shell.tsx`; `glass-pill-dark`, `iop-btn-press`, hide when PDP mobile CTA bar is visible to avoid stacking. |
| 3 | **Delivery-date-first card hierarchy** — PF cards lead with "Delivery: Q3 2030" above unit count, then "Launch price:" as a labeled row | propertyfinder.ae/new-projects | `project-card.tsx`: promote handover from attribution-suffix to the serif-italic line above the title (same move as F2) and label the price row ("Launch price") instead of the bare "from". |
| 4 | **Priced property-type collection tiles** — "Apartments — FROM AED 240,000" per category card | opr.ae homepage | Homepage Property Types section (`page.tsx:226–244`): the catalog already computes min price per type; adding it turns four decorative cards into entry points. |

Also noted: PF's "Sort by: Featured" + More Filters pattern is already matched or bettered by our filter card — no action.

---

## 5. Ranked top-10 (impact ÷ effort — GH issue titles)

1. **Fix 404 hero asset + add image error fallback — every dark hero on prod renders black** (T0a; `page-hero.tsx`, `page.tsx`, 105-residences R2 assets).
2. **Fix "from FROM AED …" double price prefix on all grid cards** (T0b; `project-card.tsx:131` / `format.ts:59`).
3. **Fix 390w header overflow — hamburger off-screen, logo 0×0, horizontal scroll** (T0c; `site-header.tsx:145` + `cn` tailwind-merge).
4. **Restore red-italic "Premier/Investment" hero treatment + red accent word in PageHero** (F1; `page.tsx:100`, `page-hero.tsx:44`).
5. **Sweep-add `iop-btn-press` + `focus-ring` to card CTAs, chips, and segmented toggles** (3.2; ~6 files, class-only change).
6. **Unify card motion: `whileInView` + spring + stagger via shared variant, wrap app in `MotionConfig reducedMotion="user"`** (3.2; `project-card.tsx`, `showcase-project-card.tsx`, `page-shell.tsx`).
7. **Build the notched red payment-plan ribbon + serif-italic handover line on cards** (F2; new `PaymentRibbon`, used in 3 card components).
8. **PDP two-column layout with sticky summary/advisor card + strip enrichment whitespace** (3.3 + steal #1; `[slug]/page.tsx`, `project-about.tsx`).
9. **Homepage composition pass: 1+2 featured bento, dark Featured band, photo-backed Locations/Highlights, count-up stats** (F3 + 3.1; `home-featured-grid.tsx`, `page.tsx`).
10. **Global WhatsApp FAB + real newsletter/footer imagery (both drawn in Figma, never shipped)** (F4 + steal #2; `page-shell.tsx`, `newsletter-section.tsx`, `site-footer.tsx`).

Deliberately below the cut: dark skeleton parity (do with #6), guides-hub redesign, mortgage number-morph, AR hero search (worth its own i18n issue), competitor-naming copy risk (flag to Rami, not a design ticket).
