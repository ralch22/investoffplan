import { NextResponse } from "next/server";
import { getProjectBySlug } from "@/lib/catalog";
import { getDb } from "@/lib/db/client";
import { fetchProjectsBySlugs } from "@/lib/db/catalog-queries";

export const dynamic = "force-dynamic";

const MAX_SLUGS = 50;

export async function POST(request: Request) {
  let slugs: string[] = [];
  try {
    const body = (await request.json()) as { slugs?: unknown };
    if (Array.isArray(body.slugs)) {
      slugs = body.slugs
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, MAX_SLUGS);
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (process.env.NEXT_PUBLIC_CATALOG_API === "1") {
    const db = await getDb();
    if (db) {
      const projects = await fetchProjectsBySlugs(db, slugs);
      return NextResponse.json({ projects });
    }
  }

  const rawProjects = await Promise.all(slugs.map((slug) => getProjectBySlug(slug)));
  const projects = rawProjects.filter((p): p is NonNullable<typeof p> => Boolean(p));

  return NextResponse.json({ projects });
}