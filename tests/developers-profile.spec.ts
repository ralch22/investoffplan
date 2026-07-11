import { test, expect } from "./fixtures";

// The Developer Profile panel is real, server-rendered content. Emaar has the
// largest catalog, so it always renders the full panel (all four sub-metrics
// plus DLD-backed positioning).
test.describe("Developer profile panel", () => {
  test("renders the profile heading, a sub-metric bar, and the methodology disclaimer", async ({
    page,
  }) => {
    await page.goto("/developers/emaar-properties");

    const panel = page.locator("section", {
      has: page.locator("#developer-profile-heading"),
    });
    await expect(panel).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Developer profile/i }),
    ).toBeVisible();

    // At least one honest sub-metric bar (role=meter) is present.
    await expect(panel.locator('[role="meter"]').first()).toBeVisible();
    await expect(
      panel.locator("[data-profile-metric='portfolioScale']"),
    ).toBeVisible();

    // A purely size-descriptive band label (not a quality/tenure ranking —
    // "Established"/"Growing" were removed after the honesty review).
    await expect(
      panel.getByText(/Large portfolio|Mid-size portfolio|Boutique portfolio/).first(),
    ).toBeVisible();

    // The verbatim disclaimer is now ALWAYS visible (surfaced out of the
    // collapsed accordion after the honesty review); it also still appears
    // inside the methodology panel, hence .first().
    await expect(
      panel.getByText(
        "This profile is derived only from the size and market positioning of this developer's off-plan catalog and 2025 Dubai Land Department data for the areas they build in. It is not a rating of construction quality, delivery timeliness, or financial stability.",
      ).first(),
    ).toBeVisible();
  });

  test("Arabic developer page renders the localized profile heading", async ({
    page,
  }) => {
    await page.goto("/ar/developers/emaar-properties");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByText("ملف المطوّر").first()).toBeVisible();
  });
});
