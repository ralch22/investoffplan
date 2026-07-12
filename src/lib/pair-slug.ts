/**
 * Compare pair URLs use a canonical unordered slug (alphabetical A-vs-B).
 * Reverse B-vs-A is the same comparison — emit both for static params and
 * permanentRedirect reverse hits to the canonical form (SEO + deep links).
 */

export const PAIR_SEP = "-vs-";

/** Swap sides of an `a-vs-b` slug. Returns null if not a valid pair form. */
export function reversePairSlug(slug: string): string | null {
  const idx = slug.indexOf(PAIR_SEP);
  if (idx <= 0) return null;
  const a = slug.slice(0, idx);
  const b = slug.slice(idx + PAIR_SEP.length);
  if (!a || !b || a === b) return null;
  return `${b}${PAIR_SEP}${a}`;
}

/** Expand canonical pair slugs with their reverse order (deduped). */
export function withReversePairSlugs(canonical: readonly string[]): string[] {
  const out = new Set<string>();
  for (const pair of canonical) {
    out.add(pair);
    const rev = reversePairSlug(pair);
    if (rev) out.add(rev);
  }
  return [...out];
}
