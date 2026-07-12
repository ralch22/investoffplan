import { test, expect } from "./fixtures";

test.describe("Off-Plan Advisor", () => {
  test("launcher opens the advisor with starter prompts", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Off-Plan Advisor" }).click();
    await expect(page.getByRole("dialog", { name: /Off-Plan Advisor/ })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /How does buying off-plan work/ }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /WhatsApp us/ })).toHaveAttribute(
      "href",
      /wa\.me\/971585276222/,
    );
  });

  test("API rejects empty messages", async ({ request }) => {
    const res = await request.post("/api/advisor", {
      data: { messages: [] },
    });
    expect(res.status()).toBe(400);
  });

  test("API answers gracefully without AI bindings (offline fallback)", async ({
    request,
  }) => {
    // Plain `next start` in e2e has no AI/AI Search bindings — the route must
    // degrade to the WhatsApp fallback, never 500.
    const res = await request.post("/api/advisor", {
      data: {
        messages: [{ role: "user", content: "Show me 2-beds in Dubai" }],
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.reply).toBe("string");
    expect(body.reply.length).toBeGreaterThan(0);
    expect(Array.isArray(body.cards)).toBe(true);
  });

  test("advisor widget renders in Arabic tree (RTL)", async ({ page }) => {
    await page.goto("/ar");
    await expect(
      page.getByRole("button", { name: "مستشار العقارات" }),
    ).toBeVisible();
  });

  // #181 — FAB/panel must clear PDP sticky CTA + stay reachable on home.
  test("mobile PDP: advisor launcher clears sticky CTA bar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/projects/105-residences");

    const cta = page.getByRole("region", { name: "Quick actions" });
    const fab = page.getByTestId("advisor-launcher");
    await expect(cta).toBeVisible();
    await expect(fab).toBeVisible();

    const ctaBox = await cta.boundingBox();
    const fabBox = await fab.boundingBox();
    expect(ctaBox, "sticky CTA should have a box").toBeTruthy();
    expect(fabBox, "advisor launcher should have a box").toBeTruthy();

    // FAB bottom edge must sit at or above the CTA top edge (2px subpixel slack).
    expect(fabBox!.y + fabBox!.height).toBeLessThanOrEqual(ctaBox!.y + 2);
  });

  test("mobile PDP: open panel clears sticky CTA and stays on-screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/projects/105-residences");

    await page.getByTestId("advisor-launcher").click();
    const panel = page.getByTestId("advisor-panel");
    const cta = page.getByRole("region", { name: "Quick actions" });
    await expect(panel).toBeVisible();

    const panelBox = await panel.boundingBox();
    const ctaBox = await cta.boundingBox();
    expect(panelBox).toBeTruthy();
    expect(ctaBox).toBeTruthy();

    expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(ctaBox!.y + 2);
    expect(panelBox!.y).toBeGreaterThanOrEqual(-2);
  });

  test("desktop: advisor launcher remains reachable on home", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const fab = page.getByTestId("advisor-launcher");
    await expect(fab).toBeVisible();
    const box = await fab.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y + box!.height).toBeLessThanOrEqual(800);
    expect(box!.y).toBeGreaterThan(0);
  });

  test("gallery lightbox hides advisor chrome", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/projects/105-residences");
    await expect(page.getByRole("heading", { name: /Project gallery/i })).toBeVisible({
      timeout: 20_000,
    });

    const fab = page.getByTestId("advisor-launcher");
    await expect(fab).toBeVisible();

    await page.getByRole("button", { name: /fullscreen/i }).click();
    // Name the gallery dialog — advisor is also a native <dialog> when open.
    const gallery = page.getByRole("dialog", { name: /photo gallery/i });
    await expect(gallery).toBeVisible();
    // visibility:hidden — not in a11y tree / not hittable over gallery thumbs.
    await expect(fab).toBeHidden();

    await page.getByRole("button", { name: "Close gallery" }).click();
    await expect(gallery).toBeHidden();
    await expect(fab).toBeVisible();
  });
});
