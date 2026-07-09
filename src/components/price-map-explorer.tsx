"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  PRICE_TIER_COLORS,
  priceTier,
  type AreaPricePoint,
} from "@/lib/price-map-shared";
import { communitySlugFor } from "@/lib/community-slug";
import { formatMapPrice } from "@/lib/map-data";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

const DUBAI_CENTER: [number, number] = [25.15, 55.28];

const BED_OPTIONS = [
  { value: "", label: "All bedrooms" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1 BR" },
  { value: "2", label: "2 BR" },
  { value: "3", label: "3 BR" },
  { value: "4", label: "4+ BR" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
];

interface PriceMapExplorerProps {
  initialPoints: AreaPricePoint[];
}

function MapFocus({ center }: { center: [number, number] | null }) {
  const map = useMap();
  if (center) map.setView(center, 12, { animate: true });
  return null;
}

export function PriceMapExplorer({ initialPoints }: PriceMapExplorerProps) {
  const [beds, setBeds] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [selected, setSelected] = useState<AreaPricePoint | null>(null);
  const [query, setQuery] = useState("");

  const points = useMemo(() => {
    let list = initialPoints;
    const budget = maxBudget ? Number(maxBudget) : null;
    if (budget) list = list.filter((p) => p.minPriceAed <= budget);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list;
  }, [initialPoints, maxBudget, query]);

  const priceRange = useMemo(() => {
    if (!points.length) return { min: 0, max: 0 };
    const avgs = points.map((p) => p.avgPriceAed);
    return { min: Math.min(...avgs), max: Math.max(...avgs) };
  }, [points]);

  const mapCenter = selected
    ? ([selected.lat, selected.lng] as [number, number])
    : null;

  async function applyServerFilters() {
    const params = new URLSearchParams();
    if (beds) params.set("beds", beds);
    if (propertyType) params.set("type", propertyType);
    const url = `/tools/price-map${params.size ? `?${params}` : ""}`;
    window.location.href = url;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-text-dark">Filters</h2>
          <div className="mt-3 space-y-3">
            <label className="block text-xs font-medium text-muted">
              Bedrooms
              <select
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="iop-input mt-1 w-full"
              >
                {BED_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-muted">
              Property type
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="iop-input mt-1 w-full"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-muted">
              Max budget (AED)
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="e.g. 2000000"
                className="iop-input mt-1 w-full font-mono tabular-nums"
              />
            </label>
            <button
              type="button"
              onClick={applyServerFilters}
              className="w-full rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Apply bedroom & type
            </button>
          </div>
        </div>

        <input
          type="search"
          placeholder="Search communities…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="iop-input"
        />

        <div className="flex flex-wrap gap-2 text-xs">
          {(["low", "mid", "high"] as const).map((tier) => (
            <span key={tier} className="inline-flex items-center gap-1.5 text-muted">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PRICE_TIER_COLORS[tier] }}
              />
              {tier === "low" ? "More affordable" : tier === "mid" ? "Mid-range" : "Premium"}
            </span>
          ))}
        </div>

        <ul className="max-h-[420px] space-y-2 overflow-y-auto">
          {points.map((point) => {
            const tier = priceTier(point.avgPriceAed, priceRange.min, priceRange.max);
            const active = selected?.slug === point.slug;
            return (
              <li key={point.slug}>
                <button
                  type="button"
                  onClick={() => setSelected(point)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-start transition",
                    active
                      ? "border-brand bg-brand-muted"
                      : "border-border bg-white hover:border-brand/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-text-dark">{point.name}</p>
                      <p className="text-xs text-muted">
                        {point.projectCount} projects · {point.unitCount} units
                      </p>
                    </div>
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: PRICE_TIER_COLORS[tier] }}
                    />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-brand">
                    {formatMapPrice(point.minPriceAed)} – {formatMapPrice(point.maxPriceAed)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div dir="ltr" className="min-h-[420px] overflow-hidden rounded-2xl border border-border">
        <MapContainer
          center={DUBAI_CENTER}
          zoom={10}
          className="h-[min(70vh,560px)] w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFocus center={mapCenter} />
          {points.map((point) => {
            const tier = priceTier(point.avgPriceAed, priceRange.min, priceRange.max);
            const radius = 8 + Math.min(point.unitCount / 20, 12);
            return (
              <CircleMarker
                key={point.slug}
                center={[point.lat, point.lng]}
                radius={radius}
                pathOptions={{
                  color: PRICE_TIER_COLORS[tier],
                  fillColor: PRICE_TIER_COLORS[tier],
                  fillOpacity: selected?.slug === point.slug ? 0.9 : 0.55,
                  weight: selected?.slug === point.slug ? 3 : 1,
                }}
                eventHandlers={{ click: () => setSelected(point) }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{point.name}</p>
                    <p>Avg launch: {formatPrice(point.avgPriceAed, "AED", { compact: true })}</p>
                    {point.avgPpsf ? (
                      <p>Avg AED/sqft: {point.avgPpsf.toLocaleString()}</p>
                    ) : null}
                    <Link href={`/communities/${communitySlugFor(point.name)}`} className="text-brand underline">
                      Explore community
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {selected ? (
        <div className="lg:col-span-2 rounded-2xl border border-brand/30 bg-brand-muted p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-text-dark">{selected.name}</h3>
              <p className="mt-1 text-sm text-muted">
                {selected.cityLabel} · {selected.projectCount} projects · {selected.unitCount}{" "}
                matching units
              </p>
              <p className="mt-3 text-lg font-semibold text-brand">
                Launch prices {formatMapPrice(selected.minPriceAed)} –{" "}
                {formatMapPrice(selected.maxPriceAed)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/communities/${communitySlugFor(selected.name)}`}
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
              >
                Explore community
              </Link>
              <Link
                href={`/projects?q=${encodeURIComponent(selected.name)}`}
                className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-text-dark"
              >
                View projects
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}