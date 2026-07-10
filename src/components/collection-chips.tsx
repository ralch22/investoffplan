"use client";

import { cn } from "@/lib/cn";
import type { CollectionFilter } from "@/lib/types";

const COLLECTIONS: Array<{ id: CollectionFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "premium", label: "Premium" },
  { id: "brochure", label: "Brochure PDF" },
  { id: "video", label: "Video" },
  { id: "tour", label: "Virtual tour" },
  { id: "under-2m", label: "Under AED 2M" },
  { id: "studio", label: "Studio" },
  { id: "waterfront", label: "Waterfront" },
];

interface CollectionChipsProps {
  value: CollectionFilter;
  onChange: (value: CollectionFilter) => void;
}

export function CollectionChips({ value, onChange }: CollectionChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {COLLECTIONS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={cn(
            "iop-btn-press focus-ring shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
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