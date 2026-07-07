import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:3010",
    trace: "off",
  },

  webServer: {
    command: "npm run dev -- --port 3010",
    url: "http://127.0.0.1:3010/projects",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});