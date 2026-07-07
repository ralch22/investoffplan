import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { ProjectEnrichment } from "./enrichment";

const DATA_PATH = join(process.cwd(), "data", "project-enrichments.json");

export interface EnrichmentStore {
  version: 1;
  updatedAt: string;
  projects: Record<string, ProjectEnrichment>;
}

function emptyStore(): EnrichmentStore {
  return { version: 1, updatedAt: new Date().toISOString(), projects: {} };
}

export function loadEnrichments(): EnrichmentStore {
  if (!existsSync(DATA_PATH)) return emptyStore();
  try {
    const raw = readFileSync(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as EnrichmentStore;
    if (parsed?.version === 1 && parsed.projects) return parsed;
  } catch {
    /* fall through */
  }
  return emptyStore();
}

export function saveEnrichments(store: EnrichmentStore): void {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  store.updatedAt = new Date().toISOString();
  writeFileSync(DATA_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}