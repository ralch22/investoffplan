import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "4a75e91d6fca8bc58467fb80ce1b9c2e",
    databaseId: process.env.D1_DATABASE_ID ?? "e5aa2877-4359-4c28-8499-0c149200c6a4",
    token: process.env.CLOUDFLARE_API_TOKEN ?? "",
  },
});