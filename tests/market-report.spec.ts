import { test, expect } from "./fixtures";

// Public, INDEXABLE flagship market report (distinct from the noindex per-community
// /reports/market/[slug] exports). Asserts it is crawlable and DLD-driven.
//
// We assert on the raw SSR HTML response body (what a crawler receives) rather
// than the live DOM. This page is fully server-rendered, and on localhost the
// global footer's Cloudflare Turnstile widget errors (site key bound to
// investoffplan.com → 110200) and destabilizes the live page in the runner —
// irrelevant to indexability, which is exactly what this test verifies. The
// response body is deterministic and immune to that post-load instability.
test.describe("Public UAE off-plan market report", () => {
  test("/market-report is indexable and renders DLD-driven data", async ({ page }) => {
    const response = await page.goto("/market-report", { waitUntil: "commit" });
    expect(response?.status()).toBe(200);

    const html = await response!.text();
    const lower = html.toLowerCase();

    // Indexable: no `noindex` robots directive in the served HTML.
    const robotsMatch = html.match(/<meta[^>]+name="robots"[^>]*>/i);
    if (robotsMatch) expect(robotsMatch[0].toLowerCase()).not.toContain("noindex");

    // Market-overview + community-yield sections are server-rendered.
    expect(lower).toContain("market at a glance");
    expect(lower).toContain("gross rental yield");

    // Real DLD-driven figures: a percentage (yield/trend) is present.
    expect(html).toMatch(/\d+(\.\d+)?%/);

    // Structured data present, including this report's own Article/Dataset graph.
    expect(lower).toContain("application/ld+json");
    expect(html.includes("Dataset") || html.includes("Market Report")).toBe(true);
  });

  // #281 — AR per-community report back-link must stay under /ar/communities.
  test("/ar/reports/market/[slug] back-link is /ar/communities/{slug}", async ({
    page,
  }) => {
    const response = await page.goto("/ar/reports/market/business-bay", {
      waitUntil: "commit",
    });
    expect(response?.status()).toBe(200);
    const html = await response!.text();
    expect(html).toContain('href="/ar/communities/business-bay"');
    expect(html).not.toMatch(/href="\/communities\/business-bay"/);
  });
});
