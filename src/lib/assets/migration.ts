import type { CatalogFile } from "@/lib/catalog-core";
import type { Project } from "@/lib/types";
import {
  cdnUrlForKey,
  developerLogoKey,
  developerSlugFromName,
  isExternalAssetUrl,
  isHostedAssetUrl,
  projectBrochureKey,
  projectGalleryKey,
  projectHeroKey,
} from "./keys";

export interface AssetTask {
  key: string;
  sourceUrl: string;
  contentType: string;
  kind: "brochure" | "hero" | "gallery" | "developer-logo";
  projectSlug?: string;
  galleryIndex?: number;
  developerSlug?: string;
}

export interface AssetMigrationManifest {
  version: 1;
  updatedAt: string;
  uploaded: Record<string, { sourceUrl: string; uploadedAt: string; bytes: number }>;
  failed: Record<string, { sourceUrl: string; error: string; attempts: number }>;
}

export function createEmptyManifest(): AssetMigrationManifest {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    uploaded: {},
    failed: {},
  };
}

function contentTypeForKind(kind: AssetTask["kind"], key: string): string {
  if (kind === "brochure" || key.endsWith(".pdf")) return "application/pdf";
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export function collectAssetTasks(
  catalog: CatalogFile,
  opts?: { projectSlugs?: Set<string> },
): AssetTask[] {
  const tasks: AssetTask[] = [];
  const seenKeys = new Set<string>();
  const seenDeveloperLogos = new Set<string>();

  for (const project of catalog.projects) {
    if (opts?.projectSlugs && !opts.projectSlugs.has(project.slug)) continue;

    if (isExternalAssetUrl(project.brochureUrl)) {
      const key = projectBrochureKey(project.slug, project.brochureUrl);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        tasks.push({
          key,
          sourceUrl: project.brochureUrl,
          contentType: contentTypeForKind("brochure", key),
          kind: "brochure",
          projectSlug: project.slug,
        });
      }
    }

    if (isExternalAssetUrl(project.imageUrl)) {
      const key = projectHeroKey(project.slug, project.imageUrl);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        tasks.push({
          key,
          sourceUrl: project.imageUrl,
          contentType: contentTypeForKind("hero", key),
          kind: "hero",
          projectSlug: project.slug,
        });
      }
    }

    if (project.imageGallery?.length) {
      project.imageGallery.forEach((url, index) => {
        if (!isExternalAssetUrl(url)) return;
        const key = projectGalleryKey(project.slug, index, url);
        if (seenKeys.has(key)) return;
        seenKeys.add(key);
        tasks.push({
          key,
          sourceUrl: url,
          contentType: contentTypeForKind("gallery", key),
          kind: "gallery",
          projectSlug: project.slug,
          galleryIndex: index,
        });
      });
    }

    if (isExternalAssetUrl(project.developerLogo)) {
      const developerSlug = developerSlugFromName(project.developer);
      if (!seenDeveloperLogos.has(developerSlug)) {
        seenDeveloperLogos.add(developerSlug);
        const key = developerLogoKey(developerSlug, project.developerLogo);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          tasks.push({
            key,
            sourceUrl: project.developerLogo,
            contentType: contentTypeForKind("developer-logo", key),
            kind: "developer-logo",
            developerSlug,
          });
        }
      }
    }
  }

  return tasks;
}

export function applyHostedUrlsToCatalog(
  catalog: CatalogFile,
  manifest: AssetMigrationManifest,
): CatalogFile {
  const uploadedBySource = new Map<string, string>();
  for (const [key, entry] of Object.entries(manifest.uploaded)) {
    uploadedBySource.set(entry.sourceUrl, cdnUrlForKey(key));
  }

  const developerLogoBySlug = new Map<string, string>();
  for (const [key, entry] of Object.entries(manifest.uploaded)) {
    if (!key.startsWith("developers/")) continue;
    const slug = key.split("/")[1];
    developerLogoBySlug.set(slug, cdnUrlForKey(key));
  }

  const mapUrl = (url?: string) => {
    if (!url || isHostedAssetUrl(url)) return url;
    return uploadedBySource.get(url) ?? url;
  };

  const projects: Project[] = catalog.projects.map((project) => {
    const developerSlug = developerSlugFromName(project.developer);
    const hostedDeveloperLogo =
      developerLogoBySlug.get(developerSlug) ?? mapUrl(project.developerLogo);

    return {
      ...project,
      brochureUrl: mapUrl(project.brochureUrl),
      imageUrl: mapUrl(project.imageUrl),
      developerLogo: hostedDeveloperLogo,
      imageGallery: project.imageGallery?.map((url) => mapUrl(url) ?? url),
    };
  });

  const units = catalog.units.map((unit) => ({
    ...unit,
    imageUrl: mapUrl(unit.imageUrl),
    developerLogo: developerLogoBySlug.get(developerSlugFromName(unit.developer)) ??
      mapUrl(unit.developerLogo),
    imageGallery: unit.imageGallery?.map((url) => mapUrl(url) ?? url),
  }));

  const devList = catalog.devList?.map((dev) => ({
    ...dev,
    logoUrl: developerLogoBySlug.get(dev.slug) ?? mapUrl(dev.logoUrl),
  }));

  return {
    ...catalog,
    projects,
    units,
    devList,
  };
}

export async function downloadAsset(
  sourceUrl: string,
  signal?: AbortSignal,
): Promise<{ body: ArrayBuffer; contentType: string }> {
  const response = await fetch(sourceUrl, {
    signal,
    headers: {
      "user-agent":
        "InvestOffPlan-AssetMigrator/1.0 (+https://investoffplan.com; catalog-mirror)",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${sourceUrl}`);
  }

  const body = await response.arrayBuffer();
  if (!body.byteLength) {
    throw new Error(`Empty response for ${sourceUrl}`);
  }

  const contentType =
    response.headers.get("content-type")?.split(";")[0]?.trim() ||
    "application/octet-stream";

  return { body, contentType };
}

export async function uploadToR2(
  bucket: R2Bucket,
  task: AssetTask,
  body: ArrayBuffer,
  contentType: string,
): Promise<void> {
  await bucket.put(task.key, body, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      sourceUrl: task.sourceUrl,
      kind: task.kind,
    },
  });
}