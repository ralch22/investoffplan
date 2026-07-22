import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

// The e2e stack has no Workers AI binding (see advisor.spec.ts), so we inject
// the advisor response via route interception and exercise the client render
// path: A2UI messages → catalog → surface → error-boundary fallback.

const CATALOG_ID = "https://investoffplan.com/a2ui/advisor-catalog/v1";

const CARD = {
  slug: "marina-vista",
  name: "Marina Vista",
  developer: "Emaar",
  area: "Dubai Marina",
  fromPriceAed: 1_200_000,
  handover: "Q4 2027",
  beds: [1, 2],
  paymentPlan: "60/40",
};

function a2uiMessages(catalogId = CATALOG_ID) {
  return [
    { version: "v0.9", createSurface: { surfaceId: "adv-1", catalogId } },
    {
      version: "v0.9",
      updateComponents: {
        surfaceId: "adv-1",
        components: [
          { id: "root", component: "Stack", children: ["p-0", "lead"] },
          { id: "p-0", component: "ProjectCard", ...CARD },
          { id: "lead", component: "LeadForm", lastQuestion: "call me" },
        ],
      },
    },
  ];
}

async function mockAdvisor(page: Page, body: Record<string, unknown>) {
  await page.route("**/api/advisor", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    }),
  );
}

async function ask(page: Page) {
  await page.getByTestId("advisor-launcher").click();
  const input = page.getByTestId("advisor-panel").getByRole("textbox").last();
  await input.fill("Show me 2-beds in Dubai Marina");
  await input.press("Enter");
}

test.describe("Advisor A2UI surface", () => {
  test("renders ProjectCard + LeadForm from an A2UI response", async ({ page }) => {
    await mockAdvisor(page, {
      reply: "Here are two options.",
      cards: [CARD],
      suggestions: [],
      cta: "lead-form",
      a2ui: a2uiMessages(),
    });
    await page.goto("/");
    await ask(page);

    const panel = page.getByTestId("advisor-panel");
    await expect(panel.getByText("Marina Vista")).toBeVisible();
    await expect(
      panel.getByRole("link", { name: /View project/ }),
    ).toHaveAttribute("href", /\/projects\/marina-vista/);
    // LeadForm leaf rendered by the surface (not the widget's own form).
    await expect(panel.getByPlaceholder("Your name")).toBeVisible();
    await expect(
      panel.getByRole("button", { name: "Request callback" }),
    ).toBeVisible();
  });

  test("no a2ui field → legacy cards still render", async ({ page }) => {
    await mockAdvisor(page, {
      reply: "One option.",
      cards: [CARD],
      suggestions: [],
      cta: "none",
    });
    await page.goto("/");
    await ask(page);

    const panel = page.getByTestId("advisor-panel");
    await expect(panel.getByText("Marina Vista")).toBeVisible();
    await expect(
      panel.getByRole("link", { name: /View project/ }),
    ).toHaveAttribute("href", /\/projects\/marina-vista/);
  });

  test("broken a2ui (unknown catalog) falls back to the legacy cards", async ({
    page,
  }) => {
    await mockAdvisor(page, {
      reply: "Here.",
      cards: [CARD],
      suggestions: [],
      cta: "none",
      a2ui: a2uiMessages("https://example.com/does-not-exist"),
    });
    await page.goto("/");
    await ask(page);

    // Error boundary catches the render failure and shows the legacy view.
    const panel = page.getByTestId("advisor-panel");
    await expect(panel.getByText("Marina Vista")).toBeVisible();
    await expect(
      panel.getByRole("link", { name: /View project/ }),
    ).toHaveAttribute("href", /\/projects\/marina-vista/);
  });

  test("MortgagePanel renders and recomputes client-side (no extra API calls)", async ({
    page,
  }) => {
    await mockAdvisor(page, {
      reply: "Here's an indicative mortgage.",
      cards: [],
      suggestions: [],
      cta: "none",
      a2ui: [
        { version: "v0.9", createSurface: { surfaceId: "adv-m", catalogId: CATALOG_ID } },
        {
          version: "v0.9",
          updateComponents: {
            surfaceId: "adv-m",
            components: [
              { id: "root", component: "Stack", children: ["mortgage"] },
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
      ],
    });

    // Count advisor API calls so we can prove the slider costs zero.
    let advisorCalls = 0;
    page.on("request", (r) => {
      if (r.url().includes("/api/advisor")) advisorCalls += 1;
    });

    await page.goto("/");
    await ask(page);

    const panel = page.getByTestId("advisor-panel");
    await expect(panel.getByText("Indicative mortgage")).toBeVisible();

    const term = panel.getByRole("slider", { name: "Term" });
    await expect(term).toBeVisible();
    const monthly = panel.getByTestId("advisor-mortgage-monthly");
    const before = await monthly.textContent();

    // Shorten the term — the monthly figure must go UP, computed locally.
    await term.fill("10");
    await expect.poll(async () => monthly.textContent()).not.toBe(before);

    expect(advisorCalls, "slider must not re-hit the advisor API").toBe(1);
  });

  test("CompareTable renders both projects side by side", async ({ page }) => {
    await mockAdvisor(page, {
      reply: "Side by side:",
      cards: [CARD],
      suggestions: [],
      cta: "none",
      a2ui: [
        { version: "v0.9", createSurface: { surfaceId: "adv-c", catalogId: CATALOG_ID } },
        {
          version: "v0.9",
          updateComponents: {
            surfaceId: "adv-c",
            components: [
              { id: "root", component: "Stack", children: ["cmp"] },
              {
                id: "cmp",
                component: "CompareTable",
                projects: [
                  CARD,
                  { ...CARD, slug: "creek-rise", name: "Creek Rise", handover: "Q2 2028" },
                ],
              },
            ],
          },
        },
      ],
    });
    await page.goto("/");
    await ask(page);

    const panel = page.getByTestId("advisor-panel");
    await expect(panel.getByText("Side by side")).toBeVisible();
    await expect(panel.getByRole("link", { name: "Marina Vista" })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Creek Rise" })).toBeVisible();
    await expect(panel.getByRole("rowheader", { name: "Payment plan" })).toBeVisible();
    await expect(panel.getByText("Q2 2028")).toBeVisible();
  });

  test("renders under Arabic RTL", async ({ page }) => {
    await mockAdvisor(page, {
      reply: "خياران رائعان.",
      cards: [CARD],
      suggestions: [],
      cta: "none",
      a2ui: a2uiMessages(),
    });
    await page.goto("/ar");
    await ask(page);

    const panel = page.getByTestId("advisor-panel");
    await expect(panel.getByText("Marina Vista")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
