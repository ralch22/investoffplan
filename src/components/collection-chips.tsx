"use client";

import { cn } from "@/lib/cn";
import type { CollectionFilter } from "@/lib/types";
import { useI18n } from "@/i18n/locale-provider";

interface CollectionChipsProps {
  value: CollectionFilter;
  onChange: (value: CollectionFilter) => void;
}

export function CollectionChips({ value, onChange }: CollectionChipsProps) {
  const { dict } = useI18n();
  const chips = dict.serp.chips;

  const COLLECTIONS: Array<{ id: CollectionFilter; label: string }> = [
    { id: "all", label: chips.all },
    { id: "premium", label: chips.premium },
    { id: "brochure", label: chips.brochurePdf },
    { id: "video", label: chips.videoTour },
    { id: "under-2m", label: chips.under2m },
    { id: "studio", label: chips.studio },
    { id: "waterfront", label: chips.waterfront },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {COLLECTIONS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
            value === c.id
              ? "border-brand bg-brand text-white"
              : "border-border bg-white text-text-dark hover:border-brand hover:text-brand",
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}