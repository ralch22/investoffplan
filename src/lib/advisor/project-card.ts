import type { Project } from "@/lib/types";
import type { AdvisorCard } from "./types";

/**
 * Pure Project → AdvisorCard mapping.
 *
 * Extracted from `tools.ts` (which pulls the D1 client and the catalog query
 * layer) so the page-surface composers can reuse it and stay unit-testable
 * without a database. `tools.ts` re-exports it, so there is still one
 * definition of what a grounded card contains.
 */
export function projectBeds(project: Project): number[] | undefined {
  const beds = [...new Set((project.units ?? []).map((u) => u.beds))].sort(
    (a, b) => a - b,
  );
  return beds.length ? beds : undefined;
}

export function projectToCard(project: Project): AdvisorCard {
  const prices = (project.units ?? [])
    .map((u) => u.launchPriceAed)
    .filter((v) => v > 0);
  return {
    slug: project.slug,
    name: project.name,
    developer: project.developer,
    area: project.area,
    imageUrl: project.imageUrl,
    fromPriceAed: prices.length ? Math.min(...prices) : undefined,
    handover: project.handover,
    beds: projectBeds(project),
    paymentPlan: project.paymentPlan,
  };
}
