"use client";

import { useCurrency } from "@/hooks/use-currency";
import {
  formatLaunchPrice,
  formatPrice,
  formatPricePerSqft,
} from "@/lib/format";

/**
 * Client price primitives for server-rendered surfaces (PDP). They take RAW AED
 * numbers and format them through the shared, persisted currency so prices on
 * server pages convert + stay consistent with the SERP without threading the
 * currency down from a client boundary.
 */

export function Price({
  aed,
  fallback,
}: {
  aed: number;
  fallback?: string;
}) {
  const currency = useCurrency();
  if (!(aed > 0)) return <>{fallback ?? "Price on request"}</>;
  return <>{formatPrice(aed, currency)}</>;
}

export function LaunchPrice({
  minAed,
  maxAed,
}: {
  minAed: number;
  maxAed?: number;
}) {
  const currency = useCurrency();
  return <>{formatLaunchPrice(minAed, maxAed, currency)}</>;
}

export function PricePerSqft({ aed }: { aed: number | null | undefined }) {
  const currency = useCurrency();
  const label = formatPricePerSqft(aed, currency);
  return label ? <>{label}</> : null;
}
