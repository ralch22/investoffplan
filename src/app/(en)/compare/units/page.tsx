import type { Metadata } from "next";
import { ComparePage } from "./compare-page";
import { parseCompareIds } from "@/lib/compare";
import { getCatalogApi } from "@/lib/catalog";
import { getAreaStats } from "@/lib/dld-area-stats";
import type { CompareStatsMap } from "@/lib/compare-stats";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Compare units",
  description:
    "Compare up to three off-plan units side by side — price, handover, brochures, and payment plans.",
  alternates: { canonical: `${getSiteUrl()}/compare/units` },
  robots: { index: false, follow: true },
};

interface PageProps {
  searchParams: Promise<{ units?: string }>;
}

export default async function CompareUnitsRoute({ searchParams }: PageProps) {
  const { units } = await searchParams;
  const initialIds = parseCompareIds(units);
  const api = await getCatalogApi();
  const initialItems = api.resolveCompareUnits(initialIds);

  // DLD area stats are a server-only JSON import — prune to the client-safe
  // shape here. Items can only be removed client-side (compare ids never grow
  // on this page), so stats resolved for initialItems cover every state; the
  // client renders "—" for any project id it can't find anyway.
  const initialStats: CompareStatsMap = {};
  for (const item of initialItems) {
    if (initialStats[item.project.id]) continue;
    const s = getAreaStats(item.project.area);
    initialStats[item.project.id] = {
      grossYieldPct: s?.grossYieldPct ?? null,
      medianPpsqft: s?.medianPpsqft ?? null,
      appreciationPct: s?.appreciationPct ?? null,
    };
  }

  return (
    <ComparePage
      initialIds={initialIds}
      initialItems={initialItems}
      initialStats={initialStats}
    />
  );
}
