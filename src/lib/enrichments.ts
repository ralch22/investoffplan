import stored from "../../data/project-enrichments.json";
import type { ProjectEnrichment } from "./enrichment";

export interface EnrichmentStore {
  version: 1;
  updatedAt: string;
  projects: Record<string, ProjectEnrichment>;
}

// The stored file may carry `brochureUrl: null` — the marker written by
// scripts/clean-enrichment-brochures.ts for third-party (non-/cdn) brochures
// that are never surfaced. Type the raw store loosely so the JSON import checks,
// then normalize null → undefined in getEnrichment so every consumer sees the
// clean `string | undefined` shape and no null ever reaches the UI.
type StoredEnrichment = Omit<ProjectEnrichment, "brochureUrl"> & {
  brochureUrl?: string | null;
};
const store = stored as {
  version: 1;
  updatedAt: string;
  projects: Record<string, StoredEnrichment>;
};

export function getEnrichment(slug: string): ProjectEnrichment | null {
  const entry = store.projects[slug];
  if (!entry) return null;
  return entry.brochureUrl
    ? (entry as ProjectEnrichment)
    : { ...entry, brochureUrl: undefined };
}

export function getEnrichmentMeta() {
  return {
    updatedAt: store.updatedAt,
    count: Object.keys(store.projects).length,
  };
}