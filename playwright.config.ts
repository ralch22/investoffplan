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

  // Two projects share ONE webServer (webServer is top-level, started once).
  // Split by path so the existing suite keeps its own per-test viewports and
  // the mobile suite gets real phone emulation without touching either.
  // Explicit chromium emulation rather than devices["iPhone 14"]: the device
  // presets set defaultBrowserType "webkit", and CI installs chromium only.
  projects: [
    {
      name: "desktop",
      testIgnore: /tests\/mobile\//,
    },
    {
      name: "mobile",
      testMatch: /tests\/mobile\/.*\.spec\.ts/,
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  webServer: {
    // Production server — avoids Turbopack dev-cache corruption during e2e.
    // CI already runs `npm run build` + D1 migrate/seed in workflow steps, so only
    // start the server there. Locally we still do the full prebuild→seed→build chain
    // so a cold `npx playwright test` works without extra setup.
    // D1 seed is required so /api/leads inserts and /api/catalog queries succeed.
    command: process.env.CI
      ? `npx next start --port ${E2E_PORT}`
      : `npm run prebuild && npm run db:migrate:local && npm run db:seed:local && NEXT_IS_BUILD=1 npm run build && npx next start --port ${E2E_PORT}`,
    url: `${E2E_BASE}/projects`,
    reuseExistingServer: !process.env.CI && process.env.PW_REUSE_SERVER === "1",
    timeout: process.env.CI ? 120_000 : 480_000,
  },
});