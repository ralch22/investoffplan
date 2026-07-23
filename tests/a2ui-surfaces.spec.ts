import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

// Phase-2 page surfaces. Unlike the chat drawer these are composed
// deterministically on the server/page — there is no advisor call to mock, so
// these assert the REAL composed output rendering in the real pages.

const PROJECT = "/projects/105-residences";

/** The A2UI Stack wrapper — present only when a surface actually rendered. */
const A2UI_SHAPE = "div.w-full.space-y-2";

async function countAdvisorCalls(page: Page) {
  let calls = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/advisor")) calls += 1;
  });
  return () => calls;
}

test.describe("A2UI page surfaces", () => {
  test("PDP decision strip renders a mortgage + comparison, with no advisor call", async ({
    page,
  }) => {
    const advisorCalls = await countAdvisorCalls(page);
    await page.goto(PROJECT);

    const strip = page.locator("#decision");
    await expect(strip).toBeVisible();
    // Composed, not chatted: the surface exists without the drawer being opened.
    await expect(strip.locator("[data-testid='advisor-mortgage-monthly']")).toBeVisible();
    await expect(strip.locator(A2UI_SHAPE).first()).toBeVisible();

    expect(
      advisorCalls(),
      "the PDP strip is deterministic — it must not call the advisor",
    ).toBe(0);
  });

  test("PDP mortgage recomputes locally (zero API calls on interaction)", async ({
    page,
  }) => {
    await page.goto(PROJECT);
    const strip = page.locator("#decision");
    const monthly = strip.locator("[data-testid='advisor-mortgage-monthly']");
    await expect(monthly).toBeVisible();

    // Let the page finish loading BEFORE counting. The claim under test is
    // "moving the slider causes no request" — attaching the counter while
    // page-load requests are still in flight measures the wrong thing, and any
    // straggler (favourites sync, analytics) failed this for the wrong reason.
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

    let calls = 0;
    page.on("request", (r) => {
      if (r.url().includes("/api/")) calls += 1;
    });

    const before = await monthly.textContent();
    await strip.getByRole("slider", { name: "Term" }).fill("10");
    await expect.poll(async () => monthly.textContent()).not.toBe(before);
    expect(calls, "slider recompute is client-side only").toBe(0);
  });

  test("PDP strip renders under Arabic RTL", async ({ page }) => {
    await page.goto(`/ar${PROJECT}`);
    await expect(page.locator("#decision")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("SERP rescue offers closest matches and names the relaxed filter", async ({
    page,
  }) => {
    // A bed count nothing in the catalog has → a genuine zero-result search.
    // (maxP is bucketed into price bands by the SERP, so it can't produce one.)
    await page.goto("/projects?beds=9");

    const rescue = page.getByText(/showing the closest options/i);
    await expect(rescue).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/bedrooms/i).first()).toBeVisible();
    // ...and it must actually offer projects, not just apologise.
    await expect(
      page.getByRole("link", { name: /View project/ }).first(),
    ).toBeVisible();
  });

  test("SERP rescue stays silent when results exist", async ({ page }) => {
    await page.goto("/projects");
    // Results exist here, so the rescue must stay out of the way entirely.
    await expect(page.locator('a[href^="/projects/"]').first()).toBeVisible();
    await expect(page.getByText(/showing the closest options/i)).toHaveCount(0);
  });
});
