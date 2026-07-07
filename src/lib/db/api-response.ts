import { NextResponse } from "next/server";
import { getDb } from "./client";
import { isCatalogDbSeeded } from "./catalog-queries";

export const dynamic = "force-dynamic";

export async function withCatalogDb<T>(
  handler: (db: NonNullable<Awaited<ReturnType<typeof getDb>>>) => Promise<T>,
) {
  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      {
        error: "catalog_database_unavailable",
        message: "D1 binding DB is not configured for this environment.",
      },
      { status: 503 },
    );
  }

  const seeded = await isCatalogDbSeeded(db);
  if (!seeded) {
    return NextResponse.json(
      {
        error: "catalog_database_empty",
        message: "Run npm run db:migrate:local && npm run db:seed:local to populate D1.",
      },
      { status: 503 },
    );
  }

  const payload = await handler(db);
  if (payload instanceof Response) return payload;

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}