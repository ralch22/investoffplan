import { getSiteStats } from "@/lib/catalog";
import { getDldTotals } from "@/lib/dld-area-stats";

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * Slim verifiable-data strip — every number here is computed from real data
 * at build/request time (catalog counts + DLD open-data transaction totals).
 * No hardcoded marketing figures.
 */
export async function DataSourcesStrip() {
  const stats = await getSiteStats();
  const dld = getDldTotals();

  return (
    <div className="border-y border-border bg-surface-alt">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-2 gap-y-1 px-5 py-3 text-xs text-muted md:px-8">
        <span className="font-semibold text-text-dark">
          Data you can verify
        </span>
        <span aria-hidden>&mdash;</span>
        <span>{fmt(stats.projectCount)} projects</span>
        <span aria-hidden>&middot;</span>
        <span>{fmt(stats.unitCount)} unit options tracked</span>
        <span aria-hidden>&middot;</span>
        <span>{fmt(dld.totalSales)} DLD transactions analysed (2025)</span>
        <span aria-hidden>&middot;</span>
        <span>Dubai Land Department open data</span>
      </div>
    </div>
  );
}
