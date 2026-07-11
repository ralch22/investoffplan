"use client";

import { cn } from "@/lib/cn";
import { paginationRange } from "@/lib/pagination";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const stepCls =
  "iop-btn-press focus-ring rounded-xl border border-border px-3 py-2 text-sm text-muted disabled:cursor-not-allowed disabled:opacity-40";

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-1 pt-10"
    >
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className={stepCls}>
        Prev
      </button>
      {paginationRange(page, totalPages).map((item, i) =>
        item === "ellipsis" ? (
          <span
            key={`e${i}`}
            aria-hidden
            className="px-1.5 text-sm text-muted-light select-none"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Page ${item}`}
            className={cn(
              "iop-btn-press focus-ring min-w-10 rounded-xl border px-3 py-2 text-sm font-medium",
              item === page
                ? "border-brand bg-brand text-white shadow-elevation-sm"
                : "border-border text-text-dark hover:bg-surface-alt",
            )}
          >
            {item}
          </button>
        ),
      )}
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className={stepCls}>
        Next
      </button>
    </nav>
  );
}