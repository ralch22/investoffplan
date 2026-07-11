import { LICENSE } from "@/content/trust";

/**
 * Content-gated license line. Renders NOTHING until real ORN + DED numbers
 * exist in src/content/trust.ts — invented license numbers cannot ship.
 * No hooks, so it works inside both server and client trees (e.g. the footer).
 */
export function LicenseBadge({ className }: { className?: string }) {
  if (!LICENSE.orn || !LICENSE.ded) return null;

  return (
    <span dir="ltr" className={`text-xs text-current ${className ?? ""}`.trim()}>
      {LICENSE.label ? `${LICENSE.label} · ` : ""}
      ORN {LICENSE.orn} &middot; DED {LICENSE.ded}
    </span>
  );
}
