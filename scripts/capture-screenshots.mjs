import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import nodePath from "node:path";
import { fileURLToPath } from "node:url";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3010";
const outDir = nodePath.join(
  nodePath.dirname(fileURLToPath(import.meta.url)),
  "../screenshots",
);

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const viewports = [
  { name: "desktop", width: 1440, height: 1200 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 1000 },
];

for (const vp of viewports) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
  });
  await page.goto(`${base}/projects`, { waitUntil: "networkidle" });
  const filePath = nodePath.resolve(outDir, `${vp.name}.png`);
  await page.screenshot({
    path: filePath,
    fullPage: vp.name !== "desktop",
  });
  console.log(`saved screenshots/${vp.name}.png`);
}

await browser.close();