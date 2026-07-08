"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCatalog } from "@/lib/catalog-browser";
import {
  getMapProjectsFromList,
  formatMapPrice,
  type MapProject,
} from "@/lib/map-data";
import { cn } from "@/lib/cn";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { unoptimizedProp } from "@/lib/asset-image";
import L from "leaflet";

const isApiMode = process.env.NEXT_PUBLIC_CATALOG_API === "1";

const createMarkerIcon = (active: boolean) => L.divIcon({
  className: "iop-marker",
  html: `<div style="width: 14px; height: 14px; background-color: ${active ? '#d92c20' : '#141414'}; border-radius: 50%; opacity: ${active ? 1 : 0.85}; border: 2px solid ${active ? '#fff' : '#d92c20'}; box-shadow: 0 0 6px rgba(0,0,0,0.5); transform: scale(${active ? 1.4 : 1}); transition: all 0.2s;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const DUBAI_CENTER: [number, number] = [25.15, 55.28];

function MapController({ center, zoom }: { center: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export interface ProjectMapInnerProps {
  initialProjects?: MapProject[];
  initialSelected?: MapProject | null;
}

export function ProjectMapInner({
  initialProjects = [],
  initialSelected = null,
}: ProjectMapInnerProps) {
  const { api } = useCatalog();
  const searchParams = useSearchParams();
  const [apiProjects, setApiProjects] = useState<MapProject[] | null>(null);

  useEffect(() => {
    if (!isApiMode) return;
    let active = true;
    fetch("/api/catalog/map")
      .then((r) => r.json())
      .then((data) => {
        if (active) setApiProjects((data as any).projects);
      })
      .catch(console.error);
    return () => { active = false; };
  }, []);

  const projects = useMemo(() => {
    if (isApiMode && apiProjects) return apiProjects;
    return api ? getMapProjectsFromList(api.projects) : initialProjects;
  }, [isApiMode, apiProjects, api, initialProjects]);

  const [selected, setSelected] = useState<MapProject | null>(initialSelected);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.developer.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q),
    );
  }, [projects, query]);

  useEffect(() => {
    const slug = searchParams.get("project");
    if (!slug) return;
    const match = projects.find((p) => p.slug === slug);
    if (match) setSelected(match);
  }, [searchParams, projects]);

  const mapCenter = selected ? ([selected.lat, selected.lng] as [number, number]) : DUBAI_CENTER;

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="order-2 flex flex-col gap-4 lg:order-1">
        <input
          type="search"
          placeholder="Search map projects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="iop-input"
        />
        <p className="text-sm text-muted">
          {filtered.length.toLocaleString()} projects with coordinates
        </p>
        <div className="max-h-[min(420px,50vh)] space-y-2 overflow-y-auto pe-1 lg:max-h-[520px]">
          {filtered.slice(0, 80).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p)}
              className={cn(
                "iop-btn-press w-full rounded-xl border p-3 text-start transition",
                selected?.id === p.id
                  ? "border-brand bg-brand-muted"
                  : "border-border hover:border-brand/40",
              )}
            >
              <p className="text-sm font-semibold text-text-dark">{p.name}</p>
              <p className="mt-1 text-xs text-muted">
                {p.developer} · FROM {formatMapPrice(p.minPriceAed)}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="relative order-1 overflow-hidden rounded-2xl border border-border bg-map-surface lg:order-2 lg:min-h-[520px]">
        <div dir="ltr" className="h-[360px] w-full lg:h-full lg:absolute lg:inset-0">
          <MapContainer
            center={DUBAI_CENTER}
            zoom={11}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {filtered.map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={createMarkerIcon(selected?.id === p.id)}
                eventHandlers={{
                  click: () => setSelected(p),
                }}
              />
            ))}
            <MapController center={selected ? [selected.lat, selected.lng] : null} zoom={selected ? 14 : 11} />
          </MapContainer>
        </div>

        {selected ? (
          <div className="absolute bottom-4 start-4 end-4 z-[400] rounded-xl border border-border bg-white/95 p-4 shadow-elevation-md backdrop-blur">
            <div className="flex gap-3">
              {selected.imageUrl ? (
                <div className="relative hidden h-16 w-20 shrink-0 overflow-hidden rounded-lg sm:block">
                  <Image
                    src={selected.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                    {...unoptimizedProp(selected.imageUrl)}
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-text-dark">{selected.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {selected.developer} · {selected.area}
                </p>
                <p className="mt-1 text-sm font-semibold text-brand">
                  FROM {formatMapPrice(selected.minPriceAed)}
                  {selected.handover ? ` · ${selected.handover}` : ""}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/projects/${selected.slug}`}
                className="iop-btn-press inline-flex rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                View details
              </Link>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="iop-btn-press rounded-full border border-border px-4 py-2 text-sm font-medium text-muted hover:border-brand hover:text-brand"
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <p className="absolute bottom-4 start-4 end-4 z-[400] pointer-events-none rounded-xl border border-dashed border-border bg-white/80 px-4 py-3 text-center text-sm text-muted backdrop-blur">
            Tap a pin or search the list to explore projects
          </p>
        )}
      </div>
    </div>
  );
}
