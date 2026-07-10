import "server-only";
import { getCommunities, getCommunityImage } from "@/lib/communities";

/** Minimal community shape the header mega menu needs (serialized to the client). */
export interface NavCommunity {
  slug: string;
  name: string;
  projectCount: number;
  minPriceAed: number;
  image?: string;
}

let cached: NavCommunity[] | null = null;

/**
 * Top-8 communities (by project count) + a thumbnail, for the Communities mega
 * panel. Module-cached so it's computed once per process, not per prerendered
 * page. Fed to the client via NavDataProvider from the root layouts.
 */
export async function getNavCommunities(): Promise<NavCommunity[]> {
  if (cached) return cached;
  const top = (await getCommunities()).slice(0, 8);
  cached = await Promise.all(
    top.map(async (c) => ({
      slug: c.slug,
      name: c.name,
      projectCount: c.projectCount,
      minPriceAed: c.minPriceAed,
      image: await getCommunityImage(c.slug),
    })),
  );
  return cached;
}
