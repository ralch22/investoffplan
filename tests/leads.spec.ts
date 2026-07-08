import { test, expect } from "./fixtures";

test.describe("Lead capture API", () => {
  test("stores a valid contact lead", async ({ request }) => {
    const res = await request.post("/api/leads", {
      data: {
        formType: "contact",
        email: "e2e-lead@example.com",
        message: "E2E test lead — please ignore",
        honeypot: "",
        turnstileToken: "",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.id).toBe("string");
  });

  test("silently accepts honeypot submissions without storing", async ({ request }) => {
    const res = await request.post("/api/leads", {
      data: {
        formType: "contact",
        email: "bot@example.com",
        honeypot: "i-am-a-bot",
        turnstileToken: "",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.id).toBeUndefined();
  });

  test("rejects leads without email or phone", async ({ request }) => {
    const res = await request.post("/api/leads", {
      data: {
        formType: "newsletter",
        name: "No Contact Info",
        honeypot: "",
        turnstileToken: "",
      },
    });
    expect(res.status()).toBe(400);
  });

  test("rejects unknown form types", async ({ request }) => {
    const res = await request.post("/api/leads", {
      data: {
        formType: "nonsense",
        email: "x@example.com",
        honeypot: "",
        turnstileToken: "",
      },
    });
    expect(res.status()).toBe(400);
  });

  test("contact form submits end-to-end", async ({ page }) => {
    await page.goto("/contact");
    await page.getByPlaceholder("Email address").fill("e2e-form@example.com");
    await page.getByPlaceholder("Subject").fill("E2E subject");
    await page.getByPlaceholder("Message").fill("This is an end-to-end test message.");
    await page.getByRole("button", { name: "Submit" }).first().click();
    await expect(page.getByText(/your message has been sent/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
