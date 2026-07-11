import { test, expect } from "./fixtures";
import { waitForCatalog } from "./helpers";

test.describe("Compare units — visual upgrade", () => {
  test("summary strip, yield + mortgage rows, winner markers, plan bars", async ({
    page,
  }) => {
    await page.goto("/projects");
    await waitForCatalog(page);

    // Add two units to compare (same pattern as projects.spec.ts).
    const boxes = page.getByRole("checkbox", { name: /^Compare / });
    await boxes.nth(0).check();
    await boxes.nth(1).check();
    await expect(page.getByTestId("compare-count")).toHaveText("2");
    const compareLink = page.getByTestId("compare-link");
    await expect(compareLink).toHaveAttribute("href", /\/compare\?units=/);
    await Promise.all([
      page.waitForURL(/\/compare\?units=/, { timeout: 20_000 }),
      compareLink.click(),
    ]);
    await expect(
      page.getByRole("heading", { name: /Compare Projects/i }),
    ).toBeVisible();

    // Summary strip renders for a 2-unit comparison.
    await expect(page.getByTestId("compare-summary-strip")).toBeVisible();

    // New metric rows exist as row headers.
    const table = page.locator("table");
    await expect(
      table.getByRole("rowheader", { name: /Gross yield/i }),
    ).toBeVisible();
    await expect(
      table.getByRole("rowheader", { name: /Est\. monthly payment/i }),
    ).toBeVisible();

    // At least one winner marker (▲) rendered somewhere on the page —
    // the summary strip alone guarantees one when it renders.
    await expect(page.getByText("▲").first()).toBeVisible();

    // Payment-plan bars: only rendered when the parsed stages sum to
    // 95–105%, so their presence is data-dependent. When present, they
    // must expose role="img" with an accessible payment-plan label.
    const bars = page.getByRole("img", { name: /^Payment plan / });
    const barCount = await bars.count();
    if (barCount > 0) {
      await expect(bars.first()).toBeVisible();
    }
  });
});
