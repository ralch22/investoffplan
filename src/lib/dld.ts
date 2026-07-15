/**
 * DLD market-analytics — pure helpers (anonymized aggregates ONLY).
 *
 * Source: official Dubai Land Department open data (Transactions, Rent_Contracts,
 * Oa_Service_Charges, Projects, Buildings, Land_Registry, Developers,
 * Accredited_Escrow_Agents). We compute area/project/building cohort aggregates
 * (median price, AED/sqft, volume, trend, gross/net rental yield, appreciation)
 * — the manziliq-style market insight — and surface them on
 * listings + project pages.
 *
 * DATA-GOVERNANCE GUARDRAIL (hard constraint):
 *   These helpers and everything downstream operate on ANONYMIZED aggregates.
 *   Owner-identifying data — names, mobiles, emails, passport / Emirates-ID /
 *   unified numbers, dates of birth, nationality — must NEVER be ingested into
 *   or displayed by the public app. Some DLD exports seen in the wild are
 *   PII-enriched; `detectPiiColumns()` is the import-time tripwire that flags
 *   such columns so the loader can DROP them before anything is stored. No
 *   counterparty identity is ever persisted for public use.
 *
 * Math only — no I/O, no DB. Unit-tested in tests/dld.test.ts.
 */

// ---------------------------------------------------------------------------
// PII guard — header-name based. Flags person/contact columns while allowing
// place / category "…NameEn" columns (AreaNameEn, BuildingNameEn, ProjectNameEn,
// ProcedureNameEn, PropertySubTypeNameEn, DeveloperNameEn, …) which are NOT PII.
// ---------------------------------------------------------------------------

/** Substrings that are unambiguously personal/contact data wherever they appear. */
const PII_ALWAYS = [
  'mobile', 'phone', 'fax', 'email', 'passport', 'birth', 'dob',
  'uaeid', 'emiratesid', 'idnumber', 'unifiednumber', 'nationality', 'gender',
] as const;

/**
 * Place/category qualifiers that make a "…name…" column non-personal. A header
 * containing "name" is treated as a person-name (PII) UNLESS it also contains
 * one of these (e.g. "AreaNameEn" → area → allowed; "OwnerName" → none → PII).
 */
const NAME_QUALIFIERS_OK = [
  'area', 'project', 'building', 'master', 'procedure', 'property', 'usage',
  'room', 'zone', 'land', 'developer', 'landmark', 'metro', 'mall', 'school',
  'firm', 'company', 'organisation', 'organization', 'subtype', 'type', 'group',
  'status', 'bank', 'escrow', 'nearest', 'plot', 'unit', 'registration',
  'municipality', 'district', 'community', 'tower', 'compound',
] as const;

/** True if a CSV column header looks like owner-identifying / contact data. */
export function isPiiColumn(header: string): boolean {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!h) return false;
  if (PII_ALWAYS.some((t) => h.includes(t))) return true;
  if (h.includes('name')) {
    // a bare/personal name unless qualified by a place/category noun
    return !NAME_QUALIFIERS_OK.some((t) => h.includes(t));
  }
  return false;
}

/** The subset of headers that must be dropped before ingest (the tripwire list). */
export function detectPiiColumns(headers: string[]): string[] {
  return headers.filter(isPiiColumn);
}

// ---------------------------------------------------------------------------
// Canonical (post-mapping) shapes — what the rollups consume. PII-free by design.
// ---------------------------------------------------------------------------

export interface DldSale {
  area: string;
  project?: string | null;
  building?: string | null;
  beds?: number | null; // normalized bedroom count (Studio = 0)
  amount: number; // AED sale price
  sizeSqm: number; // m²
  date: string; // ISO transaction date (YYYY-MM-DD)
  /** DLD IS_OFFPLAN_EN: "Off-Plan" | "Ready" → registration type at sale. */
  regType?: 'off-plan' | 'ready' | null;
}

export interface DldRent {
  area: string;
  project?: string | null;
  building?: string | null;
  beds?: number | null;
  annualRent: number; // AED / year
}

export type Confidence = 'high' | 'medium' | 'low' | 'none';

/** Below this many comparable transactions we show "not enough data", never a number. */
export const MIN_DLD_SAMPLE = 8;

/**
 * Sane AED/sqft band. Values outside are data errors (a 1 AED/sqft entry, or a
 * whole-building sale mislabeled as a unit) and are dropped from medians/trend
 * so outliers can't blow up the median or appreciation.
 */
export const PPSQFT_MIN = 100;
export const PPSQFT_MAX = 50000;

const SQM_TO_SQFT = 10.7639;
export function sqmToSqft(sqm: number): number {
  return sqm * SQM_TO_SQFT;
}

/** Median of the positive, finite values (null when none). */
export function median(nums: number[]): number | null {
  const xs = nums.filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

/** AED per sqft from an amount + size in m² (null when either is non-positive). */
export function ppsqft(amount: number, sizeSqm: number): number | null {
  const sqft = sqmToSqft(sizeSqm);
  if (!Number.isFinite(amount) || amount <= 0 || sqft <= 0) return null;
  return amount / sqft;
}

export function confidenceFor(sample: number): Confidence {
  if (sample >= 40) return 'high';
  if (sample >= 15) return 'medium';
  if (sample >= MIN_DLD_SAMPLE) return 'low';
  return 'none';
}

/** "Studio" → 0, "1 B/R"/"1 BR"/"1 Bedroom" → 1, penthouse/office/unknown → null. */
export function bedsFromRooms(rooms?: string | null): number | null {
  if (!rooms) return null;
  const s = rooms.toLowerCase();
  if (s.includes('studio')) return 0;
  const m = s.match(/(\d+)\s*(?:b\s*\/?\s*r|bed|bhk|br\b)/);
  if (m) return Number(m[1]);
  const lead = s.match(/^\s*(\d+)\b/);
  return lead ? Number(lead[1]) : null;
}

export interface SaleStats {
  count: number;
  medianPrice: number | null;
  medianPpsqft: number | null;
  monthlyTrend: { month: string; medianPpsqft: number; n: number }[];
  appreciationPct: number | null; // first solid month vs last solid month
  sample: number;
  confidence: Confidence;
}

/** Cohort sale aggregates over a set of (already area/project/beds-filtered) sales. */
export function saleStats(sales: DldSale[]): SaleStats {
  const prices = sales.map((s) => s.amount);
  const ppsfs = sales
    .map((s) => ppsqft(s.amount, s.sizeSqm))
    .filter((n): n is number => n != null && n >= PPSQFT_MIN && n <= PPSQFT_MAX);

  const byMonth = new Map<string, number[]>();
  for (const s of sales) {
    const p = ppsqft(s.amount, s.sizeSqm);
    const month = (s.date || '').slice(0, 7);
    if (p == null || p < PPSQFT_MIN || p > PPSQFT_MAX || !/^\d{4}-\d{2}$/.test(month)) continue;
    const arr = byMonth.get(month);
    if (arr) arr.push(p);
    else byMonth.set(month, [p]);
  }
  const monthlyTrend = [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([month, arr]) => ({ month, medianPpsqft: median(arr) ?? 0, n: arr.length }))
    .filter((t) => t.n > 0 && t.medianPpsqft > 0);

  let appreciationPct: number | null = null;
  const solid = monthlyTrend.filter((t) => t.n >= 2);
  if (solid.length >= 2) {
    const first = solid[0].medianPpsqft;
    const last = solid[solid.length - 1].medianPpsqft;
    if (first > 0) appreciationPct = ((last - first) / first) * 100;
  }
  // Drop implausible appreciation (sparse-month outliers) rather than store noise.
  if (appreciationPct != null && (!Number.isFinite(appreciationPct) || Math.abs(appreciationPct) > 300)) {
    appreciationPct = null;
  }

  const sample = sales.length;
  return {
    count: sample,
    medianPrice: median(prices),
    medianPpsqft: median(ppsfs),
    monthlyTrend,
    appreciationPct,
    sample,
    confidence: confidenceFor(sample),
  };
}

/** Gross rental yield % = annual rent / sale price. */
export function grossYieldPct(
  medianAnnualRent: number | null,
  medianSalePrice: number | null,
): number | null {
  if (!medianAnnualRent || !medianSalePrice || medianSalePrice <= 0) return null;
  const y = (medianAnnualRent / medianSalePrice) * 100;
  return y > 0 && y <= 100 ? y : null; // > 100% gross yield is impossible → bad data
}

/** Annual service-charge as a % of sale price (the drag to subtract from gross). */
export function serviceChargeYieldPct(
  serviceChargePsf: number | null,
  medianSizeSqft: number | null,
  medianSalePrice: number | null,
): number | null {
  if (!serviceChargePsf || !medianSizeSqft || !medianSalePrice || medianSalePrice <= 0) return null;
  return ((serviceChargePsf * medianSizeSqft) / medianSalePrice) * 100;
}

/** Net yield % = gross − service-charge drag (null when gross is unknown). */
export function netYieldPct(
  grossPct: number | null,
  serviceChargeDragPct: number | null,
): number | null {
  if (grossPct == null) return null;
  return grossPct - (serviceChargeDragPct ?? 0);
}

/**
 * A listing's AED/sqft vs the cohort median. Negative = below market (good for
 * a buyer). null when we lack a reliable median.
 */
export function vsMarketPct(
  listingPpsqft: number | null,
  medianPpsqft: number | null,
): number | null {
  if (!listingPpsqft || !medianPpsqft || medianPpsqft <= 0) return null;
  return ((listingPpsqft - medianPpsqft) / medianPpsqft) * 100;
}

// ---------------------------------------------------------------------------
// CSV parsing + source→canonical mappers (official DLD open-data schema).
// The mappers reference ONLY non-PII columns; owner/contact fields are never
// read, so no identity can flow downstream even if a future export adds them.
// ---------------------------------------------------------------------------

/** Quote-aware split of a single CSV line (handles "" escapes + commas in quotes). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/**
 * DLD "official" area names ↔ common marketing community names. DLD files
 * register many communities under their cadastral name (and aren't even
 * consistent across the sales vs rent exports), so the join needs this synonym
 * table. Keys + values are pre-normalized (upper, single-spaced). This is the
 * single biggest lever on join accuracy — extend it as we validate communities.
 */
export const AREA_ALIASES: Record<string, string> = {
  // DLD cadastral name → community (merges the DLD side into the community bucket).
  'MARSA DUBAI': 'DUBAI MARINA',
  'AL BARSHA SOUTH FOURTH': 'JUMEIRAH VILLAGE CIRCLE',
  'AL THANYAH FIFTH': 'JUMEIRAH LAKES TOWERS',
  'AL THANYAH THIRD': 'THE GREENS',
  'BURJ KHALIFA': 'DOWNTOWN DUBAI',
  'AL HEBIAH FOURTH': 'DUBAI SPORTS CITY',
  'AL HEBIAH FIFTH': 'DUBAI STUDIO CITY',
  'WADI AL SAFA 5': 'AL BARARI',
  // Listing community-name variants → the DLD area key actually stored, so a
  // listing resolves to its area's stats. (Genuinely-ambiguous master communities
  // like "Dubai Land" / "MBR City" / "Damac Lagoons" span many DLD areas and are
  // deliberately left unmatched rather than shown wrong-area stats.)
  'DUBAI HILLS ESTATE': 'DUBAI HILLS',
  'DUBAI CREEK HARBOUR THE LAGOONS': 'DUBAI CREEK HARBOUR',
  'JUMEIRAH LAKE TOWERS': 'JUMEIRAH LAKES TOWERS',
  'DUBAI PRODUCTION CITY IMPZ': 'DUBAI PRODUCTION CITY',
  'DUBAI SOUTH DUBAI WORLD CENTRAL': 'DUBAI SOUTH',
  'DUBAI SILICON OASIS': 'SILICON OASIS',
  'MARITIME CITY': 'DUBAI MARITIME CITY',
  'DUBAI ISLANDS': 'PALM DEIRA',
  'AL JADDAF': 'AL JADAF',
  'NAD AL SHEBA': 'NAD AL SHIBA FIRST',
  // IOP marketing names → the DLD community that carries the data (targets
  // verified present in the 2025 dataset). Ambiguous masters (Dubai Land,
  // Meydan-wide) deliberately left out to avoid wrong-area stats.
  'ARABIAN RANCHES 3': 'ARABIAN RANCHES III',
  'ARABIAN RANCHES 2': 'ARABIAN RANCHES II',
  'PALM JEBEL ALI': 'PALM JABAL ALI',
  'MOHAMMED BIN RASHID CITY': 'HADAEQ SHEIKH MOHAMMED BIN RASHID',
  'DUBAI INVESTMENT PARK DIP': 'DUBAI INVESTMENT PARK SECOND',
  'DUBAI INVESTMENT PARK': 'DUBAI INVESTMENT PARK SECOND',
};

/**
 * Canonical join key for an area/community name: upper-cased, punctuation
 * collapsed to single spaces, trimmed, then mapped through {@link AREA_ALIASES}
 * so both sides (DLD `AREA_EN` and our listings' `community`) land on one key.
 */
export function areaKey(name?: string | null): string {
  const k = (name ?? '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
  return AREA_ALIASES[k] ?? k;
}

/**
 * Map a DLD monthly TRANSACTIONS row → a canonical residential DldSale, or null
 * to skip (non-sale procedure, non-residential, land, or unusable numbers).
 * Columns: GROUP_EN, USAGE_EN, PROP_TYPE_EN, AREA_EN, PROJECT_EN, TRANS_VALUE,
 * ACTUAL_AREA/PROCEDURE_AREA, ROOMS_EN, INSTANCE_DATE.
 */
export function mapSaleRow(r: Record<string, string>): DldSale | null {
  if ((r.GROUP_EN || '').trim().toLowerCase() !== 'sales') return null;
  if ((r.USAGE_EN || '').trim().toLowerCase() !== 'residential') return null;
  if ((r.PROP_TYPE_EN || '').trim().toLowerCase() === 'land') return null;
  const area = (r.AREA_EN || '').trim();
  const amount = Number(r.TRANS_VALUE);
  const sizeSqm = Number(r.ACTUAL_AREA || r.PROCEDURE_AREA);
  const date = (r.INSTANCE_DATE || '').slice(0, 10);
  if (!area || !(amount > 0) || !(sizeSqm > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const offplanFlag = (r.IS_OFFPLAN_EN || '').trim().toLowerCase();
  return {
    area,
    project: (r.PROJECT_EN || '').trim() || null,
    building: null,
    beds: bedsFromRooms(r.ROOMS_EN),
    amount,
    sizeSqm,
    date,
    regType:
      offplanFlag === 'off-plan' ? 'off-plan' : offplanFlag === 'ready' ? 'ready' : null,
  };
}

/**
 * Map a DLD monthly RENTS row → a canonical residential DldRent, or null.
 * Columns: USAGE_EN, AREA_EN, PROJECT_EN, ANNUAL_AMOUNT, ROOMS.
 */
export function mapRentRow(r: Record<string, string>): DldRent | null {
  if ((r.USAGE_EN || '').trim().toLowerCase() !== 'residential') return null;
  const area = (r.AREA_EN || '').trim();
  const annualRent = Number(r.ANNUAL_AMOUNT);
  if (!area || !(annualRent > 0)) return null;
  return {
    area,
    project: (r.PROJECT_EN || '').trim() || null,
    building: null,
    beds: bedsFromRooms(r.ROOMS),
    annualRent,
  };
}

// ---------------------------------------------------------------------------
// Project + developer registries (off-plan trust). Mappers reference only
// non-PII columns — developer phone/fax are never read.
// ---------------------------------------------------------------------------

/** Generic normalized key for a name (upper, punctuation→space, trimmed). */
export function nameKey(name?: string | null): string {
  return (name ?? '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
}
export const projectKey = nameKey;

export interface DldProject {
  projectKey: string;
  projectName: string;
  developerName: string | null;
  area: string | null;
  masterProject: string | null;
  status: string | null;
  percentCompleted: number | null;
  completionDate: string | null; // ISO date
  hasEscrow: boolean;
  unitCount: number | null;
}

export interface DldDeveloper {
  developerKey: string;
  developerName: string;
  registeredAt: string | null;
  licenseExpiry: string | null;
  legalStatus: string | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isoDate = (s?: string | null): string | null => {
  const d = (s ?? '').slice(0, 10);
  return ISO_DATE.test(d) ? d : null;
};

/** Map a DLD Projects row → canonical DldProject (or null if unnamed). */
export function mapProjectRow(r: Record<string, string>): DldProject | null {
  const projectName = (r.PROJECT_EN || '').trim();
  if (!projectName) return null;
  const pct = Number(r.PERCENT_COMPLETED);
  const units = Number(r.CNT_UNIT);
  return {
    projectKey: projectKey(projectName),
    projectName,
    developerName: (r.DEVELOPER_EN || '').trim() || null,
    area: (r.AREA_EN || '').trim() || null,
    masterProject: (r.MASTER_PROJECT_EN || '').trim() || null,
    status: (r.PROJECT_STATUS || '').trim() || null,
    percentCompleted: Number.isFinite(pct) && pct >= 0 && pct <= 100 ? pct : null,
    completionDate: isoDate(r.COMPLETION_DATE),
    hasEscrow: (r.ESCROW_ACCOUNT_NUMBER || '').trim().length > 0,
    unitCount: Number.isFinite(units) && units > 0 ? units : null,
  };
}

/** Map a DLD Developers row → canonical DldDeveloper (phone/fax never read). */
export function mapDeveloperRow(r: Record<string, string>): DldDeveloper | null {
  const developerName = (r.DEVELOPER_EN || '').trim();
  if (!developerName) return null;
  return {
    developerKey: nameKey(developerName),
    developerName,
    registeredAt: isoDate(r.REGISTRATION_DATE),
    licenseExpiry: isoDate(r.LICENSE_EXPIRY_DATE),
    legalStatus: (r.LEGAL_STATUS_EN || '').trim() || null,
  };
}
