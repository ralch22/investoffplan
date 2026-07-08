import { notFound } from "next/navigation";

/**
 * With multiple root layouts (route groups), unmatched URLs would otherwise
 * fall through to Next's bare default 404. This catch-all routes them into
 * the (en) tree so the branded not-found page renders.
 */
export default function CatchAllNotFound() {
  notFound();
}
