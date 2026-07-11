import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

const SEARCH_LABEL = "Search the catalog";

/** Focus + type into the (visible) suggest combobox and wait for the listbox. */
async function typeQuery(page: Page, text: string) {
  const input = page.getByRole("combobox", { name: SEARCH_LABEL }).first();
  await input.click();
  await input.fill(text);
  return input;
}

test.describe("SearchSuggest typeahead", () => {
  test("hero: 'jvc' shows a Communities group and ↓+Enter navigates to the community", async ({
    page,
  }) => {
    await page.goto("/");
    const input = await typeQuery(page, "jvc");
    const listbox = page.getByRole("listbox").first();
    await expect(listbox).toBeVisible();
    // Communities group header + JVC option (index built after first focus).
    await expect(listbox.getByText("Communities", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    const jvcOption = listbox
      .getByRole("option", { name: /Jumeirah Village Circle/i })
      .first();
    await expect(jvcOption).toBeVisible();
    // Keyboard-select the first option (the JVC community). The component
    // resets `highlight` to -1 on every keystroke (onChange), which can race a
    // programmatic ArrowDown and leave nothing highlighted. Retry the keypress
    // until the highlight actually lands on JVC — pressing from a reset -1
    // always re-lands on index 0 (JVC), so this never overshoots. Only THEN
    // press Enter (else the no-highlight fallback routes to /projects?q=).
    await expect(async () => {
      await input.press("ArrowDown");
      await expect(jvcOption).toHaveAttribute("aria-selected", "true", {
        timeout: 500,
      });
    }).toPass({ timeout: 10_000 });
    await input.press("Enter");
    await page.waitForURL(/\/communities\/jumeirah-village-circle/, { timeout: 15_000 });
  });

  test("hero: 'jvc under 1m' shows a smart row and clicking it applies maxP", async ({
    page,
  }) => {
    await page.goto("/");
    await typeQuery(page, "jvc under 1m");
    const listbox = page.getByRole("listbox").first();
    await expect(listbox).toBeVisible();
    const smartRow = listbox.getByRole("option", { name: /results/ }).first();
    await expect(smartRow).toBeVisible({ timeout: 15_000 });
    await smartRow.click();
    await page.waitForURL(/maxP=1000000/, { timeout: 15_000 });
  });

  test("header search on /guides opens and suggests", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/guides");
    await page.getByRole("button", { name: "Open search" }).click();
    const input = page.getByRole("combobox", { name: SEARCH_LABEL });
    await expect(input).toBeVisible();
    await input.fill("emaar");
    const listbox = page.getByRole("listbox").first();
    await expect(listbox).toBeVisible();
    await expect(
      listbox.getByRole("option", { name: /emaar/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Escape closes the listbox", async ({ page }) => {
    await page.goto("/");
    const input = await typeQuery(page, "dubai");
    await expect(page.getByRole("listbox").first()).toBeVisible();
    await input.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(input).toHaveAttribute("aria-expanded", "false");
  });

  test("regression: plain text + Enter with no highlight routes to /projects?q=", async ({
    page,
  }) => {
    await page.goto("/");
    const input = await typeQuery(page, "lorem ipsum tower");
    await input.press("Enter");
    await page.waitForURL(/\/projects\?q=lorem(\+|%20)ipsum(\+|%20)tower/, {
      timeout: 15_000,
    });
  });

  test("mobile: bottom tab-bar search sheet suggests for 'damac'", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Search" })
      .click();
    // Scope to the open sheet dialog — the hero combobox is also mounted.
    const input = page
      .getByRole("dialog")
      .getByRole("combobox", { name: SEARCH_LABEL });
    await expect(input).toBeVisible();
    await input.fill("damac");
    const listbox = page.getByRole("dialog").getByRole("listbox").first();
    await expect(listbox).toBeVisible();
    await expect(
      listbox.getByRole("option", { name: /damac/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
