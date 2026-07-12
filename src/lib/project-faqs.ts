import type { Project } from "@/lib/types";
import { bedsLabel, cityLabel } from "@/lib/format";
import { getDictionary } from "@/i18n";
import { interpolate, type Locale } from "@/i18n/config";

/**
 * Generated, catalog-fact-grounded project FAQs — replaces rendering the
 * verbatim Property Finder FAQ text (duplicate-content risk). Deterministic
 * per project with slug-seeded phrasing variety.
 *
 * Locale-aware (#321): templates live in `dict.pdp.generatedFaqs` so AR PDPs
 * no longer mount an English FAQ band under Arabic chrome.
 */

const GOLDEN_VISA_THRESHOLD = 2_000_000;

function seedIndex(slug: string, options: number): number {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % options;
}

export function buildProjectFaqs(
  project: Project,
  locale: Locale = "en",
): Array<{ q: string; a: string }> {
  const dict = getDictionary(locale);
  const t = dict.pdp.generatedFaqs;
  const name = project.name;

  const prices = project.units.map((u) => u.launchPriceAed).filter((v) => v > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const beds = [...new Set(project.units.map((u) => u.beds))].sort((a, b) => a - b);
  const bedsText =
    beds.length > 1
      ? interpolate(t.bedsRange, {
          min: bedsLabel(beds[0], dict),
          max: bedsLabel(beds[beds.length - 1], dict),
        })
      : beds.length
        ? bedsLabel(beds[0], dict)
        : "";
  const priceFmt = minPrice.toLocaleString("en-US");
  const faqs: Array<{ q: string; a: string }> = [];

  if (minPrice > 0) {
    const qv = t.priceQ.map((template) => interpolate(template, { name }));
    faqs.push({
      q: qv[seedIndex(project.slug, qv.length)],
      a: interpolate(t.priceA, {
        name,
        price: priceFmt,
        bedsClause: bedsText
          ? interpolate(t.bedsClause, { beds: bedsText })
          : "",
      }),
    });
  }

  if (project.handover) {
    faqs.push({
      q: interpolate(t.handoverQ, { name }),
      a: interpolate(t.handoverA, {
        name,
        developer: project.developer,
        handover: project.handover,
      }),
    });
  }

  if (project.paymentPlan) {
    const isPostHandover = project.paymentPlan.split("/").length >= 4;
    faqs.push({
      q: interpolate(t.paymentQ, { name }),
      a: interpolate(t.paymentA, {
        plan: project.paymentPlan,
        postHandover: isPostHandover ? t.paymentPostHandover : "",
      }),
    });
  }

  if (minPrice > 0) {
    faqs.push({
      q: interpolate(t.goldenQ, { name }),
      a:
        minPrice >= GOLDEN_VISA_THRESHOLD
          ? interpolate(t.goldenAAbove, { name })
          : interpolate(t.goldenABelow, { name, price: priceFmt }),
    });
  }

  faqs.push({
    q: interpolate(t.developerQ, { name }),
    a: interpolate(t.developerA, {
      name,
      developer: project.developer,
      area: project.area,
      city: cityLabel(project.city),
    }),
  });

  return faqs;
}
