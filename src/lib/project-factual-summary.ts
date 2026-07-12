import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { interpolate } from "@/i18n/config";
import { bedsLabel, cityLabel, formatPrice } from "@/lib/format";
import type { Project } from "@/lib/types";

/**
 * Build a FACTUAL, verified-claims-only "About" paragraph for thin PDPs that
 * carry no description / descriptionUnique / enrichment summary (dev-fallback
 * and other no-copy projects). Composes 1–4 sentences from ONLY stated catalog
 * fields — it NEVER invents amenities, ratings, or features. A clause is emitted
 * only when its underlying data exists, so nothing ever renders "AED 0",
 * "undefined", or an empty clause.
 *
 * Fully localized: sentences are assembled from dictionary templates
 * (`pdp.factualSummary.*`) so the AR PDP gets an Arabic summary. Prices flow
 * through the shared `formatPrice` (Western digits + "AED"), matching the rest
 * of the site's price rendering in both locales.
 */
export function buildFactualSummary(
  project: Project,
  locale: Locale = "en",
): string | undefined {
  const dict = getDictionary(locale);
  const t = dict.pdp.factualSummary;

  const name = project.name?.trim();
  const developer = project.developer?.trim();
  if (!name) return undefined;

  // Location: first area segment + city label, collapsing when the area segment
  // is just the city (avoids "Dubai, Dubai").
  const areaName = project.area?.split(",")[0]?.trim() || "";
  const cityName = cityLabel(project.city);
  const location =
    areaName && areaName.toLowerCase() !== cityName.toLowerCase()
      ? `${areaName}, ${cityName}`
      : cityName;

  // A single dominant property type becomes an intro adjective ("townhouse
  // development"); mixed / unknown types are omitted rather than guessed.
  const distinctTypes = Array.from(
    new Set(
      project.units
        .map((u) => (u.propertyType || "").trim().toLowerCase())
        .filter(Boolean),
    ),
  );
  const typeWord =
    distinctTypes.length === 1
      ? (t.types as Record<string, string | undefined>)[distinctTypes[0]]
      : undefined;

  const sentences: string[] = [];

  // Sentence 1 — intro (name, developer, location). Developer clause dropped if
  // the developer name is absent.
  if (developer) {
    sentences.push(
      interpolate(typeWord ? t.introTyped : t.intro, {
        name,
        developer,
        location,
        type: typeWord ?? "",
      }),
    );
  } else {
    sentences.push(
      interpolate(typeWord ? t.introTypedNoDeveloper : t.introNoDeveloper, {
        name,
        location,
        type: typeWord ?? "",
      }),
    );
  }

  // Sentence 2 — launch price and/or payment plan (verified stated facts only).
  const minPrice = Math.min(
    ...project.units.map((u) => u.launchPriceAed).filter((v) => v > 0),
  );
  const hasPrice = Number.isFinite(minPrice) && minPrice > 0;
  const priceLabel = hasPrice ? formatPrice(minPrice, "AED") : "";
  const plan = project.paymentPlan?.trim();
  if (hasPrice && plan) {
    sentences.push(interpolate(t.priceAndPlan, { price: priceLabel, plan }));
  } else if (hasPrice) {
    sentences.push(interpolate(t.priceOnly, { price: priceLabel }));
  } else if (plan) {
    sentences.push(interpolate(t.planOnly, { plan }));
  }

  // Sentence 3 — handover.
  const handover = project.handover?.trim();
  if (handover) {
    sentences.push(interpolate(t.handover, { handover }));
  }

  // Sentence 4 — listed inventory (bedroom band + configuration count). Only
  // units with a known beds value contribute; never invents a beds range.
  const beds = project.units
    .map((u) => u.beds)
    .filter((b): b is number => typeof b === "number" && Number.isFinite(b) && b >= 0);
  const unitCount = project.units.length;
  if (beds.length > 0 && unitCount > 0) {
    const minBeds = Math.min(...beds);
    const maxBeds = Math.max(...beds);
    if (minBeds === maxBeds) {
      sentences.push(
        interpolate(t.inventorySingle, {
          beds: bedsLabel(minBeds, dict),
          count: unitCount,
        }),
      );
    } else {
      sentences.push(
        interpolate(t.inventoryRange, {
          minBeds: bedsLabel(minBeds, dict),
          maxBeds: bedsLabel(maxBeds, dict),
          count: unitCount,
        }),
      );
    }
  }

  const summary = sentences.join(" ").replace(/\s+/g, " ").trim();
  return summary || undefined;
}
