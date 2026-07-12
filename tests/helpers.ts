import type { Page } from "@playwright/test";

export async function waitForCatalogHydration(page: Page) {
  await page
    .locator('div[data-hydrated="true"]')
    .first()
    .waitFor({ state: "attached", timeout: 20_000 });
}

/**
 * Wait for SERP project cards after catalog hydrate.
 * Pass viewDetailsLabel for locale-specific CTAs (EN default / AR "عرض التفاصيل").
 */
export async function waitForCatalog(
  page: Page,
  opts?: { viewDetailsLabel?: string | RegExp },
) {
  await waitForCatalogHydration(page);

  // Project cards load after catalog/API fetch in NEXT_PUBLIC_CATALOG_API mode
  const label = opts?.viewDetailsLabel ?? "View Details";
  await page
    .getByRole("link", { name: label })
    .first()
    .waitFor({ state: "visible", timeout: 30_000 });
}