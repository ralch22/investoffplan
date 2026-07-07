import { readFileSync } from "node:fs";
import { join } from "node:path";

const target = process.argv[2] ?? "preview";
const root = process.cwd();

const configs = {
  preview: {
    file: "wrangler.jsonc",
    siteUrl: "https://investoffplan-preview.emerge-digital.workers.dev",
    workerName: "investoffplan-preview",
  },
  production: {
    file: "wrangler.production.jsonc",
    siteUrl: "https://investoffplan.com",
    workerName: "investoffplan",
  },
};

const cfg = configs[target];
if (!cfg) {
  console.error(`[verify-deploy] Unknown target "${target}". Use preview or production.`);
  process.exit(1);
}

const raw = readFileSync(join(root, cfg.file), "utf8");
const siteUrlMatch = raw.match(/"NEXT_PUBLIC_SITE_URL"\s*:\s*"([^"]+)"/);
const nameMatch = raw.match(/"name"\s*:\s*"([^"]+)"/);

const siteUrl = siteUrlMatch?.[1];
const workerName = nameMatch?.[1];

let ok = true;

if (workerName !== cfg.workerName) {
  console.error(`[verify-deploy] Expected worker name "${cfg.workerName}", found "${workerName ?? "missing"}".`);
  ok = false;
}

if (siteUrl !== cfg.siteUrl) {
  console.error(
    `[verify-deploy] Expected NEXT_PUBLIC_SITE_URL "${cfg.siteUrl}", found "${siteUrl ?? "missing"}".`,
  );
  ok = false;
}

const catalogMatch = raw.match(/"NEXT_PUBLIC_CATALOG_API"\s*:\s*"([^"]+)"/);
const catalogApi = catalogMatch?.[1];
if (catalogApi !== "1") {
  console.error(`[verify-deploy] Expected NEXT_PUBLIC_CATALOG_API "1", found "${catalogApi ?? "missing"}".`);
  ok = false;
}

if (target === "production" && raw.includes("// \"routes\"")) {
  console.warn(
    "[verify-deploy] Production routes are still commented out — uncomment in wrangler.production.jsonc when the zone is live.",
  );
}

if (!ok) process.exit(1);

console.log(`[verify-deploy] ${target} config OK (${workerName} → ${siteUrl})`);