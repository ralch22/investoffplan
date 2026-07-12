import type { Dict } from "@/i18n";
import { bedsLabel, propertyTypeLabel } from "@/lib/format";
import { interpolate, type Locale } from "@/i18n/config";
import { developerBlurb } from "./figma-copy";
import type { DeveloperProjectCardData, Project, SortOption } from "./types";

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

export function projectBedsLabel(project: Project, dict: Dict): string | null {
  const beds = [...new Set(project.units.map((unit) => unit.beds))].sort(
    (a, b) => a - b,
  );
  if (beds.length === 0) return null;
  const min = beds[0];
  const max = beds[beds.length - 1];
  if (min === max) return bedsLabel(min, dict);
  const minLabel = min === 0 ? dict.format.beds.studio : String(min);
  const maxLabel = max === 0 ? dict.format.beds.studio : String(max);
  return interpolate(dict.format.beds.range, { min: minLabel, max: maxLabel });
}

export function projectTypeLabel(
  project: Project,
  dict: Dict,
  locale: Locale,
): string {
  const types = [...new Set(project.units.map((unit) => unit.propertyType))];
  if (types.length !== 1) return dict.format.multiple;
  return propertyTypeLabel(types[0], dict, locale);
}

/**
 * Project → card payload for developer grids. Drops PDP-only fields
 * (description, amenities, floorPlans, galleries, full unit rows) so RSC
 * props stay ~700 B/project instead of ~12 KB.
 */
export function toDeveloperProjectCardData(
  project: Project,
  dict: Dict,
  locale: Locale = "en",
): DeveloperProjectCardData {
  const positivePrices = project.units
    .map((unit) => unit.launchPriceAed)
    .filter((price) => price > 0);
  const minPriceAed = positivePrices.length
    ? Math.min(...positivePrices)
    : 0;
  const maxRaw = project.units.length
    ? Math.max(
        ...project.units.map(
          (unit) => unit.launchPriceMaxAed ?? unit.launchPriceAed,
        ),
      )
    : 0;
  const maxPriceAed =
    maxRaw > minPriceAed && minPriceAed > 0 ? maxRaw : undefined;

  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    developer: project.developer,
    developerLogo: project.developerLogo,
    city: project.city,
    area: project.area,
    locationFull: project.locationFull,
    status: project.status,
    handover: project.handover,
    paymentPlan: project.paymentPlan,
    imageUrl: project.imageUrl,
    imageGradient: project.imageGradient,
    whatsapp: project.whatsapp,
    minPriceAed,
    maxPriceAed,
    featuredRank: project.featuredRank,
    isPremium: project.isPremium,
    bedsLabel: projectBedsLabel(project, dict),
    typeLabel: projectTypeLabel(project, dict, locale),
  };
}

/** Sort card (or full) rows for developer project grids. */
export function sortDeveloperProjects<
  T extends Pick<
    DeveloperProjectCardData,
    | "minPriceAed"
    | "handover"
    | "status"
    | "featuredRank"
    | "isPremium"
    | "name"
  >,
>(projects: T[], sort: SortOption): T[] {
  const sorted = [...projects];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.minPriceAed - b.minPriceAed);
    case "price-desc":
      return sorted.sort((a, b) => b.minPriceAed - a.minPriceAed);
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