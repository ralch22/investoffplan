import { NextResponse } from "next/server";
import { withCatalogDb } from "@/lib/db/api-response";
import { fetchProjectBySlug } from "@/lib/db/catalog-queries";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;

  return withCatalogDb(async (db) => {
    const project = await fetchProjectBySlug(db, slug);
    if (!project) {
      return NextResponse.json({ error: "project_not_found" }, { status: 404 });
    }
    return { project };
  });
}