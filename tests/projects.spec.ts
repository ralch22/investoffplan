import { test, expect } from "./fixtures";
import { waitForCatalog, waitForCatalogHydration } from "./helpers";

test.describe("InvestOffPlan projects page", () => {
  test("loads listing with project-count heading", async ({ page }) => {
    await page.goto("/projects");
    // Default SERP view is project (not unit) — heading uses headingProjects.
    await expect(
      page.getByRole("heading", { name: /New off-plan projects in UAE/i }),
    ).toBeVisible();
    await waitForCatalog(page);
  });

  test("filters by city chip", async ({ page }) => {
    await page.goto("/projects");
    await waitForCatalog(page);
    await page.getByRole("button", { name: /Abu Dhabi/i }).click();
    await expect(page.getByText(/results/)).toBeVisible();
  });

  test("opens mobile filter sheet", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/projects");
    await waitForCatalog(page);
    await page.getByRole("button", { name: /Filters & search/i }).click();
    await expect(page.getByTestId("mobile-filter-sheet")).toBeVisible();
    await page.getByRole("button", { name: "Show results" }).click();
    await expect(page.getByTestId("mobile-filter-sheet")).toHaveCount(0);
  });

  test("compare selection: anonymous caps at two, third prompts sign-in, compare opens", async ({
    page,
  }) => {
    await page.goto("/projects");
    await waitForCatalog(page);
    const boxes = page.getByRole("checkbox", { name: /^Compare / });
    await boxes.nth(0).check();
    await boxes.nth(1).check();
    await expect(page.getByTestId("compare-count")).toHaveText("2");
    // Freemium gate: the 3rd slot is account-only for anonymous visitors —
    // attempting it opens the sign-in modal instead of adding the unit.
    await boxes.nth(2).click();
    await expect(page.getByRole("dialog").filter({ hasText: /sign in/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("compare-count")).toHaveText("2");
    const compareLink = page.getByTestId("compare-link");
    await expect(compareLink).toBeVisible();
    await expect(compareLink).toHaveAttribute("href", /\/compare\?units=/);
    await Promise.all([
      page.waitForURL(/\/compare\?units=/, { timeout: 20_000 }),
      compareLink.click(),
    ]);
    await expect(
      page.getByRole("heading", { name: /Compare Projects/i }),
    ).toBeVisible();
  });

  test("map view respects active filters", async ({ page }) => {
    // Desktop filter bar is `hidden md:block` — need md+ for Beds/Type/Price selects.
    // Leaflet pin re-renders of the full catalog are expensive; give the test headroom.
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/projects");
    await waitForCatalog(page);

    // Switch the SERP layout to the Map view.
    await page.getByRole("button", { name: "Map", exact: true }).click();

    const coordCount = page.getByTestId("map-coord-count");
    await expect(coordCount).toBeVisible({ timeout: 20_000 });
    await expect(coordCount).toHaveText(/[1-9][\d,]*\s+projects with coordinates/i);

    const readCount = async () => {
      const text = (await coordCount.textContent()) ?? "";
      const m = text.match(/([\d,]+)\s+projects with coordinates/i);
      return m ? Number(m[1].replace(/,/g, "")) : NaN;
    };

    const baseline = await readCount();
    expect(baseline).toBeGreaterThan(0);

    // City: Dubai holds the bulk of stock, so Abu Dhabi must yield a strictly
    // smaller map set than "All UAE" (no full-catalog reset after this).
    await page.getByRole("button", { name: /Abu Dhabi/i }).click();
    await expect.poll(readCount, { timeout: 20_000 }).toBeLessThan(baseline);
    const afterCity = await readCount();
    expect(afterCity).toBeGreaterThan(0);

    // Beds / type / price — same shared filtered unit set as grid/list, no reload.
    // Use combobox role (desktop ProjectFilters) rather than getByLabel for stability.
    const beds = page.getByRole("combobox", { name: "Beds", exact: true });
    const propertyType = page.getByRole("combobox", { name: "Property type", exact: true });
    const maxPrice = page.getByRole("combobox", { name: "Max price (AED)", exact: true });

    await beds.selectOption("2");
    // Beds is a subset of the city set — pin count must not grow.
    await expect.poll(readCount, { timeout: 20_000 }).toBeLessThanOrEqual(afterCity);
    const afterBeds = await readCount();
    expect(afterBeds).toBeGreaterThan(0);
    expect(afterBeds).toBeLessThan(baseline);

    await propertyType.selectOption("villa");
    await expect.poll(readCount, { timeout: 20_000 }).toBeLessThanOrEqual(afterBeds);
    const afterType = await readCount();
    // Combined city+beds+type must still be a real reduction vs unfiltered baseline.
    expect(afterType).toBeLessThan(baseline);

    await maxPrice.selectOption("1500000");
    await expect.poll(readCount, { timeout: 20_000 }).toBeLessThanOrEqual(afterType);
    expect(await readCount()).toBeLessThan(baseline);
  });

  test("toggles between project and unit view", async ({ page }) => {
    await page.goto("/projects");
    await waitForCatalog(page);
    // Default is project view; button label is "Show unit view".
    await page.getByRole("button", { name: /Show unit view/i }).click();
    await expect(
      page.getByRole("heading", { name: /Total unit options in UAE/i }),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Show project view/i }).click();
    await expect(
      page.getByRole("heading", { name: /New off-plan projects in UAE/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("InvestOffPlan site routes", () => {
  test("homepage shows featured launches", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText(/Premier/i);
    await expect(
      page.getByRole("heading", { name: /Latest launches/i }),
    ).toBeVisible();
  });

  test("developers index loads", async ({ page }) => {
    await page.goto("/developers");
    await expect(
      page.getByRole("heading", { level: 1, name: /Developers/i }),
    ).toBeVisible();
  });

  test("guide detail loads with breadcrumbs", async ({ page }) => {
    await page.goto("/guides/why-invest-off-plan-dubai", { timeout: 45000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /Why Invest in Off-Plan Dubai/i }),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Guides");
  });

  test("map page loads", async ({ page }) => {
    await page.goto("/map");
    await expect(
      page.getByRole("heading", { name: /Project map/i }),
    ).toBeVisible();
  });

  test("project detail loads", async ({ page }) => {
    await page.goto("/projects/palm-central-private-residences-phase-2");
    await expect(
      page.getByRole("heading", { level: 1, name: /Palm Central/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Unit types" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText(
      "Projects",
    );
    await expect(page.getByRole("navigation", { name: "Project sections" })).toBeVisible();
  });

  test("clear all filters restores results", async ({ page }) => {
    await page.goto("/projects?q=zzzznonexistent999");
    await waitForCatalogHydration(page);
    // 15s: the empty state renders only after the client catalog finishes
    // loading; under full-suite load the default 5s flakes as the catalog grows.
    await expect(page.getByText("No units match your filters")).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Clear all filters" }).click();
    await waitForCatalog(page);
    await expect(
      page.getByRole("heading", { name: /New off-plan projects in UAE/i }),
    ).toBeVisible();
  });
});
test.describe("Advanced SERP filters", () => {
  test("API filters by developer + handover year", async ({ request }) => {
    const res = await request.get(
      "/api/catalog/projects?developer=emaar-properties&handoverBy=2028&pageSize=50",
    );
    if (res.status() === 503) {
      // D1-backed catalog API not available in e2e (plain `next start` has no D1 tables).
      // Other UI-based filter tests cover behavior; the API path is exercised in preview/prod.
      return;
    }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.meta.total).toBeGreaterThan(0);
    for (const item of body.items) {
      expect(item.project.developer.toLowerCase()).toContain("emaar");
    }
  });

  test("API filters by post-handover payment plan", async ({ request }) => {
    const res = await request.get(
      "/api/catalog/projects?payment=post-handover&pageSize=10",
    );
    if (res.status() === 503) {
      // D1-backed catalog API not available in e2e (plain `next start` has no D1 tables).
      return;
    }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.meta.total).toBeGreaterThan(0);
    for (const item of body.items) {
      const plan = item.catalog?.paymentPlan ?? item.project.paymentPlan;
      const segments = String(plan).split("/");
      expect(segments.length).toBeGreaterThanOrEqual(4);
    }
  });

  test("more-filters panel syncs developer to URL and results", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/projects");
    await waitForCatalog(page);
    await page.getByRole("button", { name: /More filters/i }).click();
    await page.getByLabel("Developer").selectOption({ label: "Emaar Properties" });
    await expect(page).toHaveURL(/dev=emaar-properties/, { timeout: 10_000 });
    await page
      .getByRole("link", { name: "View Details" })
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
  });

  test("URL params hydrate advanced filters", async ({ page }) => {
    await page.goto("/projects?dev=emaar-properties&handover=2028");
    await waitForCatalogHydration(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByRole("button", { name: /More filters/i }).click();
    await expect(page.getByLabel("Developer")).toHaveValue("emaar-properties");
    await expect(page.getByLabel("Handover by")).toHaveValue("2028");
  });

  test("deep-link hydrates page + sort and keeps them in the URL", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/projects?page=2&sort=price-asc&city=dubai");
    await waitForCatalogHydration(page);

    // Sort restored from ?sort (not the default "Featured").
    await expect(
      page.getByRole("combobox", { name: /Sort by/i }),
    ).toHaveValue("price-asc");
    // Page restored from ?page — the active pager button is page 2.
    await expect(page.getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // The write-effect must NOT strip page/sort from the URL (the original bug).
    await expect(page).toHaveURL(/[?&]page=2(?:&|$)/, { timeout: 10_000 });
    await expect(page).toHaveURL(/[?&]sort=price-asc(?:&|$)/);
    await expect(page).toHaveURL(/[?&]city=dubai(?:&|$)/);
  });
});
