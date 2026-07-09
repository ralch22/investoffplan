import Image from "next/image";
import Link from "next/link";
import { communitySlugFor } from "@/lib/community-slug";
import { formatPrice } from "@/lib/format";
import type { AreaInsights } from "@/lib/area-insights";
import { unoptimizedProp } from "@/lib/asset-image";

interface ProjectLivingInAreaProps {
  insights: AreaInsights;
}

export function ProjectLivingInArea({ insights }: ProjectLivingInAreaProps) {
  return (
    <section
      id="living-in-area"
      aria-labelledby="living-in-area-heading"
      className="mt-10 scroll-mt-24"
    >
      <h2
        id="living-in-area-heading"
        className="font-display text-2xl font-semibold text-text-dark md:text-3xl"
      >
        Living in <em className="italic">{insights.name.split(",")[0]}</em>
      </h2>
      <p className="prose-balance mt-3 max-w-2xl text-muted">{insights.tagline}</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white shadow-elevation-sm">
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          {insights.heroImage ? (
            <div className="relative min-h-[200px] md:min-h-[260px]">
              <Image
                src={insights.heroImage}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                {...unoptimizedProp(insights.heroImage)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-darker/50 to-transparent" />
            </div>
          ) : (
            <div className="area-card-accent min-h-[200px] p-6 md:min-h-[260px]">
              <p className="font-display text-4xl font-semibold text-brand/20">
                {insights.projectCount}
              </p>
              <p className="mt-2 text-sm font-semibold text-text-dark">
                off-plan projects in this area
              </p>
            </div>
          )}

          <div className="p-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <InsightStat label="Projects" value={String(insights.projectCount)} />
              <InsightStat label="Unit options" value={insights.unitCount.toLocaleString()} />
              <InsightStat
                label="From"
                value={formatPrice(insights.minPriceAed, "AED")}
              />
              <InsightStat
                label="Avg launch"
                value={formatPrice(insights.avgPriceAed, "AED")}
              />
            </dl>
            <p className="mt-4 text-sm text-muted">
              {insights.cityLabel} · {insights.projectCount} active off-plan launches with
              unit-level pricing and brochures on invest off-plan.
            </p>
            <Link
              href={`/communities/${communitySlugFor(insights.name)}`}
              className="iop-btn-press focus-ring mt-5 inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Explore {insights.name.split(",")[0]} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function InsightStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-light">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums text-brand">{value}</dd>
    </div>
  );
}