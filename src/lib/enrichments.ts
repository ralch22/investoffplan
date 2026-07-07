import stored from "../../data/project-enrichments.json";
import type { ProjectEnrichment } from "./enrichment";

export interface EnrichmentStore {
  version: 1;
  updatedAt: string;
  projects: Record<string, ProjectEnrichment>;
}

const store = stored as EnrichmentStore;

export function getEnrichment(slug: string): ProjectEnrichment | null {
  return store.projects[slug] ?? null;
}

export function getEnrichmentMeta() {
  return {
    updatedAt: store.updatedAt,
    count: Object.keys(store.projects).length,
  };
}