import { test, expect } from "./fixtures";

// /sold-prices — DLD transactions surface (SEO Wave 1).
// High-volume communities render a substantial table + Dataset JSON-LD and are
// indexable; below-gate communities render but carry noindex.

test.describe("sold prices hub", () => {
  test("hub lists covered communities with ItemList JSON-LD", async ({ page }) => {
    await page.goto("/sold-prices");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/sold prices/i);
    const cards = page.locator('a[href^="/sold-prices/"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(10);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((s) => s.includes('"ItemList"'))).toBe(true);
  });
});

test.describe("sold prices community page", () => {
  test("high-volume community renders table + Dataset schema, indexable", async ({ page }) => {
    // JVC is the highest-volume Dubai community in the DLD set — stable pick.
    const res = await page.goto("/sold-prices/jumeirah-village-circle");
    expect(res?.status()).toBe(200);
    const html = await res!.text();
    expect(html).toContain('"@type":"Dataset"');
    expect(html).toContain("Dubai Land Department");
    expect(html).not.toMatch(/name="robots"[^>]*noindex/i);

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/sold prices/i);
    const rows = page.locator("tbody tr");
    expect(await rows.count()).toBeGreaterThanOrEqual(8);
  });

  test("methodology + source attribution present", async ({ page }) => {
    await page.goto("/sold-prices/jumeirah-village-circle");
    await expect(page.getByText(/dubai land department/i).first()).toBeVisible();
    await expect(page.getByText(/anonymized/i).first()).toBeVisible();
  });

  test("links back into the community guide", async ({ page }) => {
    await page.goto("/sold-prices/jumeirah-village-circle");
    const back = page.locator('a[href="/communities/jumeirah-village-circle"]').first();
    await expect(back).toBeVisible();
  });

  test("AR mirror renders RTL with Arabic labels", async ({ page }) => {
    await page.goto("/ar/sold-prices/jumeirah-village-circle");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/أسعار البيع/);
  });
});

test.describe("community page cross-link", () => {
  test("community guide links to its sold-prices page", async ({ page }) => {
    await page.goto("/communities/jumeirah-village-circle");
    const link = page.locator('a[href="/sold-prices/jumeirah-village-circle"]').first();
    await expect(link).toBeVisible();
  });
});

test.describe("market pulse band", () => {
  test("renders on the homepage with DLD-derived stats", async ({ page }) => {
    await page.goto("/");
    const band = page.getByRole("region", { name: /market pulse/i });
    await expect(band).toBeVisible();
  });

  test("renders on the market report", async ({ page }) => {
    await page.goto("/market-report");
    const band = page.getByRole("region", { name: /market pulse/i });
    await expect(band).toBeVisible();
  });
});

test.describe("llms.txt", () => {
  test("serves the canonical fact set", async ({ page }) => {
    const res = await page.request.get("/llms.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("invest off-plan");
    expect(body).toContain("Dubai Land Department");
    expect(body).toContain("/sold-prices");
  });
});

test.describe("sitemap group 7", () => {
  test("sitemap index includes the sold-prices group", async ({ page }) => {
    const res = await page.request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain("/sitemap/6.xml");
    const child = await page.request.get("/sitemap/6.xml");
    expect(child.status()).toBe(200);
    expect(await child.text()).toContain("/sold-prices/");
  });
});
