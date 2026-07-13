import { LocaleLink } from "@/components/locale-link";
import { cityLabel } from "@/lib/format";
import { communitySlugFor } from "@/lib/community-slug";
import { hasPaymentPlan, parsePaymentPlan } from "@/lib/investment-metrics";
import { slugify } from "@/lib/slugify";
import type { Project } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { interpolate, type Locale } from "@/i18n/config";

interface ProjectKeyFactsProps {
  project: Project;
  locale?: Locale;
}

export function ProjectKeyFacts({ project, locale = "en" }: ProjectKeyFactsProps) {
  const dict = getDictionary(locale);
  const kf = dict.pdp.keyFacts;
  const propertyTypes = [
    ...new Set(project.units.map((u) => u.propertyType)),
  ].map((t) => translatePropertyType(t, kf));

  const planKnown = hasPaymentPlan(project.paymentPlan);
  const paymentLabel =
    project.paymentPlanCount && project.paymentPlanCount > 1
      ? interpolate(kf.seePaymentPlans, { count: project.paymentPlanCount })
      : planKnown
        ? project.paymentPlan.trim()
        : kf.onRequest;

  const facts = [
    {
      label: kf.deliveryDate,
      value: project.handover ?? kf.toBeAnnounced,
    },
    {
      label: kf.location,
      value: `${cityLabel(project.city, dict)}, ${project.area}`,
      href: `/communities/${communitySlugFor(project.area)}`,
    },
    {
      label: kf.paymentPlan,
      value: paymentLabel,
      // Only deep-link when a numeric plan drives the calculator section.
      href: parsePaymentPlan(project.paymentPlan ?? "") ? "#calculator" : undefined,
    },
    {
      label: kf.propertyTypes,
      value: propertyTypes.join(", "),
    },
    {
      label: kf.governmentFee,
      value: kf.governmentFeeValue,
    },
    {
      label: kf.ownershipType,
      value: kf.freehold,
    },
    {
      label: kf.developer,
      value: project.developer,
      href: `/developers/${slugify(project.developer)}`,
    },
    {
      label: kf.status,
      value: formatStatus(project.status, kf),
    },
  ];

  return (
    <section aria-labelledby="key-information-heading" className="mt-10">
      <h2
        id="key-information-heading"
        className="font-display text-2xl font-semibold text-text-dark md:text-3xl"
      >
        {kf.headingLead} <em className="italic">{kf.headingEm}</em>
      </h2>
      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="rounded-2xl border border-border bg-surface p-4 shadow-elevation-sm"
          >
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-light">
              {fact.label}
            </dt>
            <dd className="mt-2 text-sm font-semibold text-text-dark">
              {fact.href ? (
                <LocaleLink href={fact.href} className="text-brand hover:text-brand-dark">
                  {fact.value}
                </LocaleLink>
              ) : (
                fact.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function translatePropertyType(
  type: string,
  kf: {
    propertyTypeApartment: string;
    propertyTypeVilla: string;
    propertyTypeTownhouse: string;
    propertyTypePenthouse: string;
    propertyTypeDuplex: string;
    propertyTypeLand: string;
  },
): string {
  switch (type.toLowerCase()) {
    case "apartment": return kf.propertyTypeApartment;
    case "villa": return kf.propertyTypeVilla;
    case "townhouse": return kf.propertyTypeTownhouse;
    case "penthouse": return kf.propertyTypePenthouse;
    case "duplex": return kf.propertyTypeDuplex;
    case "land": return kf.propertyTypeLand;
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

function formatStatus(
  status: Project["status"],
  kf: {
    statusSoldOut: string;
    statusUnderConstruction: string;
    statusReady: string;
    statusOffPlan: string;
  },
): string {
  switch (status) {
    case "sold-out":
      return kf.statusSoldOut;
    case "under-construction":
      return kf.statusUnderConstruction;
    case "ready":
      return kf.statusReady;
    default:
      return kf.statusOffPlan;
  }
}