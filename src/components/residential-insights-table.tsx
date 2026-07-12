"use client";

import Image from "next/image";
import { LocaleLink } from "@/components/locale-link";
import { communitySlugFor } from "@/lib/community-slug";
import type { ResidentialBuilding } from "@/lib/residential-insights";
import { bedsLabel, formatPrice } from "@/lib/format";
import { unoptimizedProp } from "@/lib/asset-image";
import { useI18n } from "@/i18n/locale-provider";

interface ResidentialInsightsTableProps {
  buildings: ResidentialBuilding[];
}

export function ResidentialInsightsTable({ buildings }: ResidentialInsightsTableProps) {
  const { dict } = useI18n();
  const t = dict.tools.residentialInsights;

  if (!buildings.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-surface-alt p-8 text-center text-muted">
        {t.noProjects}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-start text-sm">
          <thead className="bg-surface-alt text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">{t.colProject}</th>
              <th className="px-4 py-3">{t.colArea}</th>
              <th className="px-4 py-3">{t.colLaunchRange}</th>
              <th className="px-4 py-3">{t.colAvgPpsf}</th>
              <th className="px-4 py-3">{t.colUnitTypes}</th>
              <th className="px-4 py-3">{t.colHandover}</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((b) => (
              <tr key={b.slug} className="border-t border-border hover:bg-surface-alt/50">
                <td className="px-4 py-3">
                  <LocaleLink
                    href={`/projects/${b.slug}`}
                    className="flex items-center gap-3 font-semibold text-text-dark hover:text-brand"
                  >
                    {b.imageUrl ? (
                      <Image
                        src={b.imageUrl}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-lg object-cover"
                        {...unoptimizedProp(b.imageUrl)}
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-alt text-xs text-muted">
                        IOP
                      </span>
                    )}
                    <span>
                      {b.name}
                      <span className="mt-0.5 block text-xs font-normal text-muted">
                        {b.developer}
                      </span>
                    </span>
                  </LocaleLink>
                </td>
                <td className="px-4 py-3 text-muted">
                  <LocaleLink href={`/communities/${communitySlugFor(b.area)}`} className="hover:text-brand">
                    {b.area}
                  </LocaleLink>
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums text-brand">
                  {formatPrice(b.minPriceAed, "AED", { compact: true })} –{" "}
                  {formatPrice(b.maxPriceAed, "AED", { compact: true })}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-dark">
                  {b.avgPpsf ? b.avgPpsf.toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {b.beds.map((n) => bedsLabel(n, dict)).join(", ")}
                </td>
                <td className="px-4 py-3 text-muted">{b.handover ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
