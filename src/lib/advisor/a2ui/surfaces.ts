/**
 * Which A2UI surfaces are switched on.
 *
 * `NEXT_PUBLIC_A2UI_SURFACES` is a comma-separated allow-list, inlined into the
 * client bundle at BUILD time (see `npm run build:production`) — a runtime
 * wrangler var alone would read as `undefined` in the browser.
 *
 * The default when the variable is UNSET is not uniform, and the split is the
 * point: **a surface is on by default if and only if it cannot spend money.**
 *
 *   - Deterministic surfaces (pdp, match, serp, share) compose from data the
 *     page already has. They cost nothing per render and degrade to the
 *     existing UI through the error boundary, so a build that predates the flag
 *     — or a dev/e2e run — should simply have them.
 *   - `ask` puts a model call behind a text box on the highest-traffic page in
 *     the site. Defaulting that ON because someone forgot an env var is exactly
 *     the kind of accident that empties a daily budget, so it must be asked for
 *     by name.
 *
 * When the variable IS set, exactly the listed tokens are enabled — so removing
 * one token is that surface's rollback, and `NEXT_PUBLIC_A2UI_SURFACES="none"`
 * disables everything.
 *
 * The chat-drawer surface is NOT governed here; it keeps its own
 * ADVISOR_A2UI / NEXT_PUBLIC_ADVISOR_A2UI pair.
 */
export type A2uiSurface = "pdp" | "match" | "serp" | "share" | "ask";

/** Free to render ⇒ on unless explicitly excluded. */
const DEFAULT_ON: ReadonlySet<A2uiSurface> = new Set([
  "pdp",
  "match",
  "serp",
  "share",
]);

const RAW = (process.env.NEXT_PUBLIC_A2UI_SURFACES ?? "").trim();

const ENABLED: ReadonlySet<string> = new Set(
  RAW.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

export function surfaceEnabled(name: A2uiSurface): boolean {
  if (!RAW) return DEFAULT_ON.has(name);
  return ENABLED.has(name);
}
