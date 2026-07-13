import { test, expect } from "./fixtures";

test.describe("Content routes", () => {
  test("/insights permanently redirects to /guides", async ({ page }) => {
    const response = await page.goto("/insights");
    expect(response?.url()).toContain("/guides");
    await expect(
      page.getByRole("heading", { level: 1, name: /Investment Guides/i }),
    ).toBeVisible();
  });

  // #250 — AR guides hub must not hardcode EN H1/chrome.
  test("AR /ar/guides hub H1 is Arabic", async ({ page }) => {
    const res = await page.goto("/ar/guides", { waitUntil: "commit" });
    expect(res?.status()).toBe(200);
    const html = await res!.text();
    expect(html).toContain('lang="ar"');
    expect(html).not.toContain(">Investment Guides<");
    expect(html).toContain("أدلّة الاستثمار");
  });

  // #313 — AR news hub cards prefer titleAr (residual after #298 detail fix).
  test("AR news hub featured card uses Arabic titleAr", async ({ page }) => {
    const res = await page.goto("/ar/news", { waitUntil: "domcontentloaded" });
    expect(res?.ok()).toBeTruthy();
    const html = await page.content();
    // Newest article is golden-visa — featured card must show AR title.
    expect(html).toContain("سؤال المليوني درهم");
    expect(html).not.toContain(
      "The AED 2 Million Question: How Much of the Off-Plan Market Clears the Golden Visa Bar",
    );
  });

  // #298 — AR news detail title/H1 use titleAr, not EN article.title only.
  test("AR news article H1 and title use Arabic titleAr", async ({ page }) => {
    const res = await page.goto("/ar/news/golden-visa-threshold-off-plan-catalog", {
      waitUntil: "commit",
    });
    expect(res?.status()).toBe(200);
    const html = await res!.text();
    expect(html).toContain('lang="ar"');
    expect(html).not.toContain("The AED 2 Million Question");
    expect(html).toContain("سؤال المليوني درهم");
  });

  test("news article renders with date, sections, and JSON-LD", async ({ page }) => {
    await page.goto("/news");
    const firstLink = page.getByRole("link", { name: "Read More" }).first();
    await firstLink.click();
    await page.waitForURL(/\/news\/[a-z0-9-]+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(jsonLd.some((s) => s.includes('"NewsArticle"'))).toBe(true);
  });

  test("FAQ hub lists topics and topic page has FAQPage JSON-LD", async ({ page }) => {
    await page.goto("/faq");
    await expect(
      page.getByRole("heading", { level: 1, name: /Frequently Asked Questions/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: /payment plans/i }).first().click();
    await page.waitForURL(/\/faq\/[a-z0-9-]+/);
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(jsonLd.some((s) => s.includes('"FAQPage"'))).toBe(true);
    await expect(page.locator("details.faq-details").first()).toBeVisible();
  });

  test("expanded guide renders rich body sections", async ({ page }) => {
    await page.goto("/guides/understanding-payment-plans");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("article h2").first()).toBeVisible();
  });

  // #191 — compare-developers decision layer (pros / who-suits / related mesh).
  // Assert on SSR body (not live-DOM getByTestId) so Turnstile/hydration can't
  // flake the content check — same pattern as other indexability assertions.
  test("compare-developers pair has decision-layer content + FAQ JSON-LD", async ({
    page,
  }) => {
    const response = await page.goto(
      "/compare-developers/damac-properties-vs-emaar-properties",
    );
    expect(response?.status()).toBe(200);
    const body = await response!.text();
    expect(body).toMatch(/The case for each|الحجّة لكل مطوّر/);
    expect(body).toMatch(/Who each suits|من يناسب كل مطوّر/);
    expect(body).toMatch(/Related developer comparisons|مقارنات مطوّرين ذات صلة/);
    expect(body).toMatch(/FAQPage/);
    expect(body).toMatch(/Premium-flagged share|حصة المشاريع المميزة/);
  });

  // Soft SEO residual (#230) — hub indexes + title/meta hygiene + favorites noindex.

  // #350 — AR developer pair decision-layer copy (FAQs/pros) not bare EN.
  test("AR compare-developers pair FAQs are Arabic chrome", async ({ page }) => {
    const response = await page.goto(
      "/ar/compare-developers/damac-properties-vs-emaar-properties",
      { waitUntil: "commit" },
    );
    expect(response?.status()).toBe(200);
    const body = await response!.text();
    expect(body).toMatch(/الأسئلة الشائعة|من لديه مشاريع أكثر|أي مطوّر/);
    expect(body).not.toContain("Who has more off-plan projects");
    expect(body).not.toContain("Which developer has the lower entry price?");
  });

  // #357 — AR area-compare pair decision-layer copy (FAQs/pros) not bare EN.
  test("AR area-compare pair FAQs are Arabic chrome", async ({ page }) => {
    const response = await page.goto(
      "/ar/compare/business-bay-vs-jumeirah-village-circle",
      { waitUntil: "commit" },
    );
    expect(response?.status()).toBe(200);
    const body = await response!.text();
    expect(body).toMatch(/الأسئلة الشائعة|أيّهما أفضل|مستثمرو العائد/);
    expect(body).not.toContain("Which has the better rental yield");
    expect(body).not.toContain("Higher gross rental yield");
    expect(body).not.toContain("Yield investors");
  });

  // #361 — AR compare-projects pair subtitle + Golden Visa Yes/No.
  test("AR compare-projects pair subtitle is Arabic chrome", async ({ page }) => {
    const response = await page.goto(
      "/ar/compare-projects/1wood-residence-phase-2-by-object-1-vs-norah-residence",
      { waitUntil: "commit" },
    );
    expect(response?.status()).toBe(200);
    const body = await response!.text();
    expect(body).toMatch(/مشروعان على الخارطة|جنباً إلى جنب/);
    expect(body).not.toContain("Two off-plan projects in");
  });

  // #351 — AR RealEstateAgent description + market-report Dataset variableMeasured.
  test("AR developer + market-report JSON-LD descriptions are Arabic", async ({
    page,
  }) => {
    const devRes = await page.goto("/ar/developers/emaar-properties", {
      waitUntil: "commit",
    });
    expect(devRes?.status()).toBe(200);
    const devBody = await devRes!.text();
    expect(devBody).not.toContain("Browse ");
    expect(devBody).not.toMatch(/Browse \d+ off-plan projects/);
    expect(devBody).toMatch(/تصفّح|RealEstateAgent/);

    const mrRes = await page.goto("/ar/market-report", { waitUntil: "commit" });
    expect(mrRes?.status()).toBe(200);
    const mrBody = await mrRes!.text();
    expect(mrBody).not.toContain("Gross rental yield");
    expect(mrBody).not.toContain("Median sold price per sqft");
    expect(mrBody).not.toContain("Off-plan launch price");
    expect(mrBody).not.toContain("Handover pipeline");
    expect(mrBody).toMatch(/variableMeasured|العائد الإيجاري|جدول التسليم/);
  });

  // #363 — AR community DLD trend chart aria-label not bare EN.
  test("AR community DLD chart aria-label is Arabic", async ({ page }) => {
    const response = await page.goto(
      "/ar/communities/jumeirah-village-circle",
      { waitUntil: "commit" },
    );
    expect(response?.status()).toBe(200);
    const body = await response!.text();
    expect(body).not.toContain("Median sold price per sqft by month");
    expect(body).toMatch(/متوسط سعر البيع|وسيط درهم/);
  });

  // #364 — AR price-map filter summary not bare EN.
  test("AR price-map filter summary is Arabic chrome", async ({ page }) => {
    const bare = await page.goto("/ar/tools/price-map", { waitUntil: "commit" });
    expect(bare?.status()).toBe(200);
    const bareBody = await bare!.text();
    expect(bareBody).not.toContain("All unit types");
    expect(bareBody).toMatch(/كل أنواع الوحدات|مجتمعات/);

    const filtered = await page.goto(
      "/ar/tools/price-map?beds=1&type=apartment",
      { waitUntil: "commit" },
    );
    expect(filtered?.status()).toBe(200);
    const filteredBody = await filtered!.text();
    expect(filteredBody).not.toContain("Filtered by");
    expect(filteredBody).toMatch(/مُصفّى|غرف/);
  });

  test("compare hub indexes render and favorites is noindex", async ({ page }) => {
    for (const path of ["/compare-projects", "/compare-developers"]) {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      const body = await res!.text();
      expect(body).toMatch(/<h1[\s>]/i);
    }

    const fav = await page.goto("/favorites");
    expect(fav?.status()).toBe(200);
    const favBody = await fav!.text();
    expect(favBody).toMatch(/noindex/i);

    const pair = await page.goto(
      "/compare-developers/damac-properties-vs-emaar-properties",
    );
    expect(pair?.status()).toBe(200);
    const pairBody = await pair!.text();
    // Title should not double-brand ("… | invest off-plan | invest off-plan").
    const titleMatch = pairBody.match(/<title>([^<]*)<\/title>/i);
    expect(titleMatch?.[1] ?? "").not.toMatch(
      /\|\s*invest off-plan\s*\|\s*invest off-plan/i,
    );
    // Cap SERP budget (allow slight overshoot only if names are extreme).
    expect((titleMatch?.[1] ?? "").length).toBeLessThanOrEqual(70);
  });

  // #241 / #319 / #322 — unknown detail slugs must be real HTTP 404s (not 200
  // "… not found" soft shells). generateMetadata must call notFound(), not return
  // a soft title. Covers residual EN + AR routes beyond #319.
  test("unknown EN/AR detail slugs return hard 404 (no soft metadata titles)", async ({
    page,
  }) => {
    for (const path of [
      "/communities/definitely-not-a-real-community-xyz",
      "/developers/definitely-not-a-real-developer-xyz",
      "/news/definitely-not-a-real-article-xyz",
      "/guides/definitely-not-a-real-guide-xyz",
      "/projects/definitely-not-a-real-project-xyz",
      "/collections/definitely-not-a-real-collection-xyz",
      "/locations/definitely-not-a-real-location-xyz",
      "/faq/definitely-not-a-real-topic-xyz",
      "/reports/market/definitely-not-a-real-report-xyz",
      "/ar/communities/definitely-not-a-real-community-xyz",
      "/ar/developers/definitely-not-a-real-developer-xyz",
      "/ar/news/definitely-not-a-real-article-xyz",
      "/ar/guides/definitely-not-a-real-guide-xyz",
      "/ar/projects/definitely-not-a-real-project-xyz",
      "/ar/collections/definitely-not-a-real-collection-xyz",
      "/ar/locations/definitely-not-a-real-location-xyz",
      "/ar/faq/definitely-not-a-real-topic-xyz",
      "/ar/reports/market/definitely-not-a-real-report-xyz",
    ]) {
      const response = await page.goto(path, { waitUntil: "commit" });
      expect(response?.status(), path).toBe(404);
      const body = await response!.text();
      // Soft-404 entity titles must not win (EN).
      expect(body).not.toMatch(
        /<title>[^<]*(Community|Developer|Article|Guide|Project|Collection|FAQ|Report|Comparison) not found/i,
      );
      // Soft AR entity titles (not the real branded 404 "الصفحة غير موجودة").
      expect(body).not.toMatch(
        /<title>[^<]*(المشروع غير موجود|المجتمع غير موجود|المطوّر غير موجود|المقال غير موجود|الدليل غير موجود|مقارنة غير موجودة|التقرير غير موجود)/,
      );
      // Real branded not-found chrome must win.
      if (path.startsWith("/ar/")) {
        expect(body).toContain("الصفحة غير موجودة");
      } else {
        expect(body).toContain("Page not found");
      }
    }
  });

  // #243 — reverse pair order must 308 to alphabetical canonical (not 404 / soft-200).
  // Middleware 308s B-vs-A → A-vs-B; page permanentRedirect is a belt-and-braces.
  test("reverse area compare pair redirects to canonical order", async ({
    page,
    request,
  }) => {
    const reverse = "/compare/jumeirah-village-circle-vs-dubai-marina";
    const canonical = "/compare/dubai-marina-vs-jumeirah-village-circle";

    const bare = await request.fetch(reverse, { maxRedirects: 0 });
    expect([301, 308], `status for ${reverse}`).toContain(bare.status());
    expect(bare.headers()["location"] ?? "").toContain(canonical);

    const res = await page.goto(reverse, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain(canonical);
    // Final response body (after redirect follow).
    const body = await page.content();
    expect(body).toMatch(/Dubai Marina/i);
    expect(body).toMatch(/Jumeirah Village Circle/i);
  });

  // #245 — AR market-report hub must keep community print reports in /ar.
  test("AR market-report hub links stay on /ar/reports/market/*", async ({
    page,
  }) => {
    const res = await page.goto("/ar/market-report", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.ok()).toBeTruthy();
    const html = await page.content();
    expect(html).toMatch(/href="\/ar\/reports\/market\/[a-z0-9-]+"/);
    // Must not bounce Arabic users onto bare EN report paths.
    expect(html).not.toMatch(/href="\/reports\/market\/[a-z0-9-]+"/);

    const arReport = html.match(/href="(\/ar\/reports\/market\/[a-z0-9-]+)"/)?.[1];
    expect(arReport).toBeTruthy();
    const reportRes = await page.goto(arReport!, {
      waitUntil: "domcontentloaded",
    });
    expect(reportRes?.ok()).toBeTruthy();
    expect(page.url()).toContain("/ar/reports/market/");

    // #281 — AR report "back to community" must stay under /ar/communities/*.
    const reportHtml = await reportRes!.text();
    const communitySlug = arReport!.split("/").pop()!;
    expect(reportHtml).toContain(`href="/ar/communities/${communitySlug}"`);
    expect(reportHtml).not.toContain(`href="/communities/${communitySlug}"`);
  });

  // #289 — AR PDP living-in-area chrome must not hardcode EN.
  test("AR PDP living-in-area heading is Arabic", async ({ page }) => {
    const res = await page.goto("/ar/projects/105-residences", {
      waitUntil: "commit",
    });
    expect(res?.status()).toBe(200);
    const html = await res!.text();
    expect(html).toContain('lang="ar"');
    expect(html).toContain("العيش في");
    expect(html).not.toContain(">Living in <");
    expect(html).not.toContain("active off-plan launches with");
    expect(html).toMatch(/استكشف .+ ←/);
  });

  // #291 — AR community MarketAdvice CTA must not hardcode EN heading/context.
  test("AR community MarketAdvice heading and WhatsApp context are Arabic", async ({
    page,
  }) => {
    const res = await page.goto("/ar/communities/jumeirah-village-circle", {
      waitUntil: "commit",
    });
    expect(res?.status()).toBe(200);
    const html = await res!.text();
    expect(html).toContain('lang="ar"');
    expect(html).toContain("تفكر في");
    expect(html).not.toContain("Thinking about Jumeirah Village Circle?");
    expect(html).not.toContain("investing in Jumeirah Village Circle");
    expect(html).toContain("الاستثمار في");
  });

  // #252 — AR FAQ hub hero + topic cards must not stay English.
  test("AR FAQ hub H1 and topic cards are Arabic", async ({ page }) => {
    const res = await page.goto("/ar/faq", { waitUntil: "domcontentloaded" });
    expect(res?.ok()).toBeTruthy();
    const html = await page.content();
    // SSR body — avoid live-DOM flakes from Turnstile/hydration.
    expect(html).toMatch(/الأسئلة الشائعة/);
    expect(html).not.toMatch(/Frequently Asked Questions/);
    expect(html).not.toMatch(/Straight answers on buying off-plan/);
    expect(html).toMatch(/أساسيات العقارات على الخارطة/);
    expect(html).not.toMatch(/>Off-Plan Basics</);
  });

  // #253 — AR collection title + H1 must not stay English.
  test("AR collection pages use Arabic title and H1", async ({ page }) => {
    for (const { path, arH1, enH1 } of [
      {
        path: "/ar/collections/waterfront",
        arH1: "العيش على الواجهة المائية",
        enH1: "Waterfront living",
      },
      {
        path: "/ar/collections/dubai",
        arH1: "دبي على الخارطة",
        enH1: "Dubai off-plan",
      },
    ]) {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(res?.ok(), path).toBeTruthy();
      const html = await page.content();
      expect(html, path).toMatch(new RegExp(arH1));
      expect(html, path).not.toMatch(new RegExp(`<h1[^>]*>\\s*${enH1}`));
      // Meta title should not be the EN COLLECTION_PAGES string.
      expect(html, path).not.toMatch(
        /<title>Waterfront Off-Plan Projects in the UAE/i,
      );
      expect(html, path).not.toMatch(/<title>Off-Plan Projects in Dubai \|/i);
    }
  });

  // #368 — AR collection long-form intro body must not stay English.
  test("AR collection intro body uses Arabic (not EN editorial)", async ({
    page,
  }) => {
    const res = await page.goto("/ar/collections/studios", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.ok()).toBeTruthy();
    // PageShell wraps the page in #main-content; PageHero is also a <section>
    // inside that shell. Prefer the dedicated intro testid (#368 CI).
    const intro = page.getByTestId("collection-intro");
    await expect(intro).toBeVisible();
    const introText = await intro.innerText();
    // Ban distinctive EN COLLECTION_PAGES intro phrases (not catalog card copy).
    expect(introText).not.toContain("yield play of the off-plan market");
    expect(introText).not.toContain(
      "Investors buying purely on numbers usually start here",
    );
    // Positive: AR intro copy from dict.pages.collections.pages.studios.intro.
    expect(introText).toContain("رهان العائد");
    expect(introText).toContain("الاستوديوهات");
  });

  // FAQ topic detail residual — hub fixed in #252; topic H1/title still EN on main.
  test("AR FAQ topic page H1 and title use Arabic chrome", async ({ page }) => {
    const res = await page.goto("/ar/faq/off-plan-basics", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.ok()).toBeTruthy();
    const html = await page.content();
    expect(html).toMatch(/أساسيات العقارات على الخارطة/);
    expect(html).not.toMatch(/<h1[^>]*>\s*Off-Plan Basics/i);
    expect(html).not.toMatch(/<title>Off-Plan Basics/i);
  });

  // #262 — AR guide detail title + H1 from dict.pages.guides.cards, not EN GUIDE_CARDS.
  test("AR guide detail pages use Arabic title and H1", async ({ page }) => {
    const res = await page.goto("/ar/guides/understanding-payment-plans", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.ok()).toBeTruthy();
    const html = await page.content();
    expect(html).toMatch(/فهم خطط السداد/);
    expect(html).not.toMatch(/<title>Understanding Payment Plans/i);
    expect(html).not.toMatch(/>Understanding Payment Plans</);
  });
  // #263 — AR compare hubs: breadcrumbs use dict labels (not raw EN Home/Compare).
  test("AR compare-projects breadcrumbs are Arabic", async ({ page }) => {
    const res = await page.goto("/ar/compare-projects", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.ok()).toBeTruthy();
    const html = await page.content();
    expect(html).not.toMatch(/aria-label="[^"]*"[^>]*>[\s\S]*?>Home</i);
    expect(html).toMatch(/الرئيسية/);
  });

  // #269 — AR location guide document title must not stay EN guide.title.
  test("AR location guide pages use Arabic document title", async ({ page }) => {
    const res = await page.goto("/ar/locations/best-communities-for-families", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.ok()).toBeTruthy();
    const html = await page.content();
    expect(html).toMatch(/أفضل مجتمعات للعائلات/);
    expect(html).not.toMatch(
      /<title>Best Communities for Families in Dubai \(Off-Plan\)/i,
    );
  });

  // #315 — AR ranking secondary rationale lines from dict (not EN templates).
  test("AR location guide ranking rationale is Arabic", async ({ page }) => {
    const res = await page.goto("/ar/locations/best-communities-for-families", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.ok()).toBeTruthy();
    const html = await page.content();
    expect(html).toContain("خيار وحدة فلل أو منازل");
    expect(html).toContain("مشاريع نشطة");
    expect(html).not.toContain("unit options are villas or townhouses");
    expect(html).not.toContain("live projects");
  });

  // #311 — AR JSON-LD BreadcrumbList uses dict names + /ar absolute paths.
  test("AR news + locations BreadcrumbList JSON-LD stays in-locale", async ({
    page,
  }) => {
    const news = await page.goto(
      "/ar/news/golden-visa-threshold-off-plan-catalog",
      {
        waitUntil: "domcontentloaded",
      },
    );
    expect(news?.ok()).toBeTruthy();
    const newsHtml = await page.content();
    // Dict labels (not hard-coded EN Home/News).
    expect(newsHtml).toContain('"name":"الرئيسية"');
    expect(newsHtml).toContain('"name":"الأخبار"');
    expect(newsHtml).not.toContain('"name":"Home"');
    expect(newsHtml).not.toContain('"name":"News"');
    // Absolute URLs under /ar
    expect(newsHtml).toMatch(
      /"item":"https:\/\/investoffplan\.com\/ar\/news"/,
    );
    expect(newsHtml).toMatch(
      /"item":"https:\/\/investoffplan\.com\/ar"/,
    );
    // EN bare paths must not appear as breadcrumb items on AR.
    expect(newsHtml).not.toMatch(
      /"item":"https:\/\/investoffplan\.com\/news"/,
    );

    const loc = await page.goto(
      "/ar/locations/best-communities-for-families",
      { waitUntil: "domcontentloaded" },
    );
    expect(loc?.ok()).toBeTruthy();
    const locHtml = await page.content();
    expect(locHtml).toContain('"name":"الرئيسية"');
    expect(locHtml).toContain('"name":"أدلّة المواقع"');
    expect(locHtml).not.toContain('"name":"Location guides"');
    expect(locHtml).toMatch(
      /"item":"https:\/\/investoffplan\.com\/ar\/locations"/,
    );
    expect(locHtml).not.toMatch(
      /"item":"https:\/\/investoffplan\.com\/locations"/,
    );
  });

  // #260 — AR about CTA must stay on /ar/projects.
  test("AR about Get-started CTA stays on /ar/projects", async ({ page }) => {
    const res = await page.goto("/ar/about", { waitUntil: "domcontentloaded" });
    expect(res?.ok()).toBeTruthy();
    const html = await page.content();
    expect(html).toMatch(/href="\/ar\/projects"/);
    expect(html).toContain('href="/ar/projects"');
  });

  // #268 — related FAQ / guide back links must stay in-locale on AR.
  // Scope to <main> so header LanguageSwitcher EN mirror does not false-fail.
  test("AR FAQ topic and guide detail links stay under /ar", async ({ page }) => {
    const mainHtml = (html: string) => {
      const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, "");
      const m = stripped.match(/<main\b[\s\S]*?<\/main>/i);
      return m ? m[0] : stripped;
    };
    const anchors = (html: string, re: RegExp) =>
      [...html.matchAll(re)].map((m) => m[1]);

    const faq = await page.goto("/ar/faq/off-plan-basics", {
      waitUntil: "commit",
    });
    expect(faq?.status()).toBe(200);
    const faqMain = mainHtml(await faq!.text());
    const faqAnchors = anchors(
      faqMain,
      /<a\b[^>]*\bhref="(\/(?:ar\/)?faq\/[^"]+)"/gi,
    );
    // Related topic cards must be under /ar/faq/*
    expect(faqAnchors.filter((h) => h.startsWith("/ar/faq/")).length).toBeGreaterThan(0);
    // No bare EN topic links in main content (related cards).
    expect(faqAnchors.filter((h) => h.startsWith("/faq/"))).toEqual([]);

    const guide = await page.goto("/ar/guides/understanding-payment-plans", {
      waitUntil: "commit",
    });
    expect(guide?.status()).toBe(200);
    const guideMain = mainHtml(await guide!.text());
    const guideAnchors = anchors(
      guideMain,
      /<a\b[^>]*\bhref="(\/(?:ar\/)?guides[^"]*)"/gi,
    );
    // Back link to hub must be /ar/guides
    expect(
      guideAnchors.some((h) => h === "/ar/guides" || h.startsWith("/ar/guides?")),
    ).toBeTruthy();
    expect(
      guideAnchors.filter((h) => h === "/guides" || h.startsWith("/guides?")),
    ).toEqual([]);
  });

  // #327 — AR bed / unit-type chrome must not hardcode EN Studio / Unit type.
  test("AR PDP unit selector and market report bed labels are Arabic", async ({
    page,
  }) => {
    // Market report bed table (static SSR).
    const report = await page.goto("/ar/reports/market/dubai-marina", {
      waitUntil: "commit",
    });
    if (report?.status() === 200) {
      const html = await report.text();
      expect(html).toContain('lang="ar"');
      // Prefer AR studio token when bed table present; do not require if community has no bed stats.
      if (html.includes("نوع") || html.includes("استوديو") || html.includes("غرف")) {
        expect(html).not.toMatch(/>\s*Studio\s*</);
        expect(html).not.toMatch(/>\s*4\+ bed\s*</);
        expect(html).not.toMatch(/>\s*\d+ bed\s*</i);
      }
    }

    // PDP payment unit selector — locale prop forces AR dict on SSR (#327).
    const pdp = await page.goto("/ar/projects/105-residences", {
      waitUntil: "commit",
    });
    expect(pdp?.status()).toBe(200);
    const pdpHtml = await pdp!.text();
    expect(pdpHtml).toContain('lang="ar"');
    expect(pdpHtml).not.toContain(">Unit type<");
    // Multi-unit projects with a real payment plan render the selector.
    if (pdpHtml.includes('data-testid="pdp-unit-type-select"')) {
      expect(pdpHtml).toContain("نوع الوحدة");
      // Option labels use bedsLabel — no EN Studio / N Bed microcopy in options.
      expect(pdpHtml).not.toMatch(/<option[^>]*>\s*Studio\b/i);
      expect(pdpHtml).not.toMatch(/<option[^>]*>[^<]*\b1 Bed\b/i);
      expect(pdpHtml).not.toMatch(/<option[^>]*>[^<]*\b\d+ Beds\b/i);
    }
  });

});
