import type { Metadata } from "next";
import { AccountPage } from "./account-page";
import { getCommunities } from "@/lib/communities";
import { getAreaStats } from "@/lib/dld-area-stats";

export const metadata: Metadata = {
  title: "My account",
  description: "Manage your invest off-plan profile, saved searches, and favorites.",
  robots: { index: false, follow: false },
};

const ACCOUNT_REPORT_LINKS = 6;

export default async function Page() {
  // Top covered communities by DLD transaction volume → printable market
  // reports. Static build-time data, so the page stays ISR-safe.
  const communities = await getCommunities();
  const reportLinks = communities
    .map((c) => ({ slug: c.slug, name: c.name, stats: getAreaStats(c.name) }))
    .filter((x) => x.stats)
    .sort((a, b) => (b.stats?.saleSample ?? 0) - (a.stats?.saleSample ?? 0))
    .slice(0, ACCOUNT_REPORT_LINKS)
    .map(({ slug, name }) => ({ slug, name }));

  return <AccountPage reportLinks={reportLinks} />;
}
