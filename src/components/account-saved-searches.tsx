"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { savedSearchPath, type SavedSearchFilters } from "@/lib/alerts/match";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/locale-provider";

interface SavedSearchItem {
  id: string;
  label: string;
  filters: SavedSearchFilters;
  locale: string;
  alertEnabled: boolean;
}

/**
 * Account-page saved-searches list: alert toggle + delete + SERP deep link.
 * Rendered only when a session exists (parent gates on useSession) — all data
 * is fetched client-side so the page HTML stays static (ISR discipline).
 */
export function AccountSavedSearches() {
  const { locale, dict } = useI18n();
  const t = dict.account.savedSearches;
  const [items, setItems] = useState<SavedSearchItem[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/me/saved-searches");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { searches?: SavedSearchItem[] };
      setItems(data.searches ?? []);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    // Async fetch-on-mount: state updates land after the request resolves,
    // never synchronously inside the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function toggleAlert(item: SavedSearchItem) {
    // Optimistic flip; reconcile on failure by reloading.
    setItems(
      (prev) =>
        prev?.map((s) =>
          s.id === item.id ? { ...s, alertEnabled: !s.alertEnabled } : s,
        ) ?? null,
    );
    const res = await fetch("/api/me/saved-searches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, alertEnabled: !item.alertEnabled }),
    });
    if (!res.ok) void load();
  }

  async function remove(item: SavedSearchItem) {
    setItems((prev) => prev?.filter((s) => s.id !== item.id) ?? null);
    const res = await fetch("/api/me/saved-searches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    if (!res.ok) void load();
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-light">
        {t.title}
      </h2>

      {error ? (
        <p className="mt-3 text-sm text-muted">{t.error}</p>
      ) : items === null ? (
        <p className="mt-3 text-sm text-muted">{t.loading}</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t.empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-dark">{item.label}</p>
                <Link
                  href={savedSearchPath(item.filters, locale === "ar" ? "ar" : "en")}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  {t.view}
                </Link>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={item.alertEnabled}
                onClick={() => void toggleAlert(item)}
                className={cn(
                  "focus-ring rounded-full border px-3 py-1 text-xs font-semibold transition",
                  item.alertEnabled
                    ? "border-brand bg-brand-muted text-brand-dark"
                    : "border-border text-muted",
                )}
              >
                {t.alerts}: {item.alertEnabled ? t.on : t.off}
              </button>
              <button
                type="button"
                onClick={() => void remove(item)}
                className="focus-ring rounded-full px-2 py-1 text-xs font-semibold text-muted transition hover:text-brand"
              >
                {t.delete}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
