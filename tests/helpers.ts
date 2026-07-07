import type { Page } from "@playwright/test";

export async function waitForCatalogHydration(page: Page) {
  await page
    .locator('div[data-hydrated="true"]')
    .first()
    .waitFor({ state: "attached", timeout: 20_000 });
}

export async function waitForCatalog(page: Page) {
  await waitForCatalogHydration(page);

  // Project cards load after catalog/API fetch in NEXT_PUBLIC_CATALOG_API mode
  await page
    .getByRole("link", { name: "View Details" })
    .first()
    .waitFor({ state: "visible", timeout: 30_000 });
}