// e2e webServer wrapper: runs `next start` and filters Next 16's benign
// "Internal: NoFallbackError" stderr noise.
//
// Next 16 logs `Error: Internal: NoFallbackError` (plus a 2-line internal stack)
// for EVERY request to a `dynamicParams = false` dynamic route with a
// non-prerendered param — even though it then serves a correct HTTP 404. The
// e2e suite hits these deliberately (content.spec.ts asserts unknown EN/AR
// detail slugs are hard 404s), so a warmup burst of this internal error drowns
// out genuine server errors in CI output. It is cosmetic: the 404s are correct
// and this is NOT tied to any test failure. We drop just that block and forward
// everything else verbatim.
//
// Next is spawned directly (not via `npx`/a shell) so SIGTERM/SIGINT propagate
// cleanly and Playwright's webServer teardown never orphans a next-server on
// the port.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import readline from "node:readline";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, "start", ...process.argv.slice(2)], {
  stdio: ["inherit", "inherit", "pipe"],
  env: process.env,
});

const rl = readline.createInterface({ input: child.stderr });
let skipping = false;
rl.on("line", (line) => {
  if (/Error: Internal: NoFallbackError/.test(line)) {
    skipping = true; // drop this line + its indented internal stack frames
    return;
  }
  if (skipping && /^\s+at\s/.test(line)) return;
  skipping = false;
  process.stderr.write(line + "\n");
});

for (const sig of ["SIGTERM", "SIGINT", "SIGHUP"]) {
  process.on(sig, () => child.kill(sig));
}
child.on("exit", (code, signal) => process.exit(signal ? 1 : code ?? 0));
