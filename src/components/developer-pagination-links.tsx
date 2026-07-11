import Link from "next/link";
import { cn } from "@/lib/cn";
import type { SortOption } from "@/lib/types";

interface DeveloperPaginationLinksProps {
  page: number;
  totalPages: number;
  sort: SortOption;
}

function pageHref(page: number, sort: SortOption): string {
  const params = new URLSearchParams();
  if (sort !== "featured") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}

export function DeveloperPaginationLinks({
  page,
  totalPages,
  sort,
}: DeveloperPaginationLinksProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-1 pt-10"
    >
      <Link
        href={pageHref(Math.max(1, page - 1), sort)}
        aria-disabled={page <= 1}
        className={cn(
          "iop-btn-press focus-ring rounded-xl border border-border px-3 py-2 text-sm text-muted",
          page <= 1 && "pointer-events-none opacity-40",
        )}
      >
        Prev
      </Link>
      {pages.map((p) => (
        <Link
          key={p}
          href={pageHref(p, sort)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "iop-btn-press focus-ring min-w-10 rounded-xl border px-3 py-2 text-sm font-medium",
            p === page
              ? "border-brand bg-brand text-white shadow-elevation-sm"
              : "border-border text-text-dark hover:bg-surface-alt",
          )}
        >
          {p}
        </Link>
      ))}
      <Link
        href={pageHref(Math.min(totalPages, page + 1), sort)}
        aria-disabled={page >= totalPages}
        className={cn(
          "iop-btn-press focus-ring rounded-xl border border-border px-3 py-2 text-sm text-muted",
          page >= totalPages && "pointer-events-none opacity-40",
        )}
      >
        Next
      </Link>
    </nav>
  );
}