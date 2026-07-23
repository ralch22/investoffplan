"use client";

import { useI18n } from "@/i18n/locale-provider";
import { interpolate } from "@/i18n/config";

/** Filter names the SERP rescue is allowed to relax, in relax order. */
export type RelaxedFilter = "maxPrice" | "beds" | "city" | "developer" | "handoverBy";

/**
 * A2UI `RelaxedFilterNote` leaf — explains why the results below aren't an
 * exact match. The composer emits filter CODES, never prose, so the note
 * localises here like every other surface value.
 *
 * Being explicit about what was relaxed matters: silently widening a search is
 * the kind of thing that makes a catalogue feel untrustworthy.
 */
export function AdvisorRelaxedFilterNote({ relaxed }: { relaxed: RelaxedFilter[] }) {
  const { locale, dict } = useI18n();
  const t = dict.advisor;
  if (!relaxed.length) return null;

  const sep = locale === "ar" ? "، " : ", ";
  const names = relaxed.map((r) => t.relaxedFilters[r] ?? r);
  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(sep)} ${t.relaxedAnd} ${names[names.length - 1]}`;

  return (
    <div className="rounded-2xl border border-border bg-surface-alt px-4 py-3">
      <p className="text-sm text-text-dark">
        {interpolate(t.relaxedNote, { filters: list })}
      </p>
    </div>
  );
}
