import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { PageShell } from "@/components/page-shell";
import { PageA2uiSurface } from "@/components/advisor/a2ui/page-surface";
import { composeShare } from "@/lib/advisor/a2ui/page-composers";
import { projectToCard } from "@/lib/advisor/project-card";
import { fetchProjectsBySlugs } from "@/lib/db/catalog-queries";
import { getDb } from "@/lib/db/client";
import { sharedSurfaces } from "@/lib/db/schema";
import { getSiteUrl } from "@/lib/site-url";
import type { AdvisorCard } from "@/lib/advisor/types";
import type { Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

interface ShareRecord {
  reply: string;
  cards: AdvisorCard[];
  mortgagePriceAed: number | null;
  locale: string;
}

/**
 * Load a share and REBUILD its cards from the live catalogue.
 *
 * The store holds slugs, never rendered components, so everything on the page
 * is re-resolved here. That is what makes a shared link safe to open (nothing
 * user-supplied reaches a card) and useful weeks later (prices are current, and
 * a delisted project simply drops out).
 */
async function loadShare(id: string): Promise<ShareRecord | null> {
  const db = await getDb();
  if (!db) return null;

  const row = await db
    .select()
    .from(sharedSurfaces)
    .where(eq(sharedSurfaces.id, id))
    .get();
  if (!row) return null;
  if (Date.parse(row.expiresAt) < Date.now()) return null;

  let slugs: string[] = [];
  try {
    const parsed = JSON.parse(row.slugsJson);
    if (Array.isArray(parsed)) slugs = parsed.filter((s): s is string => typeof s === "string");
  } catch {
    return null;
  }
  if (!slugs.length) return null;

  const projects = await fetchProjectsBySlugs(db, slugs);
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  // Preserve the order the sender saw; drop anything no longer in the catalogue.
  const cards = slugs
    .map((slug) => bySlug.get(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map(projectToCard);

  if (!cards.length) return null;
  return {
    reply: row.reply,
    cards,
    mortgagePriceAed: row.mortgagePriceAed ?? null,
    locale: row.locale,
  };
}

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const share = await loadShare(id);
  const title = share?.cards.length
    ? `${share.cards.length} off-plan project${share.cards.length === 1 ? "" : "s"} — invest off-plan`
    : "Shared shortlist — invest off-plan";

  return {
    title,
    // The reply is the sender's own words; it is the useful preview text in a
    // WhatsApp/Telegram unfurl, which is how these links actually travel.
    description: share?.reply.slice(0, 200) || "A shortlist of Dubai off-plan projects.",
    // Unlisted, not secret — and definitely not indexable: these are per-person
    // pages with no canonical content of their own.
    robots: { index: false, follow: true },
    alternates: { canonical: `${getSiteUrl()}/s/${id}` },
    openGraph: {
      title,
      description: share?.reply.slice(0, 200) || "A shortlist of Dubai off-plan projects.",
      type: "website",
      url: `${getSiteUrl()}/s/${id}`,
    },
    twitter: { card: "summary_large_image", title },
  };
}

export default async function SharedShortlistPage({
  params,
  locale = "en",
}: {
  params: Promise<{ id: string }>;
  locale?: Locale;
}) {
  const { id } = await params;
  const share = await loadShare(id);
  if (!share) notFound();

  const messages = composeShare(share.cards, {
    surfaceId: `share-${id}`,
    mortgagePriceAed: share.mortgagePriceAed,
  });

  const isAr = locale === "ar";

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <p className="text-sm font-medium text-muted">
          {isAr ? "قائمة مختارة تمت مشاركتها معك" : "A shortlist shared with you"}
        </p>

        {/* Server-rendered so the shared content is readable before hydration
            and inside link unfurls. Plain text on purpose — the reply is
            free-form input and is never rendered as markdown or HTML here. */}
        {share.reply ? (
          <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-text-dark">
            {share.reply}
          </p>
        ) : null}

        <div className="mt-8">
          {messages ? (
            <PageA2uiSurface
              messages={messages}
              fallback={
                <ul className="space-y-3">
                  {share.cards.map((card) => (
                    <li key={card.slug}>
                      <a
                        className="font-semibold text-brand hover:underline"
                        href={`${isAr ? "/ar" : ""}/projects/${card.slug}`}
                      >
                        {card.name}
                      </a>
                      <span className="ms-2 text-sm text-muted">
                        {card.developer} · {card.area}
                      </span>
                    </li>
                  ))}
                </ul>
              }
            />
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
