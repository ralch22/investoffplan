import { test, expect } from "./fixtures";

/**
 * #277 / #279 — AR compare pair body links must stay under /ar
 * (not bare EN next/link). Product CTAs use localePath(locale, …).
 *
 * Assert SSR HTML (Turnstile/live-DOM flaky on heavy pages).
 *
 * Note: language switcher correctly emits bare EN paths for the *current*
 * page (e.g. href="/compare/…") — do not ban those.
 */
const PROJECT_PAIR =
  "1wood-residence-phase-2-by-object-1-vs-norah-residence";
const DEV_PAIR = "damac-properties-vs-emaar-properties";

test.describe("AR compare pair links stay in-locale (#277, #279)", () => {
  test("/ar/compare/[pair] community + SERP + related under /ar", async ({
    page,
  }) => {
    const response = await page.goto(
      "/ar/compare/business-bay-vs-jumeirah-village-circle",
      { waitUntil: "commit" },
    );
    expect(response?.status()).toBe(200);
    const html = await response!.text();

    expect(html).toContain('href="/ar/communities/business-bay"');
    expect(html).toContain('href="/ar/communities/jumeirah-village-circle"');
    expect(html).toMatch(/href="\/ar\/projects\?q=/);
    // Related mesh stays in AR (beyond the current-pair EN language switcher).
    expect(html).toMatch(
      /href="\/ar\/compare\/(?!business-bay-vs-jumeirah-village-circle)[^"]+"/,
    );

    // Body targets must not be bare EN.
    expect(html).not.toMatch(/href="\/communities\/business-bay"/);
    expect(html).not.toMatch(/href="\/projects\?q=/);
  });

  // #277 acceptance: AR project pair CTAs under /ar/projects/*, no bare EN.
  test("/ar/compare-projects/[pair] project links under /ar", async ({
    page,
  }) => {
    const response = await page.goto(`/ar/compare-projects/${PROJECT_PAIR}`, {
      waitUntil: "commit",
    });
    expect(response?.status()).toBe(200);
    const html = await response!.text();

    expect(html).toContain(
      'href="/ar/projects/1wood-residence-phase-2-by-object-1"',
    );
    expect(html).toContain('href="/ar/projects/norah-residence"');
    // Body CTAs / table heads must not dump AR users onto bare EN PDPs.
    expect(html).not.toMatch(
      /href="\/projects\/1wood-residence-phase-2-by-object-1"/,
    );
    expect(html).not.toMatch(/href="\/projects\/norah-residence"/);
  });

  // #277 acceptance: AR developer pair CTAs under /ar/developers/*.
  test("/ar/compare-developers/[pair] developer + related under /ar", async ({
    page,
  }) => {
    const response = await page.goto(`/ar/compare-developers/${DEV_PAIR}`, {
      waitUntil: "commit",
    });
    expect(response?.status()).toBe(200);
    const html = await response!.text();

    expect(html).toContain('href="/ar/developers/damac-properties"');
    expect(html).toContain('href="/ar/developers/emaar-properties"');
    expect(html).not.toMatch(/href="\/developers\/damac-properties"/);
    expect(html).not.toMatch(/href="\/developers\/emaar-properties"/);
    // Related mesh under /ar (EN language switcher may keep bare current pair).
    expect(html).toMatch(
      /href="\/ar\/compare-developers\/(?!damac-properties-vs-emaar-properties)[^"]+"/,
    );
  });

  // #277 acceptance: EN pair pages stay unprefixed (localePath identity).
  test("EN compare-projects pair keeps unprefixed /projects/*", async ({
    page,
  }) => {
    const response = await page.goto(`/compare-projects/${PROJECT_PAIR}`, {
      waitUntil: "commit",
    });
    expect(response?.status()).toBe(200);
    const html = await response!.text();

    expect(html).toContain(
      'href="/projects/1wood-residence-phase-2-by-object-1"',
    );
    expect(html).toContain('href="/projects/norah-residence"');
    expect(html).not.toContain(
      'href="/ar/projects/1wood-residence-phase-2-by-object-1"',
    );
    expect(html).not.toContain('href="/ar/projects/norah-residence"');
  });
});
