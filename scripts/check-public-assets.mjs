#!/usr/bin/env node
// Refuse to build if any git-tracked file under public/ is missing from the
// working tree. Catches the DrCleaner-style silent deletion that would
// otherwise ship an empty dist/ to production.

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

let tracked;
try {
  tracked = execSync("git ls-files -z public/", { encoding: "buffer" })
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
} catch (err) {
  console.error("check-public-assets: git ls-files failed:", err.message);
  process.exit(2);
}

const missing = tracked.filter((p) => !existsSync(resolve(p)));

if (missing.length === 0) process.exit(0);

console.error(
  `\n✘ check-public-assets: ${missing.length} tracked file(s) under public/ are missing from the working tree.\n`,
);
for (const p of missing.slice(0, 20)) console.error(`  - ${p}`);
if (missing.length > 20) console.error(`  … and ${missing.length - 20} more`);
console.error(
  `\nRestore with:  git checkout HEAD -- public/\n(Then investigate what deleted them — DrCleanerProPlus is a known culprit.)\n`,
);
process.exit(1);
