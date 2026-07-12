import { test, expect } from "./fixtures";
import { waitForCatalog } from "./helpers";

/**
 * Regression suite for issue #197:
 * 1. AR primary nav + SERP browse loop stays under /ar
 * 2. /compare cold path (server getCatalogApi promise-cache) does not 500/OOM
 * 3. SERP Map view still respects active filters (Wave F)
 *
 * Prefer SSR response checks where Turnstile/live-DOM is flaky; use single-worker
 * Playwright (playwright.config workers: 1).
 */

test.describe("AR nav loop stays in /ar", () => {
  test("desktop primary nav keeps locale across hubs", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    const mainNav = page.getByRole("navigation", { name: "القائمة الرئيسية" });

    await mainNav.getByRole("link", { name: "المشاريع" }).click();
    await expect(page).toHaveURL(/\/ar\/projects/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    await mainNav.getByRole("link", { name: "المطوّرون" }).click();
    await expect(page).toHaveURL(/\/ar\/developers/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    await mainNav.getByRole("link", { name: "قارن", exact: true }).click();
    await expect(page).toHaveURL(/\/ar\/compare\/?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("mobile bottom tabs keep locale across Explore → Compare → Saved", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ar");

    const tabs = page.getByRole("navigation", { name: "التنقل الأساسي" });

    await tabs.getByRole("link", { name: "استكشف" }).click();
    await expect(page).toHaveURL(/\/ar\/projects/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    await tabs.getByRole("link", { name: "قارن" }).click();
    await expect(page).toHaveURL(/\/ar\/compare\/?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    await tabs.getByRole("link", { name: "المحفوظات" }).click();
    await expect(page).toHaveURL(/\/ar\/favorites/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("SERP card → PDP browse loop stays under /ar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/ar/projects");
    await waitForCatalog(page, { viewDetailsLabel: "عرض التفاصيل" });

    await Promise.all([
      page.waitForURL(/\/ar\/projects\/[^/?#]+/, { timeout: 20_000 }),
      page.getByRole("link", { name: "عرض التفاصيل" }).first().click(),
    ]);

    await expect(page).toHaveURL(/\/ar\/projects\/[^/?#]+/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    // PDP chrome stays in AR layout (dict.common.breadcrumbAria).
    await expect(
      page.getByRole("navigation", { name: "مسار التنقل" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("language switcher preserves path both ways", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/projects");
    await page.getByRole("link", { name: "العربية" }).click();
    await expect(page).toHaveURL(/\/ar\/projects\/?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/projects\/?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("Compare cold path (promise cache)", () => {
  // #221 — hub must stay force-static + single-pass data (no CF 1102 shell).
  test("/compare hub returns 200 with hub chrome (no error shell)", async ({
    page,
  }) => {
    // Cold-ish navigation: the hub fans out to getCatalogApi() several times
    // in Promise.all — the loadingPromise singleton prevents thundering-herd OOM
    // on CF Workers. Locally we assert the page still renders cleanly.
    const response = await page.goto("/compare", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);

    const html = await response!.text();
    expect(html.toLowerCase()).not.toContain('id="__next_error__"');
    expect(html).toContain('lang="en"');

    await expect(
      page.getByRole("heading", { level: 1, name: /Compare/i }),
    ).toBeVisible({ timeout: 20_000 });
    // Hub lists community pairs (data-driven; at least one -vs- link).
    await expect(
      page.locator('a[href*="/compare/"][href*="-vs-"]').first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("AR /ar/compare hub returns 200 in-locale", async ({ page }) => {
    const response = await page.goto("/ar/compare", { waitUntil: "commit" });
    expect(response?.status()).toBe(200);
    const html = await response!.text();
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    expect(html.toLowerCase()).not.toContain('id="__next_error__"');
    // #248 — unit-comparator band must not hardcode EN chrome on AR hub.
    expect(html).not.toContain("Compare units");
    expect(html).not.toContain("Open the unit comparator");
    expect(html).toContain("قارن الوحدات");
    expect(html).toContain("افتح مقارنة الوحدات");
    // #299 — projects/developers sections + yield/DLD note (residual after #248).
    expect(html).not.toContain("Compare projects");
    expect(html).not.toContain("Compare developers");
    expect(html).not.toContain("Gross yield");
    expect(html).not.toContain("All figures are anonymized");
    expect(html).not.toContain("Head-to-head on price");
    expect(html).not.toContain("Portfolio size, entry prices");
    expect(html).toContain("قارن المشاريع");
    expect(html).toContain("قارن المطوّرين");
  });

  // Issue #205 — bare pair-index paths must not 404 (live audit D).
  test("/compare-projects and /compare-developers indexes return 200", async ({
    page,
  }) => {
    for (const path of ["/compare-projects", "/compare-developers"] as const) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), path).toBe(200);
      const html = await response!.text();
      expect(html.toLowerCase()).not.toContain('id="__next_error__"');
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 15_000,
      });
      // Pair cards link into the SEO pair segment.
      const pairHref =
        path === "/compare-projects"
          ? 'a[href*="/compare-projects/"][href*="-vs-"]'
          : 'a[href*="/compare-developers/"][href*="-vs-"]';
      await expect(page.locator(pairHref).first()).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  test("AR compare project/developer indexes stay in locale", async ({
    page,
  }) => {
    for (const path of [
      "/ar/compare-projects",
      "/ar/compare-developers",
    ] as const) {
      const response = await page.goto(path, { waitUntil: "commit" });
      expect(response?.status(), path).toBe(200);
      const html = await response!.text();
      expect(html).toContain('lang="ar"');
      expect(html).toContain('dir="rtl"');
      expect(html.toLowerCase()).not.toContain('id="__next_error__"');
    }
  });

  test("concurrent catalog-heavy routes all succeed (promise coalesce)", async ({
    request,
  }) => {
    // Fire several getCatalogApi consumers at once — mirrors cold isolate fan-out.
    const paths = [
      "/compare",
      "/compare",
      "/projects",
      "/developers",
      "/map",
      "/ar/compare",
    ];
    const results = await Promise.all(paths.map((p) => request.get(p)));
    for (const [i, res] of results.entries()) {
      expect(res.status(), `GET ${paths[i]}`).toBe(200);
    }
  });

  test("legacy /compare?units= deep-link redirects to units tool", async ({
    page,
  }) => {
    // Client-side CompareUnitsLegacyRedirect (hub stays static/ISR — no searchParams).
    await page.goto("/compare?units=unit-a,unit-b");
    await expect(page).toHaveURL(/\/compare\/units\?units=/, { timeout: 15_000 });
    // Empty/unknown ids still render the compare shell (heading), not a crash.
    await expect(
      page.getByRole("heading", { name: /Compare Projects/i }),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("AR /ar/compare?units= stays in AR units tool", async ({ page }) => {
    // CompareUnitsLegacyRedirect preserves /ar prefix on the units tool path.
    await page.goto("/ar/compare?units=unit-a,unit-b");
    await expect(page).toHaveURL(/\/ar\/compare\/units\?units=/, {
      timeout: 15_000,
    });
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("client catalog-lite loads once on /projects (singleton promise)", async ({
    page,
  }) => {
    const catalogUrls: string[] = [];
    page.on("request", (req) => {
      const u = req.url();
      if (
        u.includes("/data/catalog-lite.json") ||
        u.includes("/api/catalog/lite")
      ) {
        catalogUrls.push(u);
      }
    });

    await page.goto("/projects");
    await waitForCatalog(page);

    // Prefetch + useCatalog share fetchCatalogApi()'s catalogPromise singleton.
    // Allow a short idle window for deferred CatalogPrefetch.
    await page.waitForTimeout(1500);
    expect(
      catalogUrls.length,
      `expected ≤1 catalog-lite fetch, got ${catalogUrls.length}: ${catalogUrls.join(", ")}`,
    ).toBeLessThanOrEqual(1);
  });
});

test.describe("Map filter (Wave F)", () => {
  test("map view pin count drops when city filter is applied", async ({
    page,
  }) => {
    // Hardens the existing projects.spec coverage: pin count is driven by
    // mapVisibleProjectIds from the filtered unit set.
    await page.goto("/projects");
    await waitForCatalog(page);

    await page.getByRole("button", { name: "Map", exact: true }).click();

    const coordCount = page.getByText(/projects with coordinates/i);
    await expect(coordCount).toBeVisible({ timeout: 15_000 });
    await expect(coordCount).toHaveText(/[1-9][\d,]*\s+projects with coordinates/i);

    const readCount = async () => {
      const text = (await coordCount.textContent()) ?? "";
      const m = text.match(/([\d,]+)\s+projects with coordinates/i);
      return m ? Number(m[1].replace(/,/g, "")) : NaN;
    };

    const before = await readCount();
    expect(before).toBeGreaterThan(0);

    await page.getByRole("button", { name: /Abu Dhabi/i }).click();

    await expect.poll(readCount, { timeout: 15_000 }).toBeLessThan(before);
    expect(await readCount()).toBeGreaterThan(0);
  });
});
