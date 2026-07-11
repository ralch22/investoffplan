"use client";

import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate, localePath } from "@/i18n/config";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { fetchCatalogApi } from "@/lib/catalog-browser";
import type { CatalogApi, FlatUnit } from "@/lib/catalog-core";
import {
  buildSuggestIndex,
  normText,
  type SuggestIndex,
} from "@/lib/suggest-index";
import { parseSmartQuery, type SmartQueryResult } from "@/lib/smart-query";
import { SEARCH_ALIASES, type AliasKind } from "@/lib/search-aliases";
import { formatPrice } from "@/lib/format";
import type { ProjectFilters } from "@/lib/types";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// Module-level singletons — the index is built ONCE per page load and shared
// by every SearchSuggest instance (hero + header + sheet + drawer).
// ---------------------------------------------------------------------------

interface SuggestData {
  api: CatalogApi;
  index: SuggestIndex;
  units: FlatUnit[];
}

let suggestDataPromise: Promise<SuggestData> | null = null;

function loadSuggestData(): Promise<SuggestData> {
  if (!suggestDataPromise) {
    suggestDataPromise = fetchCatalogApi().then((api) => ({
      api,
      index: buildSuggestIndex(api),
      units: api.flattenCatalogUnits(),
    }));
  }
  return suggestDataPromise;
}

interface YieldCommunity {
  key: string;
  name?: string;
  grossYieldPct: number;
}

let yieldPromise: Promise<YieldCommunity[]> | null = null;
let yieldCache: YieldCommunity[] | null = null;

/** Lazy — only fetched once a query shows yield intent. */
function loadYieldCommunities(): Promise<YieldCommunity[]> {
  if (!yieldPromise) {
    yieldPromise = fetch("/data/yield-communities.json")
      .then((res) => (res.ok ? (res.json() as Promise<YieldCommunity[]>) : []))
      .then((rows) => {
        yieldCache = rows;
        return rows;
      })
      .catch(() => {
        yieldPromise = null;
        return [];
      });
  }
  return yieldPromise;
}

const EMPTY_INDEX: SuggestIndex = { projects: [], communities: [], developers: [] };

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function formatAedShort(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `AED ${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `AED ${Math.round(n / 1_000)}K`;
  return `AED ${n}`;
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

function smartLabel(parse: SmartQueryResult): string {
  const parts: string[] = parse.matched.map((m) => m.label);
  const f = parse.filters;
  if (f.beds !== undefined) parts.push(f.beds === "studio" ? "Studio" : `${f.beds} BR`);
  if (f.propertyType) parts.push(titleCase(f.propertyType));
  if (f.minPrice != null && f.maxPrice != null) {
    parts.push(`${formatAedShort(f.minPrice)}–${formatAedShort(f.maxPrice)}`);
  } else if (f.maxPrice != null) {
    parts.push(`under ${formatAedShort(f.maxPrice)}`);
  } else if (f.minPrice != null) {
    parts.push(`over ${formatAedShort(f.minPrice)}`);
  }
  if (f.handoverBy) parts.push(`by ${f.handoverBy}`);
  if (f.paymentPlan) parts.push("post-handover");
  if (parse.residual) parts.push(`“${parse.residual}”`);
  return parts.join(" · ");
}

/** Map parsed filters + matched entities → SERP filters and /projects URL. */
function smartSerp(parse: SmartQueryResult): { href: string; filters: ProjectFilters } {
  const f = parse.filters;
  const devSlug = parse.matched.find((m) => m.kind === "developer")?.slug;
  const areaLabel =
    parse.matched.find((m) => m.kind === "community")?.label ??
    parse.matched.find((m) => m.kind === "project")?.label;
  const q = [areaLabel, parse.residual].filter(Boolean).join(" ").trim();
  const filters: ProjectFilters = {
    query: q,
    city: f.city ?? "all",
    propertyType: f.propertyType ?? "all",
    beds: f.beds ?? "all",
    minPrice: f.minPrice ?? null,
    maxPrice: f.maxPrice ?? null,
    developer: devSlug ?? "all",
    paymentPlan: f.paymentPlan ?? "all",
    handoverBy: f.handoverBy ?? "all",
    amenities: [],
  };
  // Param names/format must match projects-search-sync.tsx exactly.
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (filters.city !== "all") params.set("city", filters.city);
  if (filters.beds !== "all") params.set("beds", String(filters.beds));
  if (filters.propertyType !== "all") params.set("type", filters.propertyType);
  if (filters.minPrice) params.set("minP", String(filters.minPrice));
  if (filters.maxPrice) params.set("maxP", String(filters.maxPrice));
  if (filters.developer !== "all") params.set("dev", filters.developer);
  if (filters.paymentPlan !== "all") params.set("pay", filters.paymentPlan);
  if (filters.handoverBy !== "all") params.set("handover", String(filters.handoverBy));
  const qs = params.toString();
  return { href: `/projects${qs ? `?${qs}` : ""}`, filters };
}

/** Structured-filter count, ignoring a city merely inherited from a matched community. */
function structuredCount(parse: SmartQueryResult): number {
  const f = parse.filters;
  const explicit = [f.minPrice, f.maxPrice, f.beds, f.propertyType, f.handoverBy, f.paymentPlan]
    .filter((v) => v !== undefined && v !== null).length;
  const cityExplicit = parse.matched.some((m) => m.kind === "city") && f.city !== undefined;
  return explicit + (cityExplicit ? 1 : 0);
}

/** Alias slugs of a kind whose key starts with the (normalized) query. */
function aliasSlugs(nq: string, kind: AliasKind): string[] {
  if (nq.length < 2) return [];
  const out: string[] = [];
  for (const [key, alias] of Object.entries(SEARCH_ALIASES)) {
    if (alias.kind === kind && key.startsWith(nq)) out.push(alias.slug);
  }
  return out;
}

function rankMatches<T extends { norm: string; slug: string }>(
  items: T[],
  nq: string,
  limit: number,
  seedSlugs: string[],
): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  const push = (item: T | undefined) => {
    if (!item || seen.has(item.slug) || out.length >= limit) return;
    seen.add(item.slug);
    out.push(item);
  };
  for (const slug of seedSlugs) push(items.find((i) => i.slug === slug));
  for (const item of items) {
    if (out.length >= limit) break;
    if (item.norm.startsWith(nq)) push(item);
  }
  for (const item of items) {
    if (out.length >= limit) break;
    if (item.norm.includes(nq)) push(item);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type SuggestKind =
  | "smart"
  | "project"
  | "community"
  | "developer"
  | "yield"
  | "compare"
  | "all";

interface SuggestOption {
  id: string;
  index: number;
  kind: SuggestKind;
  label: string;
  sub?: string;
  badge?: string;
  href: string;
}

interface SuggestSection {
  key: string;
  header?: string;
  options: SuggestOption[];
}

export interface SearchSuggestProps {
  variant: "hero" | "header" | "sheet" | "drawer";
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  /** Override placeholder (defaults to dict.nav.searchPlaceholder). */
  placeholder?: string;
  /** Submit-button label for hero/header variants (defaults to dict.nav.searchSubmit). */
  searchLabel?: string;
  /** Called before routing — surfaces use it to close their dialog/dropdown. */
  onNavigate?: () => void;
}

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13.5 13.5 17 17" />
    </svg>
  );
}

export function SearchSuggest({
  variant,
  className,
  inputClassName,
  autoFocus,
  placeholder,
  searchLabel,
  onNavigate,
}: SearchSuggestProps) {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const listboxId = `search-suggest-${uid}-listbox`;

  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [data, setData] = useState<SuggestData | null>(null);
  const [yieldRows, setYieldRows] = useState<YieldCommunity[] | null>(yieldCache);

  // 150ms debounce — matching itself is synchronous against the in-memory index.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), 150);
    return () => clearTimeout(t);
  }, [value]);

  const ensureData = useCallback(() => {
    void loadSuggestData()
      .then((d) => setData(d))
      .catch(() => undefined);
  }, []);

  const query = debounced.trim();

  const parse = useMemo(() => {
    if (!query) return null;
    return parseSmartQuery(query, data?.index ?? EMPTY_INDEX);
  }, [query, data]);

  // Lazy-load yield data only for yield-intent queries.
  useEffect(() => {
    if (parse?.intent !== "yield" || yieldRows) return;
    let active = true;
    void loadYieldCommunities().then((rows) => {
      if (active) setYieldRows(rows);
    });
    return () => {
      active = false;
    };
  }, [parse, yieldRows]);

  const yieldMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of yieldRows ?? []) {
      map.set(normText(row.key), row.grossYieldPct);
      if (row.name) map.set(normText(row.name), row.grossYieldPct);
    }
    return map;
  }, [yieldRows]);

  const t = dict.nav.suggest;

  const { sections, flat, smartHref } = useMemo((): {
    sections: SuggestSection[];
    flat: SuggestOption[];
    smartHref: string | null;
  } => {
    if (!query || !parse) return { sections: [], flat: [], smartHref: null };

    const nq = normText(query);
    const raw: Array<{ key: string; header?: string; options: Array<Omit<SuggestOption, "id" | "index">> }> = [];

    let smartHref: string | null = null;

    if (parse.intent === "yield") {
      // (1-yield) Top yield communities + compare row.
      const rows = (yieldRows ?? []).slice(0, 5);
      const options: Array<Omit<SuggestOption, "id" | "index">> = rows.map((row) => {
        const label = titleCase(row.name ?? row.key);
        const community = data?.index.communities.find(
          (c) => c.norm === normText(row.name ?? row.key) || c.norm === normText(row.key),
        );
        return {
          kind: "yield" as const,
          label,
          badge: `${row.grossYieldPct}%`,
          href: community
            ? `/communities/${community.slug}`
            : `/projects?q=${encodeURIComponent(label)}`,
        };
      });
      options.push({ kind: "compare", label: t.compareCommunities, href: "/compare" });
      raw.push({ key: "yield", header: t.topYield, options });
    } else if (structuredCount(parse) >= 1) {
      // (1) Smart interpretation row — needs no catalog data except the count.
      const serp = smartSerp(parse);
      smartHref = serp.href;
      const count = data ? data.api.filterUnits(data.units, serp.filters).length : null;
      const label =
        count === null
          ? smartLabel(parse)
          : `${smartLabel(parse)} → ${interpolate(t.results, { count })}`;
      raw.push({
        key: "smart",
        options: [{ kind: "smart", label, href: serp.href }],
      });
    }

    if (data) {
      const seedOf = (kind: "project" | "community" | "developer") =>
        parse.matched.filter((m) => m.kind === kind).map((m) => m.slug);

      // (2) Projects — top 4.
      const projects = rankMatches(data.index.projects, nq, 4, seedOf("project"));
      if (projects.length) {
        raw.push({
          key: "projects",
          header: t.groups.projects,
          options: projects.map((p) => ({
            kind: "project" as const,
            label: p.name,
            sub: [
              p.area,
              p.minPriceAed ? formatPrice(p.minPriceAed, "AED", { compact: true }) : null,
            ]
              .filter(Boolean)
              .join(" · "),
            href: `/projects/${p.slug}`,
          })),
        });
      }

      // (3) Communities — top 3, yield badge when the data is already loaded.
      const communities = rankMatches(
        data.index.communities,
        nq,
        3,
        [...seedOf("community"), ...aliasSlugs(nq, "community")],
      );
      if (communities.length) {
        raw.push({
          key: "communities",
          header: t.groups.communities,
          options: communities.map((c) => {
            const pct = yieldMap.get(c.norm);
            return {
              kind: "community" as const,
              label: titleCase(c.name),
              sub: interpolate(t.projectsCount, { count: c.projectCount }),
              badge: pct !== undefined ? `${pct}%` : undefined,
              href: `/communities/${c.slug}`,
            };
          }),
        });
      }

      // (4) Developers — top 2.
      const developers = rankMatches(
        data.index.developers,
        nq,
        2,
        [...seedOf("developer"), ...aliasSlugs(nq, "developer")],
      );
      if (developers.length) {
        raw.push({
          key: "developers",
          header: t.groups.developers,
          options: developers.map((d) => ({
            kind: "developer" as const,
            label: d.name,
            sub: interpolate(t.projectsCount, { count: d.projectCount }),
            href: `/developers/${d.slug}`,
          })),
        });
      }
    }

    // (5) Footer — legacy full search.
    raw.push({
      key: "all",
      options: [
        {
          kind: "all" as const,
          label: interpolate(t.searchAllFor, { query }),
          href: `/projects?q=${encodeURIComponent(query)}`,
        },
      ],
    });

    const sections: SuggestSection[] = [];
    const flat: SuggestOption[] = [];
    for (const section of raw) {
      const withIds: SuggestOption[] = [];
      for (const opt of section.options) {
        const index = flat.length;
        const full: SuggestOption = { ...opt, index, id: `search-suggest-${uid}-opt-${index}` };
        flat.push(full);
        withIds.push(full);
      }
      sections.push({ key: section.key, header: section.header, options: withIds });
    }
    return { sections, flat, smartHref };
  }, [query, parse, data, yieldRows, yieldMap, t, uid]);

  // Clamp at read time — the option list can shrink between renders.
  const active = highlight >= 0 && highlight < flat.length ? highlight : -1;

  const expanded = open && value.trim().length > 0;

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      onNavigate?.();
      router.push(localePath(locale, href));
    },
    [onNavigate, router, locale],
  );

  const select = useCallback(
    (opt: SuggestOption) => {
      trackEvent(ANALYTICS_EVENTS.SUGGEST_CLICK, { kind: opt.kind, position: opt.index });
      navigate(opt.href);
    },
    [navigate],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    trackEvent(ANALYTICS_EVENTS.SEARCH_SUBMIT, {
      query_length: q.length,
      source: variant,
    });
    navigate(q ? `/projects?q=${encodeURIComponent(q)}` : "/projects");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (flat.length === 0) return;
      e.preventDefault();
      setOpen(true);
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setHighlight(
        active === -1
          ? delta === 1
            ? 0
            : flat.length - 1
          : (active + delta + flat.length) % flat.length,
      );
    } else if (e.key === "Enter") {
      if (expanded && active >= 0 && flat[active]) {
        e.preventDefault();
        select(flat[active]);
      } else if (smartHref && value.trim()) {
        // No highlight: smart-route when the query parsed into filters.
        e.preventDefault();
        trackEvent(ANALYTICS_EVENTS.SUGGEST_CLICK, { kind: "smart", position: 0 });
        navigate(smartHref);
      }
      // Otherwise fall through to the surface's plain form submit.
    } else if (e.key === "Escape") {
      // Close the listbox but DO NOT stop propagation — the header dropdown
      // listens for the same Escape to close itself.
      setOpen(false);
      setHighlight(-1);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const onRootBlur = (e: React.FocusEvent) => {
    if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
  };

  const input = (
    <input
      type="search"
      role="combobox"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        setHighlight(-1);
        setOpen(true);
      }}
      onFocus={() => {
        ensureData();
        if (value.trim()) setOpen(true);
      }}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      enterKeyHint="search"
      autoComplete="off"
      placeholder={placeholder ?? dict.nav.searchPlaceholder}
      aria-label={dict.nav.searchAria}
      aria-expanded={expanded}
      aria-controls={listboxId}
      aria-activedescendant={
        expanded && active >= 0 && flat[active] ? flat[active].id : undefined
      }
      aria-autocomplete="list"
      aria-haspopup="listbox"
      className={cn(
        variant === "hero" &&
          "iop-input h-12 flex-1 border-0 bg-transparent ps-10 shadow-none focus:shadow-none",
        variant === "header" &&
          "w-full min-w-0 bg-transparent text-sm text-text-dark outline-none placeholder:text-muted-light",
        variant === "sheet" && "iop-input",
        variant === "drawer" && "iop-input h-11",
        inputClassName,
      )}
    />
  );

  const listbox = expanded ? (
    <ul
      role="listbox"
      id={listboxId}
      aria-label={dict.nav.searchAria}
      className={cn(
        "overscroll-contain p-1.5 text-start",
        variant === "hero"
          ? "absolute inset-x-0 top-full z-[var(--z-header)] mt-2 max-h-[min(28rem,60vh)] overflow-y-auto rounded-2xl border border-border bg-white shadow-elevation-lg"
          : "mt-2 max-h-[50vh] overflow-y-auto rounded-2xl border border-border bg-white",
      )}
    >
      {sections.map((section) => (
        <Fragment key={section.key}>
          {section.header ? (
            <li
              role="presentation"
              className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-light"
            >
              {section.header}
            </li>
          ) : null}
          {section.options.map((opt) => (
            <li
              key={opt.id}
              id={opt.id}
              role="option"
              aria-selected={active === opt.index}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(opt)}
              onMouseEnter={() => setHighlight(opt.index)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                active === opt.index
                  ? "bg-brand-muted text-brand-dark"
                  : "text-text-dark hover:bg-surface-alt",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{opt.label}</span>
                {opt.sub ? (
                  <span className="block truncate text-xs text-muted">{opt.sub}</span>
                ) : null}
              </span>
              {opt.badge ? (
                <span className="shrink-0 rounded-full bg-brand-muted px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
                  {opt.badge}
                </span>
              ) : null}
            </li>
          ))}
        </Fragment>
      ))}
      {!data ? (
        // Subtle shimmer while the index loads — entity groups only.
        <li role="presentation" aria-hidden className="space-y-2 px-3 py-2.5">
          <span className="sr-only">{t.loading}</span>
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-alt" />
          <div className="h-3.5 w-1/2 animate-pulse rounded bg-surface-alt" />
          <div className="h-3.5 w-2/3 animate-pulse rounded bg-surface-alt" />
        </li>
      ) : null}
    </ul>
  ) : null;

  if (variant === "hero") {
    return (
      <div ref={rootRef} onBlur={onRootBlur} className={cn("relative", className)}>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 rounded-2xl bg-white/95 p-2 shadow-elevation-lg backdrop-blur-md sm:flex-row sm:items-center"
        >
          <div className="relative flex flex-1 items-center">
            <SearchGlyph className="pointer-events-none absolute start-3 h-5 w-5 text-muted-light" />
            {input}
          </div>
          <button
            type="submit"
            className="iop-btn-press focus-ring h-12 shrink-0 rounded-xl bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            {searchLabel ?? dict.nav.searchSubmit}
          </button>
        </form>
        {listbox}
      </div>
    );
  }

  if (variant === "header") {
    return (
      <div ref={rootRef} onBlur={onRootBlur} className={cn("w-full", className)}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <span className="ps-1 text-muted-light">
            <SearchGlyph className="h-[18px] w-[18px]" />
          </span>
          {input}
          <button
            type="submit"
            aria-label={dict.nav.searchSubmit}
            className="iop-btn-press focus-ring shrink-0 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
          >
            {searchLabel ?? dict.nav.searchSubmit}
          </button>
        </form>
        {listbox}
      </div>
    );
  }

  // sheet / drawer: inline suggestions under the input, inside the dialog —
  // the dialog body scrolls, no nested popover.
  return (
    <div ref={rootRef} onBlur={onRootBlur} className={className}>
      <form onSubmit={handleSubmit}>{input}</form>
      {listbox}
    </div>
  );
}
