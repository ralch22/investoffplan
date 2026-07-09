import type { Metadata } from "next";
import { ComparePage } from "./compare-page";
import { parseCompareIds } from "@/lib/compare";
import { getCatalogApi } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Compare units",
  description:
    "Compare up to three off-plan units side by side — price, handover, brochures, and payment plans.",
  alternates: { canonical: `${getSiteUrl()}/compare/units` },
};

interface PageProps {
  searchParams: Promise<{ units?: string }>;
}

export default async function CompareUnitsRoute({ searchParams }: PageProps) {
  const { units } = await searchParams;
  const initialIds = parseCompareIds(units);
  const api = await getCatalogApi();
  const initialItems = api.resolveCompareUnits(initialIds);

  return <ComparePage initialIds={initialIds} initialItems={initialItems} />;
}
