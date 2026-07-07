import { getAreas } from "@/lib/catalog";

export async function getFooterAreaLinks() {
  const areas = await getAreas();
  return areas
    .slice(0, 3)
    .map((area) => ({
      href: `/areas/${area.slug}`,
      label: area.name,
    }));
}