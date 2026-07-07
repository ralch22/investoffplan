import { execSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const sqlPath = join(root, ".tmp", "investoffplan-catalog-data.sql");
const tables = [
  "catalog_meta",
  "city_counts",
  "developer_serp_links",
  "developers",
  "projects",
  "project_units",
  "catalog_units",
];

function run(cmd) {
  console.log(`[db:seed:remote] ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

run(
  'npx wrangler d1 execute investoffplan-catalog --remote --command "DELETE FROM catalog_units; DELETE FROM project_units; DELETE FROM projects; DELETE FROM developers; DELETE FROM developer_serp_links; DELETE FROM city_counts; DELETE FROM catalog_meta;"',
);

const tableFlags = tables.map((table) => `--table ${table}`).join(" ");
run(
  `npx wrangler d1 export investoffplan-catalog --local --output ${sqlPath} --no-schema ${tableFlags}`,
);
run(`npx wrangler d1 execute investoffplan-catalog --remote --file=${sqlPath}`);

console.log("[db:seed:remote] Remote D1 seeded from local export.");