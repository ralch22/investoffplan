import { getCommunities } from "@/lib/communities";

export async function getFooterAreaLinks() {
  const communities = await getCommunities();
  return communities
    .slice(0, 3)
    .map((community) => ({
      href: `/communities/${community.slug}`,
      label: community.name,
    }));
}
