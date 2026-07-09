import Link from "next/link";
import { cityLabel } from "@/lib/format";
import { communitySlugFor } from "@/lib/community-slug";
import { slugify } from "@/lib/slugify";
import type { Project } from "@/lib/types";

interface ProjectKeyFactsProps {
  project: Project;
}

export function ProjectKeyFacts({ project }: ProjectKeyFactsProps) {
  const propertyTypes = [
    ...new Set(project.units.map((u) => u.propertyType)),
  ].map((t) => t.charAt(0).toUpperCase() + t.slice(1));

  const paymentLabel =
    project.paymentPlanCount && project.paymentPlanCount > 1
      ? `See ${project.paymentPlanCount} payment plans`
      : project.paymentPlan;

  const facts = [
    {
      label: "Delivery date",
      value: project.handover ?? "To be announced",
    },
    {
      label: "Location",
      value: `${cityLabel(project.city)}, ${project.area}`,
      href: `/communities/${communitySlugFor(project.area)}`,
    },
    {
      label: "Payment plan",
      value: paymentLabel,
      href: "#calculator",
    },
    {
      label: "Property types",
      value: propertyTypes.join(", "),
    },
    {
      label: "Government fee",
      value: "4% DLD",
    },
    {
      label: "Ownership type",
      value: "Freehold",
    },
    {
      label: "Developer",
      value: project.developer,
      href: `/developers/${slugify(project.developer)}`,
    },
    {
      label: "Status",
      value: formatStatus(project.status),
    },
  ];

  return (
    <section aria-labelledby="key-information-heading" className="mt-10">
      <h2
        id="key-information-heading"
        className="font-display text-2xl font-semibold text-text-dark md:text-3xl"
      >
        Key <em className="italic">information</em>
      </h2>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <Link href={fact.href} className="text-brand hover:text-brand-dark">
                  {fact.value}
                </Link>
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

function formatStatus(status: Project["status"]): string {
  switch (status) {
    case "sold-out":
      return "Sold out";
    case "under-construction":
      return "Under construction";
    case "ready":
      return "Ready";
    default:
      return "Off-plan";
  }
}