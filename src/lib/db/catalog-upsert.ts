import { eq } from "drizzle-orm";
import type { CatalogFile } from "@/lib/catalog-core";
import type { CatalogDatabase } from "./client";
import {
  catalogUnitToInsertValues,
  prepareCatalogRows,
  projectToInsertValues,
} from "./prepare-catalog-rows";
import {
  catalogMeta,
  catalogUnits,
  cityCounts,
  developerSerpLinks,
  developers,
  projectUnits,
  projects,
} from "./schema";

export interface UpsertStats {
  projects: number;
  projectUnits: number;
  catalogUnits: number;
  developers: number;
  skippedDuplicateSlugs: number;
  skippedDuplicateUnitIds: number;
  scrapedAt: string;
}

const UNIT_BATCH = 50;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export async function upsertCatalogFile(
  db: CatalogDatabase,
  d1: D1Database,
  raw: CatalogFile,
): Promise<UpsertStats> {
  const prepared = prepareCatalogRows(raw);

  await db
    .insert(catalogMeta)
    .values({
      id: 1,
      version: raw.version,
      unitCount: raw.unitCount,
      projectCount: prepared.projects.length,
      scrapedAt: raw.scrapedAt,
    })
    .onConflictDoUpdate({
      target: catalogMeta.id,
      set: {
        version: raw.version,
        unitCount: raw.unitCount,
        projectCount: prepared.projects.length,
        scrapedAt: raw.scrapedAt,
      },
    });

  await db.delete(cityCounts);
  if (prepared.cityCounts.length) {
    await db.insert(cityCounts).values(
      prepared.cityCounts.map((city, index) => ({
        slug: city.slug,
        label: city.label,
        count: city.count,
        sortOrder: index,
      })),
    );
  }

  await db.delete(developerSerpLinks);
  if (prepared.developerSerpLinks.length) {
    await db.insert(developerSerpLinks).values(
      prepared.developerSerpLinks.map((link, index) => ({
        title: link.title,
        path: link.path,
        sortOrder: index,
      })),
    );
  }

  if (prepared.devList.length) {
    for (const dev of prepared.devList) {
      await db
        .insert(developers)
        .values({
          id: dev.id,
          name: dev.name,
          slug: dev.slug,
          logoUrl: dev.logoUrl ?? null,
          description: dev.description ?? null,
          establishedSince: dev.establishedSince ?? null,
          numProjectsOnline: dev.numProjectsOnline ?? null,
          devPageEnabled: dev.devPageEnabled ?? null,
        })
        .onConflictDoUpdate({
          target: developers.id,
          set: {
            name: dev.name,
            slug: dev.slug,
            logoUrl: dev.logoUrl ?? null,
            description: dev.description ?? null,
            establishedSince: dev.establishedSince ?? null,
            numProjectsOnline: dev.numProjectsOnline ?? null,
            devPageEnabled: dev.devPageEnabled ?? null,
          },
        });
    }
  }

  for (const project of prepared.projects) {
    const values = projectToInsertValues(project, prepared.updatedAt);
    const existing = await db
      .select({
        brochureUrl: projects.brochureUrl,
        description: projects.description,
        amenities: projects.amenities,
        masterPlanUrl: projects.masterPlanUrl,
        videoUrl: projects.videoUrl,
        imageGallery: projects.imageGallery,
      })
      .from(projects)
      .where(eq(projects.id, project.id))
      .get();

    const merged = {
      ...values,
      brochureUrl: values.brochureUrl ?? existing?.brochureUrl ?? null,
      description: values.description ?? existing?.description ?? null,
      amenities: values.amenities ?? existing?.amenities ?? null,
      masterPlanUrl: values.masterPlanUrl ?? existing?.masterPlanUrl ?? null,
      videoUrl: values.videoUrl ?? existing?.videoUrl ?? null,
      imageGallery: values.imageGallery ?? existing?.imageGallery ?? null,
    };

    // first_seen_at is INSERT-ONLY (this ingest run's date): it must be
    // present in values so brand-new projects get stamped, but EXCLUDED from
    // the onConflictDoUpdate set so existing rows keep their original date —
    // it is what "new launch this week" alerts key off.
    await db
      .insert(projects)
      .values({ ...merged, firstSeenAt: prepared.updatedAt })
      .onConflictDoUpdate({
        target: projects.id,
        set: merged,
      });
  }

  const activeProjectIds = prepared.projects.map((p) => p.id);

  for (const projectId of activeProjectIds) {
    await d1
      .prepare("DELETE FROM project_units WHERE project_id = ?")
      .bind(projectId)
      .run();
    await d1
      .prepare("DELETE FROM catalog_units WHERE project_id = ?")
      .bind(projectId)
      .run();
  }

  for (const batch of chunk(prepared.projectUnits, UNIT_BATCH)) {
    const statements = batch.map((unit) =>
      d1
        .prepare(
          `INSERT INTO project_units (id, project_id, beds, sqft_min, sqft_max, launch_price_aed, launch_price_max_aed, property_type, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             project_id = excluded.project_id,
             beds = excluded.beds,
             sqft_min = excluded.sqft_min,
             sqft_max = excluded.sqft_max,
             launch_price_aed = excluded.launch_price_aed,
             launch_price_max_aed = excluded.launch_price_max_aed,
             property_type = excluded.property_type,
             sort_order = excluded.sort_order`,
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
        ),
    );
    await d1.batch(statements);
  }

  for (const batch of chunk(prepared.catalogUnits, UNIT_BATCH)) {
    const statements = batch.map((unit) => {
      const values = catalogUnitToInsertValues(unit);
      return d1
        .prepare(
          `INSERT INTO catalog_units (
            id, project_id, project_slug, project_name, pf_slug, developer, developer_logo,
            city, city_slug, area, location_full, property_type, beds, sqft_min, sqft_max,
            launch_price_aed, launch_price_max_aed, payment_plan, payment_plan_count, handover,
            is_premium, image_url, image_gallery, video_available, lat, lng,
            project_unit_count, whatsapp, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            project_id = excluded.project_id,
            project_slug = excluded.project_slug,
            project_name = excluded.project_name,
            pf_slug = excluded.pf_slug,
            developer = excluded.developer,
            developer_logo = excluded.developer_logo,
            city = excluded.city,
            city_slug = excluded.city_slug,
            area = excluded.area,
            location_full = excluded.location_full,
            property_type = excluded.property_type,
            beds = excluded.beds,
            sqft_min = excluded.sqft_min,
            sqft_max = excluded.sqft_max,
            launch_price_aed = excluded.launch_price_aed,
            launch_price_max_aed = excluded.launch_price_max_aed,
            payment_plan = excluded.payment_plan,
            payment_plan_count = excluded.payment_plan_count,
            handover = excluded.handover,
            is_premium = excluded.is_premium,
            image_url = excluded.image_url,
            image_gallery = excluded.image_gallery,
            video_available = excluded.video_available,
            lat = excluded.lat,
            lng = excluded.lng,
            project_unit_count = excluded.project_unit_count,
            whatsapp = excluded.whatsapp,
            status = excluded.status`,
        )
        .bind(
          values.id,
          values.projectId,
          values.projectSlug,
          values.projectName,
          values.pfSlug,
          values.developer,
          values.developerLogo,
          values.city,
          values.citySlug,
          values.area,
          values.locationFull,
          values.propertyType,
          values.beds,
          values.sqftMin,
          values.sqftMax,
          values.launchPriceAed,
          values.launchPriceMaxAed,
          values.paymentPlan,
          values.paymentPlanCount,
          values.handover,
          values.isPremium ? 1 : 0,
          values.imageUrl,
          values.imageGallery,
          values.videoAvailable ? 1 : 0,
          values.lat,
          values.lng,
          values.projectUnitCount,
          values.whatsapp,
          values.status,
        );
    });
    await d1.batch(statements);
  }

  return {
    projects: prepared.projects.length,
    projectUnits: prepared.projectUnits.length,
    catalogUnits: prepared.catalogUnits.length,
    developers: prepared.devList.length,
    skippedDuplicateSlugs: prepared.skippedDuplicateSlugs.length,
    skippedDuplicateUnitIds: prepared.skippedDuplicateUnitIds.length,
    scrapedAt: raw.scrapedAt,
  };
}