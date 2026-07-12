"use client";

import { cn } from "@/lib/cn";
import type { CollectionFilter } from "@/lib/types";
import { useI18n } from "@/i18n/locale-provider";
import type { Dict } from "@/i18n/dictionaries/en";

const COLLECTIONS: Array<{
  id: CollectionFilter;
  key: keyof Dict["serp"]["chips"];
}> = [
  { id: "all", key: "all" },
  { id: "premium", key: "premium" },
  { id: "brochure", key: "brochurePdf" },
  { id: "video", key: "video" },
  { id: "tour", key: "virtualTour" },
  { id: "under-2m", key: "under2m" },
  { id: "studio", key: "studio" },
  { id: "waterfront", key: "waterfront" },
];

interface CollectionChipsProps {
  value: CollectionFilter;
  onChange: (value: CollectionFilter) => void;
}

export function CollectionChips({ value, onChange }: CollectionChipsProps) {
  const { dict } = useI18n();
  const chips = dict.serp.chips;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {COLLECTIONS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          aria-pressed={value === c.id}
          className={cn(
            "iop-btn-press focus-ring shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
            value === c.id
              ? "border-brand bg-brand text-white"
              : "border-border bg-white text-text-dark hover:border-brand hover:text-brand",
          )}
        >
          {chips[c.key]}
        </button>
      ))}
    </div>
  );
}