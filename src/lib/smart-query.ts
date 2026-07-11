// Pure, client-safe smart-query parser — natural language (EN + AR) → SERP
// filters + matched entities. No server imports; index comes from
// buildSuggestIndex(), aliases from search-aliases.ts.
import type { CitySlug, PropertyType, PaymentPlanFilter } from "@/lib/types";
import { SEARCH_ALIASES, type SearchAlias } from "@/lib/search-aliases";
import { normText, type SuggestIndex } from "@/lib/suggest-index";

export interface SmartQueryFilters {
  city?: CitySlug;
  beds?: number | "studio";
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  handoverBy?: number;
  paymentPlan?: Exclude<PaymentPlanFilter, "all">;
  query?: string;
}

export type MatchedKind = "community" | "developer" | "project" | "city";

export interface MatchedEntity {
  kind: MatchedKind;
  label: string;
  slug: string;
}

export interface SmartQueryResult {
  filters: SmartQueryFilters;
  intent?: "yield" | null;
  matched: MatchedEntity[];
  residual: string;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

const ARABIC_INDIC_ZERO = 0x0660; // ٠-٩
const EXT_ARABIC_INDIC_ZERO = 0x06f0; // ۰-۹

function asciiDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const base = code >= EXT_ARABIC_INDIC_ZERO ? EXT_ARABIC_INDIC_ZERO : ARABIC_INDIC_ZERO;
    return String(code - base);
  });
}

function normalizeInput(text: string): string {
  return normText(asciiDigits(text))
    // Thousand separators inside numbers: "1,500,000" → "1500000".
    .replace(/(\d)[,،](?=\d)/g, "$1");
}

// Alias keys are authored pre-normalized, but re-normalize defensively once.
const NORMALIZED_ALIASES: Map<string, SearchAlias> = new Map(
  Object.entries(SEARCH_ALIASES).map(([k, v]) => [normText(k), v]),
);

// ---------------------------------------------------------------------------
// Amounts
// ---------------------------------------------------------------------------

const MAGNITUDES: Record<string, number> = {
  k: 1e3,
  thousand: 1e3,
  الف: 1e3,
  m: 1e6,
  mn: 1e6,
  million: 1e6,
  مليون: 1e6,
};

const NUM = String.raw`(\d+(?:\.\d+)?)`;
const MAG = `(k|mn|m|million|thousand|الف|مليون)`;
// number w/ optional magnitude, or a bare magnitude word ("under a million").
const VAL = `(?:${NUM}\\s*(?:${MAG}(?!\\p{L}))?|(?:a\\s+)?${MAG}(?!\\p{L}))`;

function parseAmount(
  num: string | undefined,
  mag: string | undefined,
  bareMag: string | undefined,
): number {
  const coefficient = num ? Number(num) : 1;
  const multiplier = MAGNITUDES[mag ?? bareMag ?? ""] ?? 1;
  return Math.round(coefficient * multiplier);
}

// ---------------------------------------------------------------------------
// Consuming passes — each returns the text with the matched span blanked out.
// ---------------------------------------------------------------------------

interface PassState {
  text: string;
  filters: SmartQueryFilters;
  intent: "yield" | null;
}

function consume(state: PassState, re: RegExp, onMatch: (m: RegExpExecArray) => void): void {
  const match = re.exec(state.text);
  if (!match) return;
  onMatch(match);
  state.text = `${state.text.slice(0, match.index)} ${state.text.slice(match.index + match[0].length)}`;
}

const BETWEEN_RE = new RegExp(
  `between\\s+${NUM}\\s*(?:${MAG}(?!\\p{L}))?\\s+and\\s+${NUM}\\s*(?:${MAG}(?!\\p{L}))?`,
  "u",
);
const RANGE_RE = new RegExp(
  `${NUM}\\s*(?:${MAG}(?!\\p{L}))?\\s*(?:-|–|—|to|الى|حتى)\\s*${NUM}\\s*(?:${MAG}(?!\\p{L}))?`,
  "u",
);
const MAX_RE = new RegExp(
  `(?:^|\\s)(?:under|below|max(?:imum)?|up to|less than|اقل من|تحت)\\s*${VAL}`,
  "u",
);
const MIN_RE = new RegExp(
  `(?:^|\\s)(?:over|above|at least|starting(?: from)?|from|فوق|من)\\s*${VAL}`,
  "u",
);

function pricePass(state: PassState): void {
  const onRange = (m: RegExpExecArray) => {
    const [, n1, mag1, n2, mag2] = m;
    // Suffix magnitude distributes across the range: "1-2m" → 1m–2m.
    state.filters.minPrice = parseAmount(n1, mag1 ?? mag2, undefined);
    state.filters.maxPrice = parseAmount(n2, mag2 ?? mag1, undefined);
  };
  consume(state, BETWEEN_RE, onRange);
  if (state.filters.minPrice === undefined) consume(state, RANGE_RE, onRange);
  consume(state, MAX_RE, (m) => {
    state.filters.maxPrice = parseAmount(m[1], m[2], m[3]);
  });
  consume(state, MIN_RE, (m) => {
    state.filters.minPrice = parseAmount(m[1], m[2], m[3]);
  });
}

function bedsPass(state: PassState): void {
  // SERP encodes studios as beds="studio" (see projects-search-sync + filterUnits).
  consume(state, /(?:^|\s)(studios?|ستوديو|استوديو)(?=\s|$)/u, () => {
    state.filters.beds = "studio";
  });
  if (state.filters.beds !== undefined) return;
  consume(state, /(?:^|\s)(\d+)\s*(?:br|beds?|bedrooms?|غرفة|غرفه|غرف)(?!\p{L})/u, (m) => {
    state.filters.beds = Number(m[1]);
  });
}

const TYPE_PATTERNS: Array<[RegExp, PropertyType]> = [
  [/(?:^|\s)(apartments?|flats?|شقق|شقة)(?=\s|$)/u, "apartment"],
  [/(?:^|\s)(villas?|فلل|فيلات|فيلا)(?=\s|$)/u, "villa"],
  [/(?:^|\s)(town\s?houses?|تاون\s?هاوس)(?=\s|$)/u, "townhouse"],
  [/(?:^|\s)(penthouses?|بنتهاوس)(?=\s|$)/u, "penthouse"],
  [/(?:^|\s)(duplex(?:es)?|دوبلكس)(?=\s|$)/u, "duplex"],
];

function typePass(state: PassState): void {
  for (const [re, type] of TYPE_PATTERNS) {
    let hit = false;
    consume(state, re, () => {
      state.filters.propertyType = type;
      hit = true;
    });
    if (hit) return;
  }
}

function handoverPass(state: PassState): void {
  consume(state, /(?:by|before|handover(?:\s+(?:by|in))?|ready(?:\s+(?:by|in))?|تسليم)\s*(20\d\d)/u, (m) => {
    state.filters.handoverBy = Number(m[1]);
  });
}

function paymentPlanPass(state: PassState): void {
  consume(state, /post[\s-]*handover/u, () => {
    state.filters.paymentPlan = "post-handover";
  });
}

function yieldPass(state: PassState): void {
  consume(
    state,
    /(?:^|\s)(?:(?:high(?:est)?|best|top|good)\s+)?(?:yields?|roi|rental\s+returns?|عائد|عوائد)(?!\p{L})/u,
    () => {
      state.intent = "yield";
    },
  );
}

// ---------------------------------------------------------------------------
// Entity matching over leftover tokens
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  "in", "at", "the", "a", "an", "for", "with", "near", "of", "and", "or",
  "buy", "new", "off", "plan", "offplan", "off-plan",
  "property", "properties", "project", "projects", "homes", "home",
  "في", "ب", "على", "مع", "عقار", "عقارات", "مشروع", "مشاريع", "شراء", "للبيع",
]);

function resolveEntity(candidate: string, index: SuggestIndex): MatchedEntity | null {
  // 1. Exact alias.
  const alias = NORMALIZED_ALIASES.get(candidate);
  if (alias) return { kind: alias.kind, label: alias.label, slug: alias.slug };

  // 2. Exact normalized-name match (communities → developers → projects).
  const exactCommunity = index.communities.find((c) => c.norm === candidate);
  if (exactCommunity) {
    return { kind: "community", label: exactCommunity.name, slug: exactCommunity.slug };
  }
  const exactDev = index.developers.find((d) => d.norm === candidate);
  if (exactDev) return { kind: "developer", label: exactDev.name, slug: exactDev.slug };
  const exactProject = index.projects.find((p) => p.norm === candidate);
  if (exactProject) {
    return { kind: "project", label: exactProject.name, slug: exactProject.slug };
  }

  if (candidate.length < 3) return null;

  // 3. Prefix match.
  const prefixCommunity = index.communities.find((c) => c.norm.startsWith(`${candidate} `));
  if (prefixCommunity) {
    return { kind: "community", label: prefixCommunity.name, slug: prefixCommunity.slug };
  }
  const prefixDev = index.developers.find((d) => d.norm.startsWith(`${candidate} `));
  if (prefixDev) return { kind: "developer", label: prefixDev.name, slug: prefixDev.slug };
  const prefixProject = index.projects.find((p) => p.norm.startsWith(candidate));
  if (prefixProject) {
    return { kind: "project", label: prefixProject.name, slug: prefixProject.slug };
  }

  // 4. Token-subset match (all candidate tokens appear in the entity name) —
  //    multi-token candidates only, to keep single-word noise out.
  const tokens = candidate.split(" ");
  if (tokens.length < 2) return null;
  const containsAll = (norm: string) => {
    const entityTokens = new Set(norm.split(" "));
    return tokens.every((t) => entityTokens.has(t));
  };
  const subsetCommunity = index.communities.find((c) => containsAll(c.norm));
  if (subsetCommunity) {
    return { kind: "community", label: subsetCommunity.name, slug: subsetCommunity.slug };
  }
  const subsetProject = index.projects.find((p) => containsAll(p.norm));
  if (subsetProject) {
    return { kind: "project", label: subsetProject.name, slug: subsetProject.slug };
  }
  return null;
}

const MAX_NGRAM = 4;

function entityPass(
  text: string,
  index: SuggestIndex,
  filters: SmartQueryFilters,
  matched: MatchedEntity[],
): string {
  const tokens = text.split(/\s+/).filter((t) => t && !STOPWORDS.has(t));
  const residual: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    let hit: MatchedEntity | null = null;
    let consumed = 0;
    for (let len = Math.min(MAX_NGRAM, tokens.length - i); len >= 1; len--) {
      const candidate = tokens.slice(i, i + len).join(" ");
      hit = resolveEntity(candidate, index);
      if (hit) {
        consumed = len;
        break;
      }
    }
    if (!hit) {
      residual.push(tokens[i]);
      i += 1;
      continue;
    }
    if (!matched.some((m) => m.kind === hit!.kind && m.slug === hit!.slug)) {
      matched.push(hit);
    }
    if (hit.kind === "city") {
      // City entities only come from the (verified) alias map.
      filters.city = hit.slug as CitySlug;
    } else if (hit.kind === "community" && filters.city === undefined) {
      const community = index.communities.find((c) => c.slug === hit!.slug);
      if (community) filters.city = community.city as CitySlug;
    }
    i += consumed;
  }
  return residual.join(" ");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function parseSmartQuery(text: string, index: SuggestIndex): SmartQueryResult {
  const state: PassState = {
    text: normalizeInput(text),
    filters: {},
    intent: null,
  };
  if (!state.text) {
    return { filters: {}, intent: null, matched: [], residual: "" };
  }

  pricePass(state); // (b) price expressions
  bedsPass(state); // (c) beds / studio
  typePass(state); // (d) property type
  paymentPlanPass(state); // (f) post-handover plan — before (e) so its
  // "handover" token isn't swallowed by the handover-year pass
  handoverPass(state); // (e) handover year
  yieldPass(state); // (g) yield intent

  const matched: MatchedEntity[] = [];
  const residual = entityPass(state.text, index, state.filters, matched); // (h)+(i)

  return { filters: state.filters, intent: state.intent, matched, residual };
}
