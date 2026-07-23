/**
 * Which A2UI surfaces are switched on.
 *
 * `NEXT_PUBLIC_A2UI_SURFACES` is a comma-separated allow-list, inlined into the
 * client bundle at BUILD time (see `npm run build:production`) — a runtime
 * wrangler var alone would read as `undefined` in the browser.
 *
 * Semantics are deliberately fail-open for the deterministic surfaces: when the
 * variable is UNSET (dev, e2e, any build that predates the flag) every surface
 * below is enabled, because they cost nothing per render and degrade to the
 * existing UI through the error boundary. When it IS set, exactly the listed
 * tokens are enabled — so removing one token is the rollback for that surface,
 * and `NEXT_PUBLIC_A2UI_SURFACES="none"` disables them all.
 *
 * The chat-drawer surface is NOT governed here; it keeps its own
 * ADVISOR_A2UI / NEXT_PUBLIC_ADVISOR_A2UI pair.
 */
export type A2uiSurface = "pdp" | "match" | "serp";

const RAW = (process.env.NEXT_PUBLIC_A2UI_SURFACES ?? "").trim();

const ENABLED: ReadonlySet<string> = new Set(
  RAW.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

export function surfaceEnabled(name: A2uiSurface): boolean {
  if (!RAW) return true; // unset ⇒ all deterministic surfaces on
  return ENABLED.has(name);
}
