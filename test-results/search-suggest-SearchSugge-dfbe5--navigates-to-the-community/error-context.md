# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search-suggest.spec.ts >> SearchSuggest typeahead >> hero: 'jvc' shows a Communities group and ↓+Enter navigates to the community
- Location: tests/search-suggest.spec.ts:15:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://127.0.0.1:3010/projects?q=jvc"
  navigated to "http://127.0.0.1:3010/projects"
  navigated to "http://127.0.0.1:3010/projects?q=jvc"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]: Off-Plan Projects for Sale in Dubai & the UAE | invest off-plan
  - generic [ref=e4]:
    - link "Skip to content" [ref=e5] [cursor=pointer]:
      - /url: "#main-content"
    - banner [ref=e6]:
      - generic [ref=e7]:
        - link "invest off-plan" [ref=e8] [cursor=pointer]:
          - /url: /
          - img "invest off-plan" [ref=e9]
        - navigation "Main" [ref=e10]:
          - link "Projects" [ref=e11] [cursor=pointer]:
            - /url: /projects
          - button "Communities" [ref=e12]:
            - text: Communities
            - img [ref=e13]
          - link "Developers" [ref=e15] [cursor=pointer]:
            - /url: /developers
          - button "Data & Tools" [ref=e16]:
            - text: Data & Tools
            - img [ref=e17]
          - button "Insights" [ref=e19]:
            - text: Insights
            - img [ref=e20]
          - link "Compare" [ref=e22] [cursor=pointer]:
            - /url: /compare
        - generic [ref=e23]:
          - button "Open search" [ref=e25]:
            - img [ref=e26]
          - link "Favorites" [ref=e29] [cursor=pointer]:
            - /url: /favorites
            - generic [ref=e30]: Favorites
          - link "Area Properties" [ref=e32] [cursor=pointer]:
            - /url: /communities
            - text: Area Properties
            - img [ref=e33]
          - link "العربية" [ref=e35] [cursor=pointer]:
            - /url: /ar/projects
          - button "Sign in" [ref=e37]
          - group "Currency" [ref=e38]:
            - button "AED" [pressed] [ref=e39]
            - button "USD" [ref=e40]
    - main [ref=e41]:
      - generic [ref=e44]:
        - heading "Search Results" [level=1] [ref=e45]:
          - text: Search
          - emphasis [ref=e46]: Results
        - paragraph [ref=e47]: Properties in UAE
      - main [ref=e48]:
        - generic [ref=e51]:
          - generic [ref=e52]:
            - text: Search
            - searchbox "Search" [ref=e53]: jvc
          - generic [ref=e54]:
            - text: Property type
            - combobox "Property type" [ref=e55]:
              - option "All types" [selected]
              - option "Apartment"
              - option "Villa"
              - option "Townhouse"
              - option "Penthouse"
          - generic [ref=e56]:
            - text: Beds
            - combobox "Beds" [ref=e57]:
              - option "Any" [selected]
              - option "Studio"
              - option "1 Bed"
              - option "2 Beds"
              - option "3 Beds"
              - option "4 Beds"
              - option "5+ Beds"
          - generic [ref=e58]:
            - text: Max price (AED)
            - combobox "Max price (AED)" [ref=e59]:
              - option "Any" [selected]
              - option "Up to 1.5M"
              - option "Up to 2.5M"
              - option "Up to 4M"
          - button "More filters" [ref=e60]
          - button "Save search" [ref=e63]:
            - img [ref=e64]
            - text: Save search
        - generic [ref=e67]:
          - generic [ref=e68]:
            - heading "2,241 Total unit options in UAE" [level=2] [ref=e69]
            - paragraph [ref=e70]: 0 results · Updated 7 Jul 2026
          - generic [ref=e71]:
            - generic [ref=e72]:
              - button "Grid" [ref=e73]
              - button "List" [ref=e74]
              - button "Map" [ref=e75]
            - button "Show project view" [ref=e76]
            - generic [ref=e77]:
              - generic [ref=e78]: "Sort by:"
              - combobox "Sort by:" [ref=e79]:
                - option "Featured" [selected]
                - 'option "Price: Low to High"'
                - 'option "Price: High to Low"'
                - option "Best value (AED/sqft)"
                - 'option "Handover: Soonest"'
                - 'option "Handover: Latest"'
        - generic [ref=e80]:
          - group "Filter by city" [ref=e81]:
            - button "All UAE(2241)" [pressed] [ref=e82]:
              - text: All UAE
              - generic [ref=e83]: (2241)
            - button "Dubai(1786)" [ref=e84]:
              - text: Dubai
              - generic [ref=e85]: (1786)
            - button "Ras Al Khaimah(164)" [ref=e86]:
              - text: Ras Al Khaimah
              - generic [ref=e87]: (164)
            - button "Abu Dhabi(155)" [ref=e88]:
              - text: Abu Dhabi
              - generic [ref=e89]: (155)
            - button "Sharjah(53)" [ref=e90]:
              - text: Sharjah
              - generic [ref=e91]: (53)
            - button "Umm Al Quwain(53)" [ref=e92]:
              - text: Umm Al Quwain
              - generic [ref=e93]: (53)
            - button "Ajman(25)" [ref=e94]:
              - text: Ajman
              - generic [ref=e95]: (25)
            - button "Fujairah(5)" [ref=e96]:
              - text: Fujairah
              - generic [ref=e97]: (5)
          - generic [ref=e98]:
            - button "All" [ref=e99]
            - button "Premium" [ref=e100]
            - button "Brochure PDF" [ref=e101]
            - button "Video" [ref=e102]
            - button "Virtual tour" [ref=e103]
            - button "Under AED 2M" [ref=e104]
            - button "Studio" [ref=e105]
            - button "Waterfront" [ref=e106]
        - generic [ref=e108]:
          - generic [ref=e109]:
            - img [ref=e110]
            - text: Compare
          - generic [ref=e112]: Select up to 3 units to compare
        - generic [ref=e114]:
          - paragraph [ref=e115]: No units match your filters
          - paragraph [ref=e116]: Try clearing beds, price, or city filters.
          - button "Clear all filters" [ref=e117]
        - generic [ref=e118]:
          - heading "Top developers with live stock" [level=2] [ref=e119]
          - paragraph [ref=e120]: Project counts synced from Property Finder developer pages
          - generic [ref=e121]:
            - link "Emaar Properties logo Emaar Properties 222 projects online" [ref=e122] [cursor=pointer]:
              - /url: /developers/emaar-properties
              - img "Emaar Properties logo" [ref=e123]
              - generic [ref=e124]:
                - paragraph [ref=e125]: Emaar Properties
                - paragraph [ref=e126]: 222 projects online
            - link "Damac Properties logo Damac Properties 169 projects online" [ref=e127] [cursor=pointer]:
              - /url: /developers/damac-properties
              - img "Damac Properties logo" [ref=e128]
              - generic [ref=e129]:
                - paragraph [ref=e130]: Damac Properties
                - paragraph [ref=e131]: 169 projects online
            - link "Azizi Developments logo Azizi Developments 112 projects online" [ref=e132] [cursor=pointer]:
              - /url: /developers/azizi-developments
              - img "Azizi Developments logo" [ref=e133]
              - generic [ref=e134]:
                - paragraph [ref=e135]: Azizi Developments
                - paragraph [ref=e136]: 112 projects online
            - link "Aldar Properties PJSC logo Aldar Properties PJSC 106 projects online" [ref=e137] [cursor=pointer]:
              - /url: /developers/aldar-properties-pjsc
              - img "Aldar Properties PJSC logo" [ref=e138]
              - generic [ref=e139]:
                - paragraph [ref=e140]: Aldar Properties PJSC
                - paragraph [ref=e141]: 106 projects online
            - link "Sobha Realty logo Sobha Realty 81 projects online" [ref=e142] [cursor=pointer]:
              - /url: /developers/sobha-realty
              - img "Sobha Realty logo" [ref=e143]
              - generic [ref=e144]:
                - paragraph [ref=e145]: Sobha Realty
                - paragraph [ref=e146]: 81 projects online
            - link "Ellington logo Ellington 74 projects online" [ref=e147] [cursor=pointer]:
              - /url: /developers/ellington
              - img "Ellington logo" [ref=e148]
              - generic [ref=e149]:
                - paragraph [ref=e150]: Ellington
                - paragraph [ref=e151]: 74 projects online
            - link "Binghatti Developers logo Binghatti Developers 70 projects online" [ref=e152] [cursor=pointer]:
              - /url: /developers/binghatti-developers
              - img "Binghatti Developers logo" [ref=e153]
              - generic [ref=e154]:
                - paragraph [ref=e155]: Binghatti Developers
                - paragraph [ref=e156]: 70 projects online
            - link "Nakheel logo Nakheel 67 projects online" [ref=e157] [cursor=pointer]:
              - /url: /developers/nakheel
              - img "Nakheel logo" [ref=e158]
              - generic [ref=e159]:
                - paragraph [ref=e160]: Nakheel
                - paragraph [ref=e161]: 67 projects online
            - link "Meraas Holding logo Meraas Holding 63 projects online" [ref=e162] [cursor=pointer]:
              - /url: /developers/meraas-holding
              - img "Meraas Holding logo" [ref=e163]
              - generic [ref=e164]:
                - paragraph [ref=e165]: Meraas Holding
                - paragraph [ref=e166]: 63 projects online
            - link "Samana Developers logo Samana Developers 52 projects online" [ref=e167] [cursor=pointer]:
              - /url: /developers/samana-developers
              - img "Samana Developers logo" [ref=e168]
              - generic [ref=e169]:
                - paragraph [ref=e170]: Samana Developers
                - paragraph [ref=e171]: 52 projects online
            - link "ARADA logo ARADA 47 projects online" [ref=e172] [cursor=pointer]:
              - /url: /developers/arada
              - img "ARADA logo" [ref=e173]
              - generic [ref=e174]:
                - paragraph [ref=e175]: ARADA
                - paragraph [ref=e176]: 47 projects online
            - link "Imtiaz Developments logo Imtiaz Developments 44 projects online" [ref=e177] [cursor=pointer]:
              - /url: /developers/imtiaz-developments
              - img "Imtiaz Developments logo" [ref=e178]
              - generic [ref=e179]:
                - paragraph [ref=e180]: Imtiaz Developments
                - paragraph [ref=e181]: 44 projects online
        - generic [ref=e182]:
          - heading "Projects by Known Developers in UAE" [level=2] [ref=e183]
          - generic [ref=e184]:
            - link "Emaar Properties logo Emaar Properties" [ref=e185] [cursor=pointer]:
              - /url: /developers/emaar-properties
              - img "Emaar Properties logo" [ref=e186]
              - generic [ref=e187]: Emaar Properties
            - link "Damac Properties logo Damac Properties" [ref=e188] [cursor=pointer]:
              - /url: /developers/damac-properties
              - img "Damac Properties logo" [ref=e189]
              - generic [ref=e190]: Damac Properties
            - link "Azizi Developments logo Azizi Developments" [ref=e191] [cursor=pointer]:
              - /url: /developers/azizi-developments
              - img "Azizi Developments logo" [ref=e192]
              - generic [ref=e193]: Azizi Developments
            - link "Aldar Properties PJSC logo Aldar Properties PJSC" [ref=e194] [cursor=pointer]:
              - /url: /developers/aldar-properties-pjsc
              - img "Aldar Properties PJSC logo" [ref=e195]
              - generic [ref=e196]: Aldar Properties PJSC
            - link "Sobha Realty logo Sobha Realty" [ref=e197] [cursor=pointer]:
              - /url: /developers/sobha-realty
              - img "Sobha Realty logo" [ref=e198]
              - generic [ref=e199]: Sobha Realty
            - link "Ellington logo Ellington" [ref=e200] [cursor=pointer]:
              - /url: /developers/ellington
              - img "Ellington logo" [ref=e201]
              - generic [ref=e202]: Ellington
            - link "Binghatti Developers logo Binghatti Developers" [ref=e203] [cursor=pointer]:
              - /url: /developers/binghatti-developers
              - img "Binghatti Developers logo" [ref=e204]
              - generic [ref=e205]: Binghatti Developers
            - link "Nakheel logo Nakheel" [ref=e206] [cursor=pointer]:
              - /url: /developers/nakheel
              - img "Nakheel logo" [ref=e207]
              - generic [ref=e208]: Nakheel
            - link "Meraas Holding logo Meraas Holding" [ref=e209] [cursor=pointer]:
              - /url: /developers/meraas-holding
              - img "Meraas Holding logo" [ref=e210]
              - generic [ref=e211]: Meraas Holding
            - link "Samana Developers logo Samana Developers" [ref=e212] [cursor=pointer]:
              - /url: /developers/samana-developers
              - img "Samana Developers logo" [ref=e213]
              - generic [ref=e214]: Samana Developers
            - link "ARADA logo ARADA" [ref=e215] [cursor=pointer]:
              - /url: /developers/arada
              - img "ARADA logo" [ref=e216]
              - generic [ref=e217]: ARADA
            - link "Imtiaz Developments logo Imtiaz Developments" [ref=e218] [cursor=pointer]:
              - /url: /developers/imtiaz-developments
              - img "Imtiaz Developments logo" [ref=e219]
              - generic [ref=e220]: Imtiaz Developments
    - contentinfo [ref=e221]:
      - generic [ref=e223]:
        - generic [ref=e224]:
          - img [ref=e225]
          - generic [ref=e227]:
            - paragraph [ref=e228]:
              - text: Off‑Plan
              - text: Newsletter.
            - paragraph [ref=e229]: Exclusive insights on the latest off-plan opportunities.
        - form "Newsletter signup" [ref=e231]:
          - textbox [ref=e232]
          - generic [ref=e233]:
            - textbox "Name" [ref=e235]:
              - /placeholder: Name...
            - textbox "Phone" [ref=e236]:
              - /placeholder: Phone...
          - textbox "Email" [ref=e238]:
            - /placeholder: Email...
          - generic [ref=e239] [cursor=pointer]:
            - checkbox "Opt-in to receive WhatsApp exclusives" [ref=e240]
            - text: Opt-in to receive WhatsApp exclusives
          - button "Submit" [ref=e244]:
            - text: Submit
            - img [ref=e245]
      - generic [ref=e247]:
        - generic [ref=e248]:
          - generic [ref=e249]:
            - img [ref=e250]
            - generic [ref=e252]:
              - img "invest off-plan" [ref=e253]
              - navigation [ref=e254]:
                - link "Projects" [ref=e255] [cursor=pointer]:
                  - /url: /projects
                - link "Developers" [ref=e256] [cursor=pointer]:
                  - /url: /developers
                - link "Communities" [ref=e257] [cursor=pointer]:
                  - /url: /communities
                - link "Locations" [ref=e258] [cursor=pointer]:
                  - /url: /locations
                - link "Compare" [ref=e259] [cursor=pointer]:
                  - /url: /compare
                - link "Data toolkit" [ref=e260] [cursor=pointer]:
                  - /url: /tools
                - link "Map" [ref=e261] [cursor=pointer]:
                  - /url: /map
                - link "Guides" [ref=e262] [cursor=pointer]:
                  - /url: /guides
                - link "News" [ref=e263] [cursor=pointer]:
                  - /url: /news
                - link "FAQ" [ref=e264] [cursor=pointer]:
                  - /url: /faq
                - link "About" [ref=e265] [cursor=pointer]:
                  - /url: /about
                - link "Contact" [ref=e266] [cursor=pointer]:
                  - /url: /contact
          - generic [ref=e267]:
            - generic [ref=e268]:
              - paragraph [ref=e269]: Guides
              - list [ref=e270]:
                - listitem [ref=e271]:
                  - link "Buying Off-Plan" [ref=e272] [cursor=pointer]:
                    - /url: /guides/why-invest-off-plan-dubai
                - listitem [ref=e273]:
                  - link "Finding the Right Developer" [ref=e274] [cursor=pointer]:
                    - /url: /developers
                - listitem [ref=e275]:
                  - link "Understanding Payment Plans" [ref=e276] [cursor=pointer]:
                    - /url: /guides/understanding-payment-plans
                - listitem [ref=e277]:
                  - link "Off-Plan for Foreign Investors" [ref=e278] [cursor=pointer]:
                    - /url: /guides/foreign-investor-guide
                - listitem [ref=e279]:
                  - link "Acquiring the Golden Visa" [ref=e280] [cursor=pointer]:
                    - /url: /faq/golden-visa
            - generic [ref=e281]:
              - paragraph [ref=e282]: Collections
              - list [ref=e283]:
                - listitem [ref=e284]:
                  - link "Waterfront Projects" [ref=e285] [cursor=pointer]:
                    - /url: /collections/waterfront
                - listitem [ref=e286]:
                  - link "Branded Residences" [ref=e287] [cursor=pointer]:
                    - /url: /collections/branded
                - listitem [ref=e288]:
                  - link "Under AED 2M" [ref=e289] [cursor=pointer]:
                    - /url: /collections/under-2m
                - listitem [ref=e290]:
                  - link "Dubai Off-Plan" [ref=e291] [cursor=pointer]:
                    - /url: /collections/dubai
                - listitem [ref=e292]:
                  - link "Ras Al Khaimah" [ref=e293] [cursor=pointer]:
                    - /url: /collections/ras-al-khaimah
        - generic [ref=e294]:
          - generic [ref=e295]:
            - generic [ref=e296]:
              - generic [ref=e297]: "Telephone: +971 44 321 620"
              - generic [ref=e298]: "Email: info@investoffplan.com"
              - generic [ref=e299]: "Address: Business Bay, Dubai"
              - generic [ref=e300]: ARLO PROPERTIES L.L.C · ORN 50276 · DED 1493767
            - generic [ref=e301]:
              - link "Privacy" [ref=e302] [cursor=pointer]:
                - /url: /privacy-policy
              - link "Cookies" [ref=e303] [cursor=pointer]:
                - /url: /cookie-policy
          - paragraph [ref=e305]: © 2026 invest off-plan · Operated by ARLO PROPERTIES L.L.C · DED licence 1493767 · RERA ORN 50276 — a licensed real estate brokerage in Dubai
    - button "Off-Plan Advisor" [ref=e306]:
      - img [ref=e307]
      - generic [ref=e309]: Off-Plan Advisor
```

# Test source

```ts
  1   | import type { Page } from "@playwright/test";
  2   | import { test, expect } from "./fixtures";
  3   | 
  4   | const SEARCH_LABEL = "Search the catalog";
  5   | 
  6   | /** Focus + type into the (visible) suggest combobox and wait for the listbox. */
  7   | async function typeQuery(page: Page, text: string) {
  8   |   const input = page.getByRole("combobox", { name: SEARCH_LABEL }).first();
  9   |   await input.click();
  10  |   await input.fill(text);
  11  |   return input;
  12  | }
  13  | 
  14  | test.describe("SearchSuggest typeahead", () => {
  15  |   test("hero: 'jvc' shows a Communities group and ↓+Enter navigates to the community", async ({
  16  |     page,
  17  |   }) => {
  18  |     await page.goto("/");
  19  |     const input = await typeQuery(page, "jvc");
  20  |     const listbox = page.getByRole("listbox").first();
  21  |     await expect(listbox).toBeVisible();
  22  |     // Communities group header + JVC option (index built after first focus).
  23  |     await expect(listbox.getByText("Communities", { exact: true })).toBeVisible({
  24  |       timeout: 15_000,
  25  |     });
  26  |     await expect(
  27  |       listbox.getByRole("option", { name: /Jumeirah Village Circle/i }).first(),
  28  |     ).toBeVisible();
  29  |     await input.press("ArrowDown");
  30  |     await input.press("Enter");
> 31  |     await page.waitForURL(/\/communities\/jumeirah-village-circle/, { timeout: 15_000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  32  |   });
  33  | 
  34  |   test("hero: 'jvc under 1m' shows a smart row and clicking it applies maxP", async ({
  35  |     page,
  36  |   }) => {
  37  |     await page.goto("/");
  38  |     await typeQuery(page, "jvc under 1m");
  39  |     const listbox = page.getByRole("listbox").first();
  40  |     await expect(listbox).toBeVisible();
  41  |     const smartRow = listbox.getByRole("option", { name: /results/ }).first();
  42  |     await expect(smartRow).toBeVisible({ timeout: 15_000 });
  43  |     await smartRow.click();
  44  |     await page.waitForURL(/maxP=1000000/, { timeout: 15_000 });
  45  |   });
  46  | 
  47  |   test("header search on /guides opens and suggests", async ({ page }) => {
  48  |     await page.setViewportSize({ width: 1280, height: 900 });
  49  |     await page.goto("/guides");
  50  |     await page.getByRole("button", { name: "Open search" }).click();
  51  |     const input = page.getByRole("combobox", { name: SEARCH_LABEL });
  52  |     await expect(input).toBeVisible();
  53  |     await input.fill("emaar");
  54  |     const listbox = page.getByRole("listbox").first();
  55  |     await expect(listbox).toBeVisible();
  56  |     await expect(
  57  |       listbox.getByRole("option", { name: /emaar/i }).first(),
  58  |     ).toBeVisible({ timeout: 15_000 });
  59  |   });
  60  | 
  61  |   test("Escape closes the listbox", async ({ page }) => {
  62  |     await page.goto("/");
  63  |     const input = await typeQuery(page, "dubai");
  64  |     await expect(page.getByRole("listbox").first()).toBeVisible();
  65  |     await input.press("Escape");
  66  |     await expect(page.getByRole("listbox")).toHaveCount(0);
  67  |     await expect(input).toHaveAttribute("aria-expanded", "false");
  68  |   });
  69  | 
  70  |   test("regression: plain text + Enter with no highlight routes to /projects?q=", async ({
  71  |     page,
  72  |   }) => {
  73  |     await page.goto("/");
  74  |     const input = await typeQuery(page, "lorem ipsum tower");
  75  |     await input.press("Enter");
  76  |     await page.waitForURL(/\/projects\?q=lorem(\+|%20)ipsum(\+|%20)tower/, {
  77  |       timeout: 15_000,
  78  |     });
  79  |   });
  80  | 
  81  |   test("mobile: bottom tab-bar search sheet suggests for 'damac'", async ({ page }) => {
  82  |     await page.setViewportSize({ width: 390, height: 844 });
  83  |     await page.goto("/");
  84  |     await page
  85  |       .getByRole("navigation", { name: "Primary" })
  86  |       .getByRole("button", { name: "Search" })
  87  |       .click();
  88  |     // Scope to the open sheet dialog — the hero combobox is also mounted.
  89  |     const input = page
  90  |       .getByRole("dialog")
  91  |       .getByRole("combobox", { name: SEARCH_LABEL });
  92  |     await expect(input).toBeVisible();
  93  |     await input.fill("damac");
  94  |     const listbox = page.getByRole("dialog").getByRole("listbox").first();
  95  |     await expect(listbox).toBeVisible();
  96  |     await expect(
  97  |       listbox.getByRole("option", { name: /damac/i }).first(),
  98  |     ).toBeVisible({ timeout: 15_000 });
  99  |   });
  100 | });
  101 | 
```