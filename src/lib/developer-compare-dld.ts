/**
 * DLD context for a developer page, aggregated ONLY through community keys.
 *
 * This is the boundary developer-compare.ts's header warns about:
 * developer-name matching against DLD records is unsafe (naming drift, JVs,
 * master-developer vs builder), so DLD numbers may reach a developer surface
 * exclusively via the communities the developer's CATALOG projects sit in —
 * "sold-price medians in the areas where {dev} builds", never "{dev}'s sold
 * prices". The lookup is injected so the unit test can pin exactly what gets
 * queried: community names, nothing else.
 *
 * Pure data logic, ZERO imports — safe for node:test (the developer-compare
 * module itself pulls the server-only catalog chain and cannot load there).
 */

export interface CommunityDldRow {
  community: string;
  medianPpsqft: number;
  saleSample: number;
}

export function communityDldRows(
  communities: string[],
  lookup: (areaName: string) => { medianPpsqft: number | null; saleSample: number } | null,
  limit = 4,
): CommunityDldRow[] {
  const rows: CommunityDldRow[] = [];
  for (const community of communities) {
    if (rows.length >= limit) break;
    const stats = lookup(community);
    if (!stats || stats.medianPpsqft == null || stats.medianPpsqft <= 0) continue;
    rows.push({
      community,
      medianPpsqft: Math.round(stats.medianPpsqft),
      saleSample: stats.saleSample,
    });
  }
  return rows;
}
