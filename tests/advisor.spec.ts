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
});
