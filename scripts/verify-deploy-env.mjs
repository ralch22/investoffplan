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
const catalogMatch = raw.match(/"NEXT_PUBLIC_CATALOG_API"\s*:\s*"([^"]*)"/);

const siteUrl = siteUrlMatch?.[1];
const workerName = nameMatch?.[1];
const catalogApi = catalogMatch?.[1];

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

if (catalogApi !== "1") {
  console.error(`[verify-deploy] Expected NEXT_PUBLIC_CATALOG_API "1", found "${catalogApi ?? "missing"}".`);
  ok = false;
}

const hasD1 = /"d1_databases"\s*:/.test(raw) && /"binding"\s*:\s*"DB"/.test(raw);
if (!hasD1) {
  console.error(`[verify-deploy] D1 "DB" binding missing in ${cfg.file}.`);
  ok = false;
}

const hasR2Assets = /"r2_buckets"\s*:/.test(raw) && /ASSETS_R2_BUCKET/.test(raw);
if (!hasR2Assets) {
  console.error(`[verify-deploy] R2 "ASSETS_R2_BUCKET" binding missing in ${cfg.file}.`);
  ok = false;
}

if (target === "production" && raw.includes("// \"routes\"")) {
  console.warn(
    "[verify-deploy] Production routes are still commented out — uncomment in wrangler.production.jsonc when the zone is live.",
  );
}

if (!ok) process.exit(1);

console.log(`[verify-deploy] ${target} config OK (${workerName} → ${siteUrl})`);