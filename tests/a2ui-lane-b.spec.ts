import { test, expect } from "./fixtures";
import type { Page, Route } from "@playwright/test";

// Lane-B surfaces: the ones where language IS the input (the home ask bar) and
// where a composed answer becomes an artifact someone can send (/s/[id]).
//
// The advisor is mocked here on purpose. These specs are about what the PAGE
// does with an answer — render it inline, spend exactly one call, deep-link it,
// degrade politely when the budget is gone — none of which should depend on a
// live model, and none of which should spend real budget in CI.

const CARDS = [
  {
    slug: "marina-vista",
    name: "Marina Vista",
    developer: "Emaar",
    area: "Dubai Marina",
    fromPriceAed: 1_200_000,
    handover: "Q4 2027",
    beds: [1, 2],
  },
];

const A2UI = [
  {
    version: "v0.9",
    createSurface: {
      surfaceId: "ask-1",
      catalogId: "https://investoffplan.com/a2ui/advisor-catalog/v1",
    },
  },
  {
    version: "v0.9",
    updateComponents: {
      surfaceId: "ask-1",
      components: [
        { id: "root", component: "Stack", children: ["p-0", "mortgage"] },
        { id: "p-0", component: "ProjectCard", ...CARDS[0] },
        {
          id: "mortgage",
          component: "MortgagePanel",
          propertyPriceAed: 1_200_000,
          downPaymentPct: 20,
          annualRatePct: 4.25,
          termYears: 25,
        },
      ],
    },
  },
];

/** Mock /api/advisor and report how many times the page called it. */
async function mockAdvisor(
  page: Page,
  body: Record<string, unknown>,
  status = 200,
): Promise<() => number> {
  let calls = 0;
  await page.route("**/api/advisor", async (route: Route) => {
    calls += 1;
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  return () => calls;
}

/**
 * The ask bar lives inside a Suspense boundary (it reads searchParams), so it
 * is NOT in the first paint — checking for it immediately reports "absent" on a
 * cold server and silently skips the spec. Wait, then decide.
 */
async function askInput(page: Page) {
  const input = page.locator("#home-ask");
  await input.waitFor({ state: "attached", timeout: 20_000 }).catch(() => {});
  return input;
}

const ANSWER = {
  reply: "Marina Vista fits — 2-bed from AED 1.2M, handover Q4 2027.",
  cards: CARDS,
  suggestions: ["Show me payment plans"],
  cta: "none",
  a2ui: A2UI,
};

test.describe("Home ask bar", () => {
  test("answers inline with a composed surface, spending exactly one call", async ({ page }) => {
    const calls = await mockAdvisor(page, ANSWER);
    await page.goto("/");

    const input = await askInput(page);
    // The bar is flag-gated; when it's dark this spec has nothing to assert.
    test.skip((await input.count()) === 0, "ask surface not enabled in this build");

    await input.fill("2-bed in Dubai Marina");
    await page.getByRole("button", { name: /^Ask$/ }).click();

    await expect(page.getByText("Marina Vista fits")).toBeVisible();
    // The answer renders IN the page, not in the chat drawer.
    await expect(page.locator("[data-testid='advisor-mortgage-monthly']")).toBeVisible();
    expect(calls(), "one question must cost exactly one advisor call").toBe(1);
  });

  test("?ask= deep-links an answer, and fires only once", async ({ page }) => {
    const calls = await mockAdvisor(page, ANSWER);
    await page.goto("/?ask=2-bed%20in%20Dubai%20Marina");

    const input = await askInput(page);
    test.skip((await input.count()) === 0, "ask surface not enabled in this build");

    await expect(page.getByText("Marina Vista fits")).toBeVisible();
    await expect(input).toHaveValue("2-bed in Dubai Marina");
    // A shared link that re-asks on every render would quietly drain the cap.
    await page.waitForTimeout(1500);
    expect(calls(), "a deep-linked question must fire once, not on every render").toBe(1);
  });

  test("a spent daily budget reads as an answer, not an error", async ({ page }) => {
    // What the route really returns when the cap is hit: HTTP 200, no cards,
    // and a sentence pointing at WhatsApp.
    await mockAdvisor(page, {
      reply: "The advisor has reached today's capacity — reach our team directly on WhatsApp.",
      cards: [],
      suggestions: [],
      cta: "whatsapp",
    });
    await page.goto("/");

    const input = await askInput(page);
    test.skip((await input.count()) === 0, "ask surface not enabled in this build");

    await input.fill("anything");
    await page.getByRole("button", { name: /^Ask$/ }).click();

    await expect(page.getByText(/reached today's capacity/)).toBeVisible();
  });
});

test.describe("Shared shortlist", () => {
  test("share button posts only slugs and copies a link", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await mockAdvisor(page, ANSWER);

    let posted: Record<string, unknown> | null = null;
    await page.route("**/api/advisor/share", async (route: Route) => {
      posted = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "abc123", url: "/s/abc123" }),
      });
    });

    await page.goto("/");
    // testid, not the label: the ask bar's label ("Ask the Off-Plan
    // Advisor") contains the launcher's name, so getByLabel matches both.
    await page.getByTestId("advisor-launcher").click();
    await page.getByPlaceholder(/Ask about projects/).fill("2-bed in Dubai Marina");
    await page.getByRole("button", { name: "Send" }).click();

    const share = page.getByRole("button", { name: "Share" });
    await expect(share).toBeVisible();
    await share.click();
    await expect(page.getByRole("button", { name: "Link copied" })).toBeVisible();

    // The security model in one assertion: the client sends INGREDIENTS. If a
    // composed surface or an image URL ever appears here, a share could render
    // attacker-chosen content on our domain.
    expect(posted).toBeTruthy();
    expect(posted!.slugs).toEqual(["marina-vista"]);
    expect(posted).not.toHaveProperty("a2ui");
    expect(posted).not.toHaveProperty("cards");
    expect(JSON.stringify(posted)).not.toContain("imageUrl");
  });
});
