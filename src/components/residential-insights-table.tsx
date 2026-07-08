import Image from "next/image";
import Link from "next/link";
import type { ResidentialBuilding } from "@/lib/residential-insights";
import { formatPrice } from "@/lib/format";
import { unoptimizedProp } from "@/lib/asset-image";

interface ResidentialInsightsTableProps {
  buildings: ResidentialBuilding[];
}

export function ResidentialInsightsTable({ buildings }: ResidentialInsightsTableProps) {
  if (!buildings.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-surface-alt p-8 text-center text-muted">
        No projects match your filters. Try a different area or search term.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-start text-sm">
          <thead className="bg-surface-alt text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Launch range</th>
              <th className="px-4 py-3">Avg AED/sqft</th>
              <th className="px-4 py-3">Unit types</th>
              <th className="px-4 py-3">Handover</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((b) => (
              <tr key={b.slug} className="border-t border-border hover:bg-surface-alt/50">
                <td className="px-4 py-3">
                  <Link
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
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">
                  <Link href={`/areas/${b.areaSlug}`} className="hover:text-brand">
                    {b.area}
                  </Link>
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums text-brand">
                  {formatPrice(b.minPriceAed, "AED", { compact: true })} –{" "}
                  {formatPrice(b.maxPriceAed, "AED", { compact: true })}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-dark">
                  {b.avgPpsf ? b.avgPpsf.toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-muted">{b.bedBands.join(", ")}</td>
                <td className="px-4 py-3 text-muted">{b.handover ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}