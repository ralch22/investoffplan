"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

const QUICK_FILTERS = [
  { label: "Apartments", href: "/projects?type=apartment" },
  { label: "Villas", href: "/projects?type=villa" },
  { label: "Emaar", href: "/developers/emaar-properties" },
  { label: "JVC", href: "/areas/jumeirah-village-circle" },
  { label: "Under AED 1M", href: "/projects?maxP=1000000" },
] as const;

interface HeroSearchProps {
  className?: string;
}

export function HeroSearch({ className }: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/projects${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className={cn("w-full max-w-3xl", className)}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 rounded-2xl bg-white/95 p-2 shadow-elevation-lg backdrop-blur-md sm:flex-row sm:items-center"
      >
        <div className="relative flex flex-1 items-center">
          <svg
            viewBox="0 0 20 20"
            className="pointer-events-none absolute start-3 h-5 w-5 text-muted-light"
            aria-hidden
          >
            <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by project, developer, or area"
            className="iop-input h-12 flex-1 border-0 bg-transparent ps-10 shadow-none focus:shadow-none"
            aria-label="Search properties"
          />
        </div>
        <button
          type="submit"
          className="iop-btn-press focus-ring h-12 shrink-0 rounded-xl bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Search
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="self-center text-xs font-medium text-white/70">Popular:</span>
        {QUICK_FILTERS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => router.push(chip.href)}
            className="iop-btn-press focus-ring rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition hover:border-white/50 hover:bg-white/20"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}