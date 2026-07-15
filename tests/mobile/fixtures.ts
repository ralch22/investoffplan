import { test as base, expect, type Locator, type Page } from "@playwright/test";

/**
 * Mobile-project fixtures.
 *
 * `test`        — cookie consent pre-denied (banner suppressed), like the root
 *                 tests/fixtures.ts, for funnel/interaction specs.
 * `consentTest` — NO consent seed: the banner is live. Chrome-stacking specs
 *                 must use this one, because the whole point is how bottom
 *                 fixtures behave while the banner is up.
 */
const clearState = ([consent]: [string | null]) => {
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
    if (consent) window.localStorage.setItem("iop_consent", consent);
  } catch {
    /* storage unavailable */
  }
};

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(clearState, ["denied"] as [string | null]);
    await use(context);
  },
});

export const consentTest = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(clearState, [null] as [string | null]);
    await use(context);
  },
});

export { expect };

/** Box helpers for stacking assertions. */
export async function box(locator: Locator) {
  const b = await locator.boundingBox();
  expect(b, `boundingBox missing for ${locator}`).not.toBeNull();
  return b!;
}

export function intersects(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * True when the element at the CENTER of `target` is `target` itself or a
 * descendant/ancestor of it — i.e. the control is actually hittable, not
 * covered by another fixed layer.
 */
export async function hittableAtCenter(page: Page, target: Locator): Promise<boolean> {
  const b = await box(target);
  return target.evaluate(
    (el, pt) => {
      const hit = document.elementFromPoint(pt.x, pt.y);
      return Boolean(hit && (el === hit || el.contains(hit) || hit.contains(el)));
    },
    { x: b.x + b.width / 2, y: b.y + b.height / 2 },
  );
}

/** Pin scroll to top and let the scroll-direction chrome transitions settle. */
export async function settleChromeAtTop(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(450); // translate transition is 300ms
}

/** Navigate to the first PDP from the SERP; returns its pathname. */
export async function gotoFirstPdp(page: Page): Promise<string> {
  await page.goto("/projects");
  await page.waitForSelector('div[data-hydrated="true"]', { timeout: 30_000 });
  const link = page.getByRole("link", { name: /view details/i }).first();
  await link.waitFor({ timeout: 30_000 });
  await link.click();
  await page.waitForURL(/\/projects\/[^/?#]+/, { timeout: 30_000 });
  return new URL(page.url()).pathname;
}
