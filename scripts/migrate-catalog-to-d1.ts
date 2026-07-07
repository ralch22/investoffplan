/// <reference path="../cloudflare-env.d.ts" />

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import type { CatalogFile } from "../src/lib/catalog-core";
import { stringifyJsonArray } from "../src/lib/db/mappers";
import {
  catalogMeta,
  catalogUnits,
  cityCounts,
  developerSerpLinks,
  developers,
  projectUnits,
  projects,
} from "../src/lib/db/schema";

const META_BATCH_SIZE = 50;
const WRANGLER_CONFIG = join(process.cwd(), "wrangler.jsonc");

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function main() {
  const remote = process.argv.includes("--remote");
  const catalogPath = join(process.cwd(), "data", "catalog.json");
  const raw = JSON.parse(readFileSync(catalogPath, "utf8")) as CatalogFile;
  const updatedAt = raw.scrapedAt;

  const { env, dispose } = await getPlatformProxy({
    configPath: WRANGLER_CONFIG,
    remoteBindings: remote,
    persist: remote ? false : undefined,
  });

  if (remote) {
    console.log("[db:seed] Target: remote D1 (investoffplan-catalog)");
  }

  const d1 = env.DB as D1Database | undefined;
  if (!d1) {
    throw new Error("D1 binding DB is missing from wrangler.jsonc");
  }

  const db = drizzle(d1);

  console.log(
    `[db:seed] Clearing and seeding ${raw.projectCount} projects / ${raw.unitCount} units`,
  );

  await db.delete(catalogUnits);
  await db.delete(projectUnits);
  await db.delete(projects);
  await db.delete(developers);
  await db.delete(developerSerpLinks);
  await db.delete(cityCounts);
  await db.delete(catalogMeta);

  await db.insert(catalogMeta).values({
    id: 1,
    version: raw.version,
    unitCount: raw.unitCount,
    projectCount: raw.projectCount,
    scrapedAt: raw.scrapedAt,
  });

  if (raw.cityCounts.length) {
    for (const batch of chunk(raw.cityCounts, META_BATCH_SIZE)) {
      await db.insert(cityCounts).values(
        batch.map((city, index) => ({
          slug: city.slug,
          label: city.label,
          count: city.count,
          sortOrder: index,
        })),
      );
    }
  }

  if (raw.developerSerpLinks.length) {
    for (const batch of chunk(raw.developerSerpLinks, META_BATCH_SIZE)) {
      await db.insert(developerSerpLinks).values(
        batch.map((link, index) => ({
          title: link.title,
          path: link.path,
          sortOrder: index,
        })),
      );
    }
  }

  const devList = raw.devList ?? [];
  if (devList.length) {
    for (const batch of chunk(devList, META_BATCH_SIZE)) {
      await db.insert(developers).values(
        batch.map((dev) => ({
          id: dev.id,
          name: dev.name,
          slug: dev.slug,
          logoUrl: dev.logoUrl ?? null,
          description: dev.description ?? null,
          establishedSince: dev.establishedSince ?? null,
          numProjectsOnline: dev.numProjectsOnline ?? null,
          devPageEnabled: dev.devPageEnabled ?? null,
        })),
      );
    }
  }

  const seenSlugs = new Set<string>();
  const projectRows = raw.projects.filter((project) => {
    if (seenSlugs.has(project.slug)) {
      console.warn(`[db:seed] Skipping duplicate slug: ${project.slug} (${project.id})`);
      return false;
    }
    seenSlugs.add(project.slug);
    return true;
  });

  for (const [index, project] of projectRows.entries()) {
    await db.insert(projects).values({
      id: project.id,
      slug: project.slug,
      pfSlug: project.pfSlug ?? null,
      name: project.name,
      developer: project.developer,
      developerInitials: project.developerInitials,
      developerLogo: project.developerLogo ?? null,
      city: project.city,
      citySlug: project.citySlug ?? project.city,
      area: project.area,
      status: project.status,
      handover: project.handover ?? null,
      paymentPlan: project.paymentPlan,
      paymentPlanCount: project.paymentPlanCount ?? null,
      isPremium: project.isPremium,
      unitCount: project.unitCount,
      featuredRank: project.featuredRank ?? null,
      imageGradient: project.imageGradient ?? null,
      imageUrl: project.imageUrl ?? null,
      imageGallery: stringifyJsonArray(project.imageGallery),
      videoAvailable: project.videoAvailable ?? null,
      lat: project.coordinates?.lat ?? null,
      lng: project.coordinates?.lng ?? null,
      brochureUrl: project.brochureUrl ?? null,
      description: project.description ?? null,
      amenities: stringifyJsonArray(project.amenities),
      masterPlanUrl: project.masterPlanUrl ?? null,
      videoUrl: project.videoUrl ?? null,
      whatsapp: project.whatsapp,
      updatedAt,
    });

    if ((index + 1) % 100 === 0) {
      console.log(`[db:seed] projects ${index + 1}/${projectRows.length}`);
    }
  }

  const seededProjectIds = new Set(projectRows.map((project) => project.id));

  const seenUnitIds = new Set<string>();
  const allProjectUnits = projectRows.flatMap((project) =>
    project.units.map((unit, index) => ({
      id: unit.id,
      projectId: project.id,
      beds: unit.beds,
      sqftMin: unit.sqftMin,
      sqftMax: unit.sqftMax ?? null,
      launchPriceAed: unit.launchPriceAed,
      launchPriceMaxAed: unit.launchPriceMaxAed ?? null,
      propertyType: unit.propertyType,
      sortOrder: index,
    })),
  ).filter((unit) => {
    if (seenUnitIds.has(unit.id)) {
      console.warn(`[db:seed] Skipping duplicate unit id: ${unit.id}`);
      return false;
    }
    seenUnitIds.add(unit.id);
    return true;
  });

  for (const [index, unit] of allProjectUnits.entries()) {
    await d1.prepare(
      `INSERT INTO project_units (id, project_id, beds, sqft_min, sqft_max, launch_price_aed, launch_price_max_aed, property_type, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        unit.id,
        unit.projectId,
        unit.beds,
        unit.sqftMin,
        unit.sqftMax,
        unit.launchPriceAed,
        unit.launchPriceMaxAed,
        unit.propertyType,
        unit.sortOrder,
      )
      .run();
    if ((index + 1) % 250 === 0) {
      console.log(`[db:seed] project_units ${index + 1}/${allProjectUnits.length}`);
    }
  }

  const seenCatalogUnitIds = new Set<string>();
  const catalogUnitRows = raw.units
    .filter((unit) => seededProjectIds.has(unit.projectId))
    .filter((unit) => {
      if (seenCatalogUnitIds.has(unit.id)) {
        console.warn(`[db:seed] Skipping duplicate catalog unit id: ${unit.id}`);
        return false;
      }
      seenCatalogUnitIds.add(unit.id);
      return true;
    });

  for (const [index, unit] of catalogUnitRows.entries()) {
    await d1.prepare(
      `INSERT INTO catalog_units (
        id, project_id, project_slug, project_name, pf_slug, developer, developer_logo,
        city, city_slug, area, location_full, property_type, beds, sqft_min, sqft_max,
        launch_price_aed, launch_price_max_aed, payment_plan, payment_plan_count, handover,
        is_premium, image_url, image_gallery, video_available, lat, lng,
        project_unit_count, whatsapp, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        unit.id,
        unit.projectId,
        unit.projectSlug,
        unit.projectName,
        unit.pfSlug ?? null,
        unit.developer,
        unit.developerLogo ?? null,
        unit.city,
        unit.citySlug,
        unit.area,
        unit.locationFull,
        unit.propertyType,
        unit.beds,
        unit.sqftMin,
        unit.sqftMax ?? null,
        unit.launchPriceAed,
        unit.launchPriceMaxAed ?? null,
        unit.paymentPlan,
        unit.paymentPlanCount ?? null,
        unit.handover ?? null,
        unit.isPremium ? 1 : 0,
        unit.imageUrl ?? null,
        stringifyJsonArray(unit.imageGallery),
        unit.videoAvailable ? 1 : 0,
        unit.coordinates?.lat ?? null,
        unit.coordinates?.lng ?? null,
        unit.projectUnitCount,
        unit.whatsapp,
        unit.status,
      )
      .run();

    if ((index + 1) % 250 === 0) {
      console.log(`[db:seed] catalog_units ${index + 1}/${catalogUnitRows.length}`);
    }
  }

  const developerCount = new Set(raw.projects.map((p) => slugify(p.developer))).size;
  console.log(
    `[db:seed] Done — ${raw.projectCount} projects, ${raw.unitCount} units, ${developerCount} developers`,
  );

  await dispose();
}

main().catch((error) => {
  console.error("[db:seed] Failed:", error);
  process.exit(1);
});