import { defineConfig } from "@playwright/test";

const E2E_PORT = 3010;
const E2E_BASE = `http://127.0.0.1:${E2E_PORT}`;

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: E2E_BASE,
    trace: "off",
  },

  webServer: {
    // Production server — avoids Turbopack dev-cache corruption during e2e.
    // D1 migrations + seed are required so /api/leads inserts and /api/catalog
    // queries (isCatalogDbSeeded on catalog_meta) succeed instead of 500s.
    command: `npm run prebuild && npm run db:migrate:local && npm run db:seed:local && NEXT_IS_BUILD=1 npm run build && npx next start --port ${E2E_PORT}`,
    url: `${E2E_BASE}/projects`,
    reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    timeout: 300_000,
  },
});