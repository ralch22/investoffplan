import type { Project } from "./types";
import { formatPrice } from "./format";

export interface MapProject {
  id: string;
  slug: string;
  name: string;
  developer: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  minPriceAed: number;
  handover?: string;
  imageUrl?: string;
}

const UAE_BOUNDS = {
  minLat: 22.5,
  maxLat: 26.2,
  minLng: 51.4,
  maxLng: 56.5,
};

export function getMapProjectsFromList(projects: Project[]): MapProject[] {
  return projects
    .filter((p) => p.coordinates)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      developer: p.developer,
      area: p.area,
      city: p.city,
      lat: p.coordinates!.lat,
      lng: p.coordinates!.lng,
      minPriceAed: Math.min(...p.units.map((u) => u.launchPriceAed)),
      handover: p.handover,
      imageUrl: p.imageUrl,
    }));
}

export function getMapProjectBySlug(
  projects: MapProject[],
  slug: string,
): MapProject | undefined {
  return projects.find((p) => p.slug === slug);
}

export function projectToSvgCoords(
  lat: number,
  lng: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const x =
    ((lng - UAE_BOUNDS.minLng) / (UAE_BOUNDS.maxLng - UAE_BOUNDS.minLng)) *
    width;
  const y =
    height -
    ((lat - UAE_BOUNDS.minLat) / (UAE_BOUNDS.maxLat - UAE_BOUNDS.minLat)) *
      height;
  return { x, y };
}

export function formatMapPrice(aed: number): string {
  return formatPrice(aed, "AED", { compact: true });
}