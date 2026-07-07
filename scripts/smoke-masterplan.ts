#!/usr/bin/env npx tsx
import { chromium } from "playwright";

async function main() {
  const pf = "emaar-properties/address-residences-zabeel";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`https://www.propertyfinder.ae/en/new-projects/${pf}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.waitForFunction(
    () => {
      const el = document.getElementById("__NEXT_DATA__");
      try {
        return !!JSON.parse(el!.textContent!).props?.pageProps?.detailResult?.id;
      } catch {
        return false;
      }
    },
    { timeout: 90000 },
  );
  const result = await page.evaluate(() => {
    const data = JSON.parse(document.getElementById("__NEXT_DATA__")!.textContent!);
    const dr = data.props.pageProps.detailResult;
    return {
      masterPlan: dr.masterPlan,
      brochure: Boolean(dr.brochureUrl),
    };
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});