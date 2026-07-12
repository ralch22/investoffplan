/**
 * Permanent slug ownership for known catalog twins — different projects that
 * scrape to the same PF-derived slug. Keyed by stable project id so renames
 * never depend on catalog row order (order-dependent first-wins would
 * bait-and-switch the surviving URL whenever scrape order flipped).
 *
 * Winners keep the bare historical slug (SEO / existing links). Losers get a
 * short developer-token suffix matching `disambiguateSlug` in catalog-core.
 *
 * Leaf module (no catalog-core imports) so next.config.ts can share the
 * redirect map without pulling the full catalog stack.
 */

/** projectId → permanent canonical slug */
export const KNOWN_PROJECT_SLUG_RENAMES: Readonly<Record<string, string>> = {
  // Arthouse Residences — Cledor (winner keeps bare slug)
  "3e945687-4938-4ace-afdc-492a1e7797ab": "arthouse-residences",
  // Arthouse Residences — Aviaan
  "74b9fbee-85b9-433d-9953-2986159cf793": "arthouse-residences-aviaan",
  // Emerge Residences — NAAS Development (winner keeps bare slug)
  "294267ab-c22c-4b14-82be-0b33cc1036d3": "emerge-residences",
  // Émerge Residences — Elysian Development
  "a7b340ae-5517-4880-9e37-b919a164b941": "emerge-residences-elysian",
  // Nobu Residences — H&H Development Al Marjan (winner keeps bare slug)
  "91f91db5-a8e7-4998-8e07-e48c14186616": "nobu-residences",
  // Nobu Residences — Aldar Saadiyat
  "8e7d7b65-c663-4a2a-ae76-cc80be2d2074": "nobu-residences-aldar",
};

/**
 * Alias → canonical project-slug redirects (EN + /ar mirrored in next.config).
 *
 * Covers developer-token / full-developer-slug forms people (or older
 * disambiguation fallbacks) may hit. The surviving bare slugs
 * (`arthouse-residences`, `emerge-residences`, `nobu-residences`) are
 * intentionally absent — redirecting them would bait-and-switch the winner's SEO.
 */
export const PROJECT_SLUG_REDIRECTS: Readonly<Record<string, string>> = {
  // Aviaan twin — full developer slug form → short token form
  "arthouse-residences-aviaan-real-estate-development":
    "arthouse-residences-aviaan",
  // Cledor winner — developer-token form → bare surviving slug
  "arthouse-residences-cledor": "arthouse-residences",
  // Elysian twin — full developer slug form → short token form
  "emerge-residences-elysian-development": "emerge-residences-elysian",
  // NAAS winner — developer-token / full forms → bare surviving slug
  "emerge-residences-naas": "emerge-residences",
  "emerge-residences-naas-development": "emerge-residences",
  // Aldar twin — full developer slug form → short token form
  "nobu-residences-aldar-properties-pjsc": "nobu-residences-aldar",
  // H&H winner — developer-token forms → bare surviving slug
  "nobu-residences-h": "nobu-residences",
  "nobu-residences-h-h-development": "nobu-residences",
};
