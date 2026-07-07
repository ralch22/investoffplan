"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

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
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full max-w-3xl flex-col gap-2 rounded-2xl bg-white/95 p-2 shadow-elevation-lg backdrop-blur-md sm:flex-row sm:items-center",
        className,
      )}
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by project, developer, or area"
        className="iop-input h-12 flex-1 border-0 bg-transparent shadow-none focus:shadow-none"
        aria-label="Search properties"
      />
      <button
        type="submit"
        className="iop-btn-press focus-ring h-12 shrink-0 rounded-xl bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Search
      </button>
    </form>
  );
}