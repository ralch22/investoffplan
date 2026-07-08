import { test, expect } from "./fixtures";
import { waitForCatalog } from "./helpers";

test.describe("InvestOffPlan extended flows", () => {
  test("compare page shows unified table", async ({ page }) => {
    await page.goto("/projects");
    await waitForCatalog(page);
    const boxes = page.getByRole("checkbox", { name: /^Compare / });
    await boxes.nth(0).check();
    await boxes.nth(1).check();
    await expect(page.getByTestId("compare-count")).toHaveText("2");
    const compareLink = page.getByTestId("compare-link");
    await expect(compareLink).toBeVisible();
    await expect(compareLink).toHaveAttribute("href", /\/compare\?units=/);
    await Promise.all([
      page.waitForURL(/\/compare\?units=/, { timeout: 20_000 }),
      compareLink.click(),
    ]);
    await expect(page.getByText("Property type")).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove" }).first()).toBeVisible();
  });

  test("favorites star toggles on project card", async ({ page }) => {
    await page.goto("/projects");
    await waitForCatalog(page);
    const star = page.getByRole("button", { name: "Add to favorites" }).first();
    await star.click();
    await expect(page.getByRole("button", { name: "Remove from favorites" }).first()).toBeVisible();
    await page.goto("/favorites");
    await expect(page.getByText(/Your saved off-plan properties/i)).toBeVisible();
  });

  test("contact form validates empty submit", async ({ page }) => {
    await page.goto("/contact");
    await page
      .locator("form")
      .filter({ has: page.getByPlaceholder("Email address") })
      .getByRole("button", { name: "Submit" })
      .click();
    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Subject is required")).toBeVisible();
    await expect(page.getByText("Message is required")).toBeVisible();
  });

  test("homepage uses branded logo", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByAltText("invest off-plan").first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("heading", { name: /Latest launches/i })).toBeVisible();
  });

  test("map deep-links to project from query", async ({ page }) => {
    await page.goto("/map?project=palm-central-private-residences-phase-2");
    await expect(page.getByText(/Palm Central/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "View details" })).toBeVisible();
  });

  test("contact CTA validates on about page", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("button", { name: "Submit enquiry" }).click();
    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Tell us what you're looking for")).toBeVisible();
  });

  test("newsletter validates email", async ({ page }) => {
    await page.goto("/");
    const newsletter = page.getByRole("form", { name: "Newsletter signup" });
    await newsletter.scrollIntoViewIfNeeded();
    await expect(newsletter).toBeVisible({ timeout: 30_000 });
    await newsletter.getByPlaceholder("Email...").fill("not-an-email");
    await newsletter.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
  });

  test("404 page shows branded icon", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse projects" })).toBeVisible();
  });
});