import { developerBlurb } from "./figma-copy";
import type { Project, SortOption } from "./types";

/**
 * PF project names often already end with "By {developer}" ("Nesba 1 By
 * Arada") — composing "{name} by {developer}" then doubles it ("Nesba 1 By
 * Arada by ARADA", live in 54 projects' meta/OG/JSON-LD). Strip the trailing
 * developer mention (case-insensitive) before appending our own.
 */
export function stripTrailingDeveloper(name: string, developer: string): string {
  const esc = developer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return name.replace(new RegExp(`\\s+by\\s+${esc}\\s*$`, "i"), "").trim() || name;
}

export function stripDeveloperHtml(html?: string): string | undefined {
  if (!html) return undefined;
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseFoundedYear(establishedSince?: string): number | undefined {
  if (!establishedSince) return undefined;
  const year = Number(establishedSince.slice(0, 4));
  return Number.isFinite(year) ? year : undefined;
}

export function developerDescription(
  slug: string,
  description?: string,
): string {
  const stripped = stripDeveloperHtml(description);
  if (stripped) return stripped;
  return developerBlurb(slug);
}

function handoverValue(handover?: string): number {
  if (!handover) return 9999;
  const match = handover.match(/Q(\d)\s+(\d{4})/);
  if (!match) return 9999;
  return Number(match[2]) * 10 + Number(match[1]);
}

function projectMinPrice(project: Project): number {
  return Math.min(...project.units.map((unit) => unit.launchPriceAed));
}

export function sortDeveloperProjects(
  projects: Project[],
  sort: SortOption,
): Project[] {
  const sorted = [...projects];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => projectMinPrice(a) - projectMinPrice(b));
    case "price-desc":
      return sorted.sort((a, b) => projectMinPrice(b) - projectMinPrice(a));
    case "handover-asc":
      return sorted.sort(
        (a, b) => handoverValue(a.handover) - handoverValue(b.handover),
      );
    case "handover-desc":
      return sorted.sort(
        (a, b) => handoverValue(b.handover) - handoverValue(a.handover),
      );
    default:
      return sorted.sort((a, b) => {
        if (a.status === "sold-out" && b.status !== "sold-out") return 1;
        if (b.status === "sold-out" && a.status !== "sold-out") return -1;
        const rankA = a.featuredRank ?? 999;
        const rankB = b.featuredRank ?? 999;
        if (rankA !== rankB) return rankA - rankB;
        if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }
}

export function projectBedsLabel(project: Project): string | null {
  const beds = [...new Set(project.units.map((unit) => unit.beds))].sort(
    (a, b) => a - b,
  );
  if (beds.length === 0) return null;
  const min = beds[0];
  const max = beds[beds.length - 1];
  if (min === max) {
    if (min === 0) return "Studio";
    return min === 1 ? "1 Bed" : `${min} Beds`;
  }
  const minLabel = min === 0 ? "Studio" : String(min);
  const maxLabel = max === 0 ? "Studio" : String(max);
  return `${minLabel} - ${maxLabel} Beds`;
}

export function projectTypeLabel(project: Project): string {
  const types = [...new Set(project.units.map((unit) => unit.propertyType))];
  if (types.length !== 1) return "Multiple";
  const type = types[0];
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function developerFaqs(
  name: string,
  projectCount: number,
  cities: string[],
  foundedYear?: number,
): Array<{ q: string; a: string }> {
  const cityList =
    cities.length > 0
      ? cities.map((city) => city.replace(/-/g, " ")).join(", ")
      : "the UAE";
  return [
    {
      q: `How many off-plan projects does ${name} have?`,
      a: `${name} has ${projectCount.toLocaleString()} off-plan project${projectCount === 1 ? "" : "s"} listed on invest off-plan with unit-level launch pricing and brochures.`,
    },
    foundedYear
      ? {
          q: `When was ${name} founded?`,
          a: `${name} was founded in ${foundedYear} and remains one of the UAE's most active master developers.`,
        }
      : {
          q: `Who is ${name}?`,
          a: `${name} is a UAE real estate developer with active off-plan inventory across ${cityList}.`,
        },
    {
      q: `Where does ${name} build?`,
      a: `Current listings span ${cityList}. Use the project grid above to filter by location, handover, and launch price.`,
    },
    {
      q: `How do I enquire about ${name} projects?`,
      a: `Use WhatsApp on any project card or contact our team via email. We can share brochures, payment plans, and availability for ${name} launches.`,
    },
  ];
}