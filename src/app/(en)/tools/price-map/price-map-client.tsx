"use client";

import dynamic from "next/dynamic";
import type { AreaPricePoint } from "@/lib/price-map-shared";

const PriceMapExplorer = dynamic(
  () =>
    import("@/components/price-map-explorer").then((m) => m.PriceMapExplorer),
  { ssr: false },
);

interface PriceMapClientProps {
  points: AreaPricePoint[];
}

export function PriceMapClient({ points }: PriceMapClientProps) {
  return <PriceMapExplorer initialPoints={points} />;
}