import { notFound } from "next/navigation";

/**
 * Catch-all inside the (ar) tree so unmatched /ar/* URLs render the Arabic
 * not-found boundary instead of falling through to the EN root catch-all.
 * Keeps Arabic 404s in-locale (RTL chrome + Arabic copy).
 */
export default function ArabicCatchAllNotFound() {
  notFound();
}
