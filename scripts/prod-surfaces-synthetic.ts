/**
 * Production synthetic for the DETERMINISTIC A2UI page surfaces.
 *
 * The chat synthetic in the same workflow proves the advisor answers and that
 * its surface is composed. These three surfaces have the opposite risk profile:
 * they cost no model budget, so nothing rate-limits or bills them — but they
 * fail exactly as silently. A broken composer, a bad `NEXT_PUBLIC_A2UI_SURFACES`
 * value, or a build that dropped the flag all degrade to "the page as it was
 * before", which looks completely normal. Only a check like this notices.
 *
 * Two of the three are composed CLIENT-side (`ssr:false`, because the A2UI
 * renderer has no `getServerSnapshot`), so they cannot be asserted with curl —
 * hence a real browser. The PDP strip is RSC-composed and is checked with a
 * plain curl in the workflow, before this script runs.
 *
 *   npx tsx scripts/prod-surfaces-synthetic.ts [baseUrl]
 *
 * Exits non-zero on the first surface that fails to render.
 */
import { chromium, type Browser, type Page } from "@playwright/test";

const BASE = (process.argv[2] || "https://investoffplan.com").replace(/\/$/, "");
const TIMEOUT = 45_000;

type Check = {
  name: string;
  path: string;
  /** Resolves when the surface is proven present; throws/times out otherwise. */
  assert: (page: Page) => Promise<string>;
};

const CHECKS: Check[] = [
  {
    name: "SERP zero-result rescue",
    // A genuine dead end: no project has 9 bedrooms. NOTE the param is `beds`
    // — `maxP` is bucketed into price bands, so a silly price does NOT produce
    // an empty result set and would make this check pass for the wrong reason.
    path: "/projects?beds=9",
    async assert(page) {
      const note = page.getByText(/No exact matches/i).first();
      await note.waitFor({ timeout: TIMEOUT });
      // The rescue must also actually SHOW something — a note with no cards
      // would be a worse dead end than the one it replaced.
      const cards = page.locator('a[href^="/projects/"]');
      await cards.first().waitFor({ timeout: TIMEOUT });
      return `${(await note.textContent())?.trim()} (+${await cards.count()} card links)`;
    },
  },
  {
    name: "Investor-match next step",
    // Six positional answer chars, one per quiz step (see CODEC in
    // src/lib/investor-match.ts): 2-5M · appreciation · urban · mid ·
    // post-handover · 2-bed. Deep-linking skips six clicks of UI drift.
    path: "/tools/investor-match?a=3aump2",
    async assert(page) {
      const monthly = page.locator("[data-testid='advisor-mortgage-monthly']").first();
      await monthly.waitFor({ timeout: TIMEOUT });
      const text = (await monthly.textContent())?.trim() || "";
      // An empty or zero panel means the composer got no price — the surface
      // rendered but says nothing, which is its own kind of broken.
      if (!/\d/.test(text)) throw new Error(`mortgage panel has no figure: "${text}"`);
      return `monthly ${text}`;
    },
  },
];

async function run(): Promise<number> {
  let browser: Browser | undefined;
  let failures = 0;
  try {
    browser = await chromium.launch();
    for (const check of CHECKS) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
      const url = `${BASE}${check.path}`;
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: TIMEOUT });
        const detail = await check.assert(page);
        console.log(`OK   ${check.name} — ${detail}`);
      } catch (error) {
        failures++;
        const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
        console.error(`::error::SURFACE MISSING — ${check.name} did not render at ${url}. ${message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser?.close();
  }
  return failures;
}

// No top-level await — tsx compiles scripts/ as CJS in this repo.
run()
  .then((failed) => {
    if (failed) {
      console.error(`::error::${failed} deterministic surface(s) failed on ${BASE}`);
      process.exit(1);
    }
    console.log(`All deterministic surfaces rendered on ${BASE}`);
  })
  .catch((error) => {
    console.error(`::error::synthetic crashed: ${error}`);
    process.exit(1);
  });
