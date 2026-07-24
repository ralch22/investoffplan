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

/** EN-only compact bed chip for LLM tool facts (not UI chrome). */
export function bedsFactLabel(beds: number[]): string {
  const label = (b: number) => (b === 0 ? "Studio" : `${b}BR`);
  return beds.length === 1
    ? label(beds[0])
    : `${label(beds[0])}–${label(beds[beds.length - 1])}`;
}

/**
 * One-line fact sheet for a project — the grounded text the advisor's tool
 * loop feeds the model, and the MCP server returns to agents. Pure, so both
 * workers can import it without dragging in D1 or OpenNext.
 */
export function projectFacts(project: Project): string {
  const card = projectToCard(project);
  return [
    `${project.name} (slug: ${project.slug}) by ${project.developer} in ${project.area}, ${project.city}.`,
    card.fromPriceAed ? `From AED ${card.fromPriceAed.toLocaleString("en-US")}.` : "",
    card.beds?.length ? `Bedrooms: ${bedsFactLabel(card.beds)}.` : "",
    project.handover ? `Handover: ${project.handover}.` : "",
    project.paymentPlan ? `Payment plan: ${project.paymentPlan}.` : "",
    project.ownershipType ? `Ownership: ${project.ownershipType}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
