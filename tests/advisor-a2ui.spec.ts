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
