import type { Project } from "@/lib/types";
import { cityLabel, formatBeds } from "@/lib/format";

/**
 * Generated, catalog-fact-grounded project FAQs — replaces rendering the
 * verbatim Property Finder FAQ text (duplicate-content risk). Deterministic
 * per project with slug-seeded phrasing variety.
 */

const GOLDEN_VISA_THRESHOLD = 2_000_000;

function seedIndex(slug: string, options: number): number {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % options;
}

export function buildProjectFaqs(project: Project): Array<{ q: string; a: string }> {
  const prices = project.units.map((u) => u.launchPriceAed).filter((v) => v > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const beds = [...new Set(project.units.map((u) => u.beds))].sort((a, b) => a - b);
  const bedsLabel =
    beds.length > 1
      ? `${formatBeds(beds[0])} to ${formatBeds(beds[beds.length - 1])}`
      : beds.length
        ? formatBeds(beds[0])
        : "";
  const faqs: Array<{ q: string; a: string }> = [];

  if (minPrice > 0) {
    const qv = [
      `What do apartments at ${project.name} cost?`,
      `What are launch prices at ${project.name}?`,
      `How much does a unit in ${project.name} cost?`,
    ];
    faqs.push({
      q: qv[seedIndex(project.slug, qv.length)],
      a: `Launch prices at ${project.name} start from AED ${minPrice.toLocaleString("en-US")}${bedsLabel ? ` for ${bedsLabel} residences` : ""}. Unit-level pricing for every available layout is listed in the unit table above, refreshed weekly from live inventory.`,
    });
  }

  if (project.handover) {
    faqs.push({
      q: `When will ${project.name} be completed?`,
      a: `${project.name} by ${project.developer} has a published handover target of ${project.handover}. Off-plan completion dates can move — the timeline section above reflects the developer's latest stated schedule.`,
    });
  }

  if (project.paymentPlan) {
    const isPostHandover = project.paymentPlan.split("/").length >= 4;
    faqs.push({
      q: `What payment plan is offered at ${project.name}?`,
      a: `The published structure is ${project.paymentPlan}${isPostHandover ? ", which includes a post-handover component — part of the price is paid after you receive the keys" : ""}. Use the payment calculator on this page to model the instalments against your budget.`,
    });
  }

  if (minPrice > 0) {
    faqs.push({
      q: `Does buying in ${project.name} qualify for a UAE Golden Visa?`,
      a:
        minPrice >= GOLDEN_VISA_THRESHOLD
          ? `Entry pricing at ${project.name} is at or above the AED 2M property threshold commonly used for 10-year Golden Visa eligibility. Confirm current criteria and documentation with the relevant authority before structuring a purchase around the visa.`
          : `Units from AED ${minPrice.toLocaleString("en-US")} sit below the AED 2M Golden Visa threshold, but higher-priced layouts in the project may qualify. Eligibility rules evolve — verify current criteria before committing.`,
    });
  }

  faqs.push({
    q: `Who is the developer behind ${project.name}?`,
    a: `${project.name} is developed by ${project.developer} in ${project.area}, ${cityLabel(project.city)}. See the developer page for their full off-plan portfolio and track record on this platform.`,
  });

  return faqs;
}
