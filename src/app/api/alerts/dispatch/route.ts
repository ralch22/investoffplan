import { NextResponse } from "next/server";
import { and, eq, gt, inArray, isNull, lt, or } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { projects, projectUnits, savedSearches, users } from "@/lib/db/schema";
import {
  projectMatchesFilters,
  sanitizeSavedSearchFilters,
  savedSearchPath,
  type AlertProject,
} from "@/lib/alerts/match";
import { sendEmail, isEmailConfigured } from "@/lib/email/resend";
import { alertDigestEmail, type AlertDigestSearch } from "@/lib/email/templates";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";

// New-launch window (projects.first_seen_at) — matches the weekly ingest.
const NEW_LAUNCH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
// Re-alert cooldown: slightly under a week so a weekly cron never skips a
// search because the previous run finished minutes "too recently".
const ALERT_COOLDOWN_MS = 6 * 24 * 60 * 60 * 1000;
// Workers CPU/wall budget — stop early and let the caller loop.
const TIME_BUDGET_MS = 25_000;
const MAX_MATCHES_PER_SEARCH = 10;

/** Constant-time string comparison (locked closed on missing secret). */
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  // Length leak is unavoidable without padding; still compare all bytes.
  let diff = aBytes.length ^ bBytes.length;
  const len = Math.max(aBytes.length, bBytes.length);
  for (let i = 0; i < len; i += 1) {
    diff |= (aBytes[i % aBytes.length] ?? 0) ^ (bBytes[i % bBytes.length] ?? 0);
  }
  return diff === 0;
}

function formatFromPrice(minPriceAed: number | null): string | undefined {
  if (minPriceAed == null || minPriceAed <= 0) return undefined;
  if (minPriceAed >= 1_000_000) {
    const m = minPriceAed / 1_000_000;
    return `AED ${m >= 10 ? Math.round(m) : Math.round(m * 10) / 10}M`;
  }
  return `AED ${Math.round(minPriceAed / 1_000)}K`;
}

function withUtm(path: string, content: string): string {
  const url = new URL(path, SITE_URL);
  url.searchParams.set("utm_source", "alerts");
  url.searchParams.set("utm_medium", "email");
  url.searchParams.set("utm_campaign", "new-launch-digest");
  url.searchParams.set("utm_content", content);
  return url.toString();
}

/**
 * Weekly new-launch alert dispatch. Token-guarded (x-alerts-token must equal
 * the ALERTS_DISPATCH_TOKEN worker secret); triggered by the catalog-ingest
 * workflow's final step and the manual alerts-dispatch workflow.
 *
 * Idempotency: every EVALUATED search gets last_alert_at stamped (matched or
 * not), so a re-run within the cooldown window is a no-op and the
 * {processed, remaining} loop contract always makes progress.
 */
export async function POST(request: Request) {
  const secret = process.env.ALERTS_DISPATCH_TOKEN;
  const provided = request.headers.get("x-alerts-token") ?? "";
  if (!secret || !timingSafeEqual(provided, secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const startedAt = Date.now();
  const db = await getDb();
  if (!db) {
    return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });
  }

  const now = new Date();
  const newSince = new Date(now.getTime() - NEW_LAUNCH_WINDOW_MS).toISOString();
  const cooldownBefore = new Date(now.getTime() - ALERT_COOLDOWN_MS).toISOString();

  // Saved searches due for evaluation, with owner email/locale.
  const due = await db
    .select({
      id: savedSearches.id,
      userId: savedSearches.userId,
      label: savedSearches.label,
      filters: savedSearches.filters,
      locale: savedSearches.locale,
      unsubscribeToken: savedSearches.unsubscribeToken,
      email: users.email,
    })
    .from(savedSearches)
    .innerJoin(users, eq(users.id, savedSearches.userId))
    .where(
      and(
        eq(savedSearches.alertEnabled, 1),
        or(isNull(savedSearches.lastAlertAt), lt(savedSearches.lastAlertAt, cooldownBefore)),
      ),
    );

  if (due.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, remaining: 0, sent: 0 });
  }

  // Projects first seen inside the window, with their unit rows.
  const newProjects = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      developer: projects.developer,
      area: projects.area,
      city: projects.city,
      citySlug: projects.citySlug,
    })
    .from(projects)
    .where(gt(projects.firstSeenAt, newSince));

  const alertProjects: Array<AlertProject & { slug: string; minPriceAed: number | null }> = [];
  if (newProjects.length > 0) {
    const unitRows = await db
      .select({
        projectId: projectUnits.projectId,
        beds: projectUnits.beds,
        propertyType: projectUnits.propertyType,
        launchPriceAed: projectUnits.launchPriceAed,
      })
      .from(projectUnits)
      .where(inArray(projectUnits.projectId, newProjects.map((p) => p.id)));

    const unitsByProject = new Map<string, AlertProject["units"]>();
    for (const unit of unitRows) {
      const list = unitsByProject.get(unit.projectId) ?? [];
      list.push({
        beds: unit.beds,
        propertyType: unit.propertyType,
        launchPriceAed: unit.launchPriceAed,
      });
      unitsByProject.set(unit.projectId, list);
    }

    for (const project of newProjects) {
      const units = unitsByProject.get(project.id) ?? [];
      alertProjects.push({
        slug: project.slug,
        name: project.name,
        developer: project.developer,
        area: project.area,
        city: project.citySlug ?? project.city,
        units,
        minPriceAed: units.length
          ? Math.min(...units.map((u) => u.launchPriceAed))
          : null,
      });
    }
  }

  // Group due searches per user — ONE digest email per user per run.
  const byUser = new Map<string, typeof due>();
  for (const search of due) {
    const list = byUser.get(search.userId) ?? [];
    list.push(search);
    byUser.set(search.userId, list);
  }

  const emailReady = isEmailConfigured();
  let processed = 0;
  let sent = 0;
  const stampedIds: string[] = [];

  for (const [userId, searches] of byUser) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) break;

    const digestSections: AlertDigestSearch[] = [];
    const locale = searches[0]?.locale === "ar" ? ("ar" as const) : ("en" as const);

    for (const search of searches) {
      const filters = (() => {
        try {
          return sanitizeSavedSearchFilters(JSON.parse(search.filters));
        } catch {
          return {};
        }
      })();
      const matches = alertProjects
        .filter((project) => projectMatchesFilters(project, filters))
        .slice(0, MAX_MATCHES_PER_SEARCH);
      if (matches.length > 0) {
        digestSections.push({
          label: search.label,
          searchUrl: withUtm(savedSearchPath(filters, locale), "search"),
          unsubscribeUrl: unsubscribeUrl(search.id, search.unsubscribeToken),
          matches: matches.map((m) => ({
            name: m.name,
            community: m.area,
            fromPrice: formatFromPrice(m.minPriceAed),
            url: withUtm(
              `${locale === "ar" ? "/ar" : ""}/projects/${m.slug}`,
              "project",
            ),
          })),
        });
      }
    }

    const email = searches[0]?.email;
    if (digestSections.length > 0 && email && emailReady) {
      const template = alertDigestEmail({ searches: digestSections, locale });
      const result = await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        kind: "alert",
        userId,
        savedSearchId: searches[0]?.id,
        unsubscribeUrl: digestSections[0]?.unsubscribeUrl,
      });
      if (result.status === "sent") sent += 1;
    }

    // Stamp every evaluated search — matched or not — so the loop contract
    // ({processed, remaining}) always makes progress.
    for (const search of searches) stampedIds.push(search.id);
    processed += searches.length;
  }

  if (stampedIds.length > 0) {
    const stamp = new Date().toISOString();
    await db
      .update(savedSearches)
      .set({ lastAlertAt: stamp, updatedAt: stamp })
      .where(inArray(savedSearches.id, stampedIds));
  }

  return NextResponse.json({
    ok: true,
    processed,
    remaining: due.length - processed,
    sent,
    newProjects: alertProjects.length,
    emailConfigured: emailReady,
  });
}

function unsubscribeUrl(id: string, token: string): string {
  const url = new URL("/api/alerts/unsubscribe", SITE_URL);
  url.searchParams.set("id", id);
  url.searchParams.set("token", token);
  return url.toString();
}
