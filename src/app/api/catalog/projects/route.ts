import { NextResponse } from "next/server";
import { withCatalogDb } from "@/lib/db/api-response";
import { queryCatalogProjects } from "@/lib/db/catalog-queries";
import type {
  CitySlug,
  CollectionFilter,
  PaymentPlanFilter,
  PropertyType,
  SortOption,
  ViewMode,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function parseIntParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePrice(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBeds(value: string | null): number | "studio" | "all" {
  if (!value || value === "all") return "all";
  if (value === "studio") return "studio";
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : "all";
}

function parsePaymentPlan(value: string | null): PaymentPlanFilter {
  return value === "post-handover" || value === "multiple" ? value : "all";
}

function parseHandoverBy(value: string | null): number | "all" {
  if (!value || value === "all") return "all";
  const parsed = Number.parseInt(value, 10);
  return parsed >= 2000 && parsed <= 2100 ? parsed : "all";
}

function parseAmenities(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return withCatalogDb(async (db) => {
    const result = await queryCatalogProjects(db, {
      page: parseIntParam(searchParams.get("page"), 1),
      pageSize: parseIntParam(searchParams.get("pageSize"), 24),
      view: (searchParams.get("view") as ViewMode | null) ?? "unit",
      sort: (searchParams.get("sort") as SortOption | null) ?? "featured",
      collection: (searchParams.get("collection") as CollectionFilter | null) ?? "all",
      filters: {
        query: searchParams.get("q") ?? "",
        city: (searchParams.get("city") as CitySlug | null) ?? "all",
        propertyType: (searchParams.get("propertyType") as PropertyType | "all" | null) ?? "all",
        beds: parseBeds(searchParams.get("beds")),
        minPrice: parsePrice(searchParams.get("minPrice")),
        maxPrice: parsePrice(searchParams.get("maxPrice")),
        developer: searchParams.get("developer") ?? "all",
        paymentPlan: parsePaymentPlan(searchParams.get("payment")),
        handoverBy: parseHandoverBy(searchParams.get("handoverBy")),
        amenities: parseAmenities(searchParams.get("amenities")),
      },
    });

    if (!result) {
      return NextResponse.json({ error: "catalog_unavailable" }, { status: 503 });
    }

    return result;
  });
}