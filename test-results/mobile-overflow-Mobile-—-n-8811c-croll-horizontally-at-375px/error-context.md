# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile-overflow.spec.ts >> Mobile — no horizontal overflow >> /developers does not scroll horizontally at 375px
- Location: tests/mobile-overflow.spec.ts:12:9

# Error details

```
Error: /developers: 400px content in 375px viewport

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 377
Received:    400
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - link "Skip to content" [ref=e4] [cursor=pointer]:
      - /url: "#main-content"
    - banner [ref=e5]:
      - generic [ref=e6]:
        - link "invest off-plan" [ref=e7] [cursor=pointer]:
          - /url: /
          - img "invest off-plan" [ref=e8]
        - generic [ref=e9]:
          - link "Favorites" [ref=e10] [cursor=pointer]:
            - /url: /favorites
            - img [ref=e11]
          - link "العربية" [ref=e13] [cursor=pointer]:
            - /url: /ar/developers
          - group "Currency" [ref=e14]:
            - button "AED" [pressed] [ref=e15]
            - button "USD" [ref=e16]
          - button "Open menu" [ref=e17]:
            - img [ref=e18]
    - main [ref=e20]:
      - generic [ref=e23]:
        - heading "Top Real Estate Developers in UAE" [level=1] [ref=e24]
        - paragraph [ref=e25]: 214 developers with live off-plan stock
      - main [ref=e26]:
        - generic [ref=e27]:
          - generic [ref=e28]:
            - generic [ref=e29]:
              - heading "Top 5 Developers" [level=2] [ref=e30]
              - paragraph [ref=e31]: Ranked by live catalog unit options
            - group "Chart metric" [ref=e32]:
              - button "By units" [pressed] [ref=e33]
              - button "By projects" [ref=e34]
          - generic [ref=e35]:
            - generic [ref=e36]:
              - link "Emaar Properties logo Emaar Properties" [ref=e37] [cursor=pointer]:
                - /url: /developers/emaar-properties
                - img "Emaar Properties logo" [ref=e38]
                - generic [ref=e39]: Emaar Properties
              - generic [ref=e42]: "#1"
              - paragraph [ref=e43]: "790"
            - generic [ref=e44]:
              - link "Sobha Realty logo Sobha Realty" [ref=e45] [cursor=pointer]:
                - /url: /developers/sobha-realty
                - img "Sobha Realty logo" [ref=e46]
                - generic [ref=e47]: Sobha Realty
              - generic [ref=e50]: "#2"
              - paragraph [ref=e51]: "69"
            - generic [ref=e52]:
              - link "Object 1 logo Object 1" [ref=e53] [cursor=pointer]:
                - /url: /developers/object-1
                - img "Object 1 logo" [ref=e54]
                - generic [ref=e55]: Object 1
              - generic [ref=e58]: "#3"
              - paragraph [ref=e59]: "61"
            - generic [ref=e60]:
              - link "Damac Properties logo Damac Properties" [ref=e61] [cursor=pointer]:
                - /url: /developers/damac-properties
                - img "Damac Properties logo" [ref=e62]
                - generic [ref=e63]: Damac Properties
              - generic [ref=e66]: "#4"
              - paragraph [ref=e67]: "51"
            - generic [ref=e68]:
              - link "Aldar Properties PJSC logo Aldar Properties PJSC" [ref=e69] [cursor=pointer]:
                - /url: /developers/aldar-properties-pjsc
                - img "Aldar Properties PJSC logo" [ref=e70]
                - generic [ref=e71]: Aldar Properties PJSC
              - generic [ref=e74]: "#5"
              - paragraph [ref=e75]: "47"
        - generic [ref=e77]:
          - generic [ref=e78]:
            - paragraph [ref=e79]: 214 developers
            - generic [ref=e80]:
              - generic [ref=e81]: Search developers
              - searchbox "Search developers" [ref=e82]
          - group "Filter by city" [ref=e84]:
            - button "All UAE(214)" [pressed] [ref=e85]:
              - text: All UAE
              - generic [ref=e86]: (214)
            - button "Dubai(160)" [ref=e87]:
              - text: Dubai
              - generic [ref=e88]: (160)
            - button "Ras Al Khaimah(29)" [ref=e89]:
              - text: Ras Al Khaimah
              - generic [ref=e90]: (29)
            - button "Abu Dhabi(24)" [ref=e91]:
              - text: Abu Dhabi
              - generic [ref=e92]: (24)
            - button "Sharjah(7)" [ref=e93]:
              - text: Sharjah
              - generic [ref=e94]: (7)
            - button "Umm Al Quwain(2)" [ref=e95]:
              - text: Umm Al Quwain
              - generic [ref=e96]: (2)
            - button "Ajman(5)" [ref=e97]:
              - text: Ajman
              - generic [ref=e98]: (5)
            - button "Fujairah(1)" [ref=e99]:
              - text: Fujairah
              - generic [ref=e100]: (1)
          - list [ref=e101]:
            - listitem [ref=e102]:
              - link "Emaar Properties logo" [ref=e103] [cursor=pointer]:
                - /url: /developers/emaar-properties
                - img "Emaar Properties logo" [ref=e104]
              - generic [ref=e105]:
                - paragraph [ref=e106]: Founded in 1997
                - heading "Emaar Properties" [level=3] [ref=e107]:
                  - link "Emaar Properties" [ref=e108] [cursor=pointer]:
                    - /url: /developers/emaar-properties
                - paragraph [ref=e109]: Emaar, a real estate giant founded in 1997 , is renowned for Burj Khalifa and Dubai Mall. Emaar offers different properties built to the highest standards. Their mission is to shape the future for everyone.
                - paragraph [ref=e110]: 222 projects · 790 unit options
              - link "Show projects" [ref=e111] [cursor=pointer]:
                - /url: /developers/emaar-properties
            - listitem [ref=e112]:
              - link "Sobha Realty logo" [ref=e113] [cursor=pointer]:
                - /url: /developers/sobha-realty
                - img "Sobha Realty logo" [ref=e114]
              - generic [ref=e115]:
                - paragraph [ref=e116]: Founded in 1976
                - heading "Sobha Realty" [level=3] [ref=e117]:
                  - link "Sobha Realty" [ref=e118] [cursor=pointer]:
                    - /url: /developers/sobha-realty
                - paragraph [ref=e119]: Sobha Realty is a leading global developer since 1976 known for designing royal facilities, mosques, and signature projects. Created master communities such as Sobha Hartland, offering diverse building styles and properties.
                - paragraph [ref=e120]: 29 projects · 69 unit options
              - link "Show projects" [ref=e121] [cursor=pointer]:
                - /url: /developers/sobha-realty
            - listitem [ref=e122]:
              - link "Object 1 logo" [ref=e123] [cursor=pointer]:
                - /url: /developers/object-1
                - img "Object 1 logo" [ref=e124]
              - generic [ref=e125]:
                - heading "Object 1" [level=3] [ref=e126]:
                  - link "Object 1" [ref=e127] [cursor=pointer]:
                    - /url: /developers/object-1
                - paragraph [ref=e128]: Step-by-step guide to purchasing off-plan property in Dubai. From choosing a project to handover.
                - paragraph [ref=e129]: 18 projects · 61 unit options
              - link "Show projects" [ref=e130] [cursor=pointer]:
                - /url: /developers/object-1
            - listitem [ref=e131]:
              - link "Damac Properties logo" [ref=e132] [cursor=pointer]:
                - /url: /developers/damac-properties
                - img "Damac Properties logo" [ref=e133]
              - generic [ref=e134]:
                - paragraph [ref=e135]: Founded in 2002
                - heading "Damac Properties" [level=3] [ref=e136]:
                  - link "Damac Properties" [ref=e137] [cursor=pointer]:
                    - /url: /developers/damac-properties
                - paragraph [ref=e138]: Founded in 2002, DAMAC has shaped the Middle East by providing luxurious projects in desirable locations. Offering a varied portfolio that includes skyscrapers, communities, and branded apartments for everyone.
                - paragraph [ref=e139]: 19 projects · 51 unit options
              - link "Show projects" [ref=e140] [cursor=pointer]:
                - /url: /developers/damac-properties
            - listitem [ref=e141]:
              - link "Aldar Properties PJSC logo" [ref=e142] [cursor=pointer]:
                - /url: /developers/aldar-properties-pjsc
                - img "Aldar Properties PJSC logo" [ref=e143]
              - generic [ref=e144]:
                - paragraph [ref=e145]: Founded in 2004
                - heading "Aldar Properties PJSC" [level=3] [ref=e146]:
                  - link "Aldar Properties PJSC" [ref=e147] [cursor=pointer]:
                    - /url: /developers/aldar-properties-pjsc
                - paragraph [ref=e148]: Aldar Properties is Abu Dhabi's premier developer founded in 2004, shaping world-class communities with a wide range of properties to choose from. Famous for creating luxurious living experiences.
                - paragraph [ref=e149]: 17 projects · 47 unit options
              - link "Show projects" [ref=e150] [cursor=pointer]:
                - /url: /developers/aldar-properties-pjsc
            - listitem [ref=e151]:
              - link "Ellington logo" [ref=e152] [cursor=pointer]:
                - /url: /developers/ellington
                - img "Ellington logo" [ref=e153]
              - generic [ref=e154]:
                - paragraph [ref=e155]: Founded in 2014
                - heading "Ellington" [level=3] [ref=e156]:
                  - link "Ellington" [ref=e157] [cursor=pointer]:
                    - /url: /developers/ellington
                - paragraph [ref=e158]: Founded in 2014, Ellington, with their joined experience, crafted lifestyles in luxury villas and apartments such as Belgravia and more. Accomplished by exceptional artistic talent and architectural design.
                - paragraph [ref=e159]: 14 projects · 36 unit options
              - link "Show projects" [ref=e160] [cursor=pointer]:
                - /url: /developers/ellington
            - listitem [ref=e161]:
              - link "RAK Properties logo" [ref=e162] [cursor=pointer]:
                - /url: /developers/rak-properties
                - img "RAK Properties logo" [ref=e163]
              - generic [ref=e164]:
                - heading "RAK Properties" [level=3] [ref=e165]:
                  - link "RAK Properties" [ref=e166] [cursor=pointer]:
                    - /url: /developers/rak-properties
                - paragraph [ref=e167]: Step-by-step guide to purchasing off-plan property in Dubai. From choosing a project to handover.
                - paragraph [ref=e168]: 10 projects · 32 unit options
              - link "Show projects" [ref=e169] [cursor=pointer]:
                - /url: /developers/rak-properties
            - listitem [ref=e170]:
              - link "Nakheel logo" [ref=e171] [cursor=pointer]:
                - /url: /developers/nakheel
                - img "Nakheel logo" [ref=e172]
              - generic [ref=e173]:
                - paragraph [ref=e174]: Founded in 2000
                - heading "Nakheel" [level=3] [ref=e175]:
                  - link "Nakheel" [ref=e176] [cursor=pointer]:
                    - /url: /developers/nakheel
                - paragraph [ref=e177]: Nakheel is a creative developer in Dubai. Changing the city's skyline with marvels wonders. A Portfolio of master communities and residential properties.Known for their landmarks including Park Jumeirah and Palm Jumeirah.
                - paragraph [ref=e178]: 18 projects · 31 unit options
              - link "Show projects" [ref=e179] [cursor=pointer]:
                - /url: /developers/nakheel
            - listitem [ref=e180]:
              - link "Meraas Holding logo" [ref=e181] [cursor=pointer]:
                - /url: /developers/meraas-holding
                - img "Meraas Holding logo" [ref=e182]
              - generic [ref=e183]:
                - paragraph [ref=e184]: Founded in 2007
                - heading "Meraas Holding" [level=3] [ref=e185]:
                  - link "Meraas Holding" [ref=e186] [cursor=pointer]:
                    - /url: /developers/meraas-holding
                - paragraph [ref=e187]: Meraas was established in 2007. Famous for the Bluewaters Island and City Walk. Aims to establish Dubai as the preferred global location for real estate investment and offer a variety of home options to suit all lifestyles.
                - paragraph [ref=e188]: 7 projects · 31 unit options
              - link "Show projects" [ref=e189] [cursor=pointer]:
                - /url: /developers/meraas-holding
            - listitem [ref=e190]:
              - link "Alef Group logo" [ref=e191] [cursor=pointer]:
                - /url: /developers/alef-group
                - img "Alef Group logo" [ref=e192]
              - generic [ref=e193]:
                - heading "Alef Group" [level=3] [ref=e194]:
                  - link "Alef Group" [ref=e195] [cursor=pointer]:
                    - /url: /developers/alef-group
                - paragraph [ref=e196]: Step-by-step guide to purchasing off-plan property in Dubai. From choosing a project to handover.
                - paragraph [ref=e197]: 15 projects · 29 unit options
              - link "Show projects" [ref=e198] [cursor=pointer]:
                - /url: /developers/alef-group
            - listitem [ref=e199]:
              - link "Reportage Real Estate logo" [ref=e200] [cursor=pointer]:
                - /url: /developers/reportage-real-estate
                - img "Reportage Real Estate logo" [ref=e201]
              - generic [ref=e202]:
                - heading "Reportage Real Estate" [level=3] [ref=e203]:
                  - link "Reportage Real Estate" [ref=e204] [cursor=pointer]:
                    - /url: /developers/reportage-real-estate
                - paragraph [ref=e205]: Step-by-step guide to purchasing off-plan property in Dubai. From choosing a project to handover.
                - paragraph [ref=e206]: 9 projects · 28 unit options
              - link "Show projects" [ref=e207] [cursor=pointer]:
                - /url: /developers/reportage-real-estate
            - listitem [ref=e208]:
              - link "Imtiaz Developments logo" [ref=e209] [cursor=pointer]:
                - /url: /developers/imtiaz-developments
                - img "Imtiaz Developments logo" [ref=e210]
              - generic [ref=e211]:
                - paragraph [ref=e212]: Founded in 1993
                - heading "Imtiaz Developments" [level=3] [ref=e213]:
                  - link "Imtiaz Developments" [ref=e214] [cursor=pointer]:
                    - /url: /developers/imtiaz-developments
                - paragraph [ref=e215]: One of the top real estate companies in Dubai, Imtiaz Developments has created numerous residential properties. They innovate by anticipating market trends and offering expertise across various real estate sectors.
                - paragraph [ref=e216]: 9 projects · 26 unit options
              - link "Show projects" [ref=e217] [cursor=pointer]:
                - /url: /developers/imtiaz-developments
          - navigation "Pagination" [ref=e218]:
            - button "Prev" [disabled] [ref=e219]
            - button "1" [ref=e220]
            - button "2" [ref=e221]
            - button "3" [ref=e222]
            - button "4" [ref=e223]
            - button "5" [ref=e224]
            - button "6" [ref=e225]
            - button "7" [ref=e226]
            - button "Next" [ref=e227]
      - generic [ref=e229]:
        - heading "Book a Consultation with an Off-Plan Expert." [level=2] [ref=e230]
        - link "Book a Consultation" [ref=e231] [cursor=pointer]:
          - /url: /contact
          - text: Book a Consultation
          - img [ref=e232]
    - contentinfo [ref=e234]:
      - generic [ref=e236]:
        - generic [ref=e237]:
          - img [ref=e238]
          - generic [ref=e240]:
            - paragraph [ref=e241]:
              - text: Off‑Plan
              - text: Newsletter.
            - paragraph [ref=e242]: Exclusive insights on the latest off-plan opportunities.
        - form "Newsletter signup" [ref=e244]:
          - textbox [ref=e245]
          - generic [ref=e246]:
            - textbox "Name" [ref=e248]:
              - /placeholder: Name...
            - textbox "Phone" [ref=e249]:
              - /placeholder: Phone...
          - textbox "Email" [ref=e251]:
            - /placeholder: Email...
          - generic [ref=e252] [cursor=pointer]:
            - checkbox "Opt-in to receive WhatsApp exclusives" [ref=e253]
            - text: Opt-in to receive WhatsApp exclusives
          - button "Submit" [ref=e257]:
            - text: Submit
            - img [ref=e258]
      - generic [ref=e260]:
        - generic [ref=e261]:
          - generic [ref=e262]:
            - img [ref=e263]
            - generic [ref=e265]:
              - img "invest off-plan" [ref=e266]
              - navigation [ref=e267]:
                - link "Projects" [ref=e268] [cursor=pointer]:
                  - /url: /projects
                - link "Developers" [ref=e269] [cursor=pointer]:
                  - /url: /developers
                - link "Communities" [ref=e270] [cursor=pointer]:
                  - /url: /communities
                - link "Locations" [ref=e271] [cursor=pointer]:
                  - /url: /locations
                - link "Market Report" [ref=e272] [cursor=pointer]:
                  - /url: /market-report
                - link "Compare" [ref=e273] [cursor=pointer]:
                  - /url: /compare
                - link "Data toolkit" [ref=e274] [cursor=pointer]:
                  - /url: /tools
                - link "Map" [ref=e275] [cursor=pointer]:
                  - /url: /map
                - link "Guides" [ref=e276] [cursor=pointer]:
                  - /url: /guides
                - link "News" [ref=e277] [cursor=pointer]:
                  - /url: /news
                - link "FAQ" [ref=e278] [cursor=pointer]:
                  - /url: /faq
                - link "About" [ref=e279] [cursor=pointer]:
                  - /url: /about
                - link "Contact" [ref=e280] [cursor=pointer]:
                  - /url: /contact
          - generic [ref=e281]:
            - generic [ref=e282]:
              - paragraph [ref=e283]: Guides
              - list [ref=e284]:
                - listitem [ref=e285]:
                  - link "Buying Off-Plan" [ref=e286] [cursor=pointer]:
                    - /url: /guides/why-invest-off-plan-dubai
                - listitem [ref=e287]:
                  - link "Finding the Right Developer" [ref=e288] [cursor=pointer]:
                    - /url: /developers
                - listitem [ref=e289]:
                  - link "Understanding Payment Plans" [ref=e290] [cursor=pointer]:
                    - /url: /guides/understanding-payment-plans
                - listitem [ref=e291]:
                  - link "Off-Plan for Foreign Investors" [ref=e292] [cursor=pointer]:
                    - /url: /guides/foreign-investor-guide
                - listitem [ref=e293]:
                  - link "Acquiring the Golden Visa" [ref=e294] [cursor=pointer]:
                    - /url: /faq/golden-visa
            - generic [ref=e295]:
              - paragraph [ref=e296]: Collections
              - list [ref=e297]:
                - listitem [ref=e298]:
                  - link "Waterfront Projects" [ref=e299] [cursor=pointer]:
                    - /url: /collections/waterfront
                - listitem [ref=e300]:
                  - link "Branded Residences" [ref=e301] [cursor=pointer]:
                    - /url: /collections/branded
                - listitem [ref=e302]:
                  - link "Under AED 2M" [ref=e303] [cursor=pointer]:
                    - /url: /collections/under-2m
                - listitem [ref=e304]:
                  - link "Dubai Off-Plan" [ref=e305] [cursor=pointer]:
                    - /url: /collections/dubai
                - listitem [ref=e306]:
                  - link "Ras Al Khaimah" [ref=e307] [cursor=pointer]:
                    - /url: /collections/ras-al-khaimah
        - generic [ref=e308]:
          - generic [ref=e309]:
            - generic [ref=e310]:
              - generic [ref=e311]: "Telephone: +971 44 321 620"
              - generic [ref=e312]: "Email: info@investoffplan.com"
              - generic [ref=e313]: "Address: Business Bay, Dubai"
              - generic [ref=e314]: ARLO PROPERTIES L.L.C · ORN 50276 · DED 1493767
            - generic [ref=e315]:
              - link "Privacy" [ref=e316] [cursor=pointer]:
                - /url: /privacy-policy
              - link "Cookies" [ref=e317] [cursor=pointer]:
                - /url: /cookie-policy
          - paragraph [ref=e319]: © 2026 invest off-plan · Operated by ARLO PROPERTIES L.L.C · DED licence 1493767 · RERA ORN 50276 — a licensed real estate brokerage in Dubai
    - button "Off-Plan Advisor" [ref=e320]:
      - img [ref=e321]
    - navigation "Primary" [ref=e323]:
      - generic [ref=e324]:
        - link "Explore" [ref=e325] [cursor=pointer]:
          - /url: /projects
          - img [ref=e326]
          - text: Explore
        - link "Areas" [ref=e330] [cursor=pointer]:
          - /url: /communities
          - img [ref=e331]
          - text: Areas
        - button "Search" [ref=e335]:
          - img [ref=e336]
          - text: Search
        - link "Compare" [ref=e339] [cursor=pointer]:
          - /url: /compare
          - img [ref=e340]
          - text: Compare
        - link "Saved" [ref=e343] [cursor=pointer]:
          - /url: /favorites
          - img [ref=e345]
          - text: Saved
  - alert [ref=e347]
```

# Test source

```ts
  1  | import { test, expect } from "./fixtures";
  2  | 
  3  | // Regression guard: no horizontal scroll at mobile width. A grid with responsive
  4  | // column counts (e.g. `grid lg:grid-cols-3`) but NO base `grid-cols-1` sizes its
  5  | // single implicit column to the content max-content on mobile, overflowing the
  6  | // viewport. This asserts document.scrollWidth stays within the viewport.
  7  | const MOBILE = { width: 375, height: 812 };
  8  | const PAGES = ["/", "/projects", "/developers", "/tools/roi", "/communities"];
  9  | 
  10 | test.describe("Mobile — no horizontal overflow", () => {
  11 |   for (const path of PAGES) {
  12 |     test(`${path} does not scroll horizontally at 375px`, async ({ page }) => {
  13 |       await page.setViewportSize(MOBILE);
  14 |       await page.goto(path, { waitUntil: "domcontentloaded" });
  15 |       // Let layout settle (fonts/images can nudge width briefly).
  16 |       await page.waitForTimeout(400);
  17 |       const { scrollW, clientW } = await page.evaluate(() => ({
  18 |         scrollW: document.documentElement.scrollWidth,
  19 |         clientW: document.documentElement.clientWidth,
  20 |       }));
  21 |       // 2px tolerance for sub-pixel rounding.
> 22 |       expect(scrollW, `${path}: ${scrollW}px content in ${clientW}px viewport`).toBeLessThanOrEqual(
     |                                                                                 ^ Error: /developers: 400px content in 375px viewport
  23 |         clientW + 2,
  24 |       );
  25 |     });
  26 |   }
  27 | });
  28 | 
```