import type { Metadata } from "next";
import { ComparePage } from "./compare-page";
import { parseCompareIds } from "@/lib/compare";
import { getCatalogApi } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Compare projects",
  description:
    "Compare up to three off-plan units side by side — price, handover, brochures, and payment plans.",
};

interface PageProps {
  searchParams: Promise<{ units?: string }>;
}

export default async function CompareRoute({ searchParams }: PageProps) {
  const { units } = await searchParams;
  const initialIds = parseCompareIds(units);
  const api = await getCatalogApi();
  const initialItems = api.resolveCompareUnits(initialIds);

  return (
    <>
      <ComparePage initialIds={initialIds} initialItems={initialItems} />
    </>
  );
}