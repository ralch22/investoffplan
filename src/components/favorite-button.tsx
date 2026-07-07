"use client";

import { useEffect, useState } from "react";
import { isFavoriteSlug, toggleFavoriteSlug } from "@/lib/favorites";
import { cn } from "@/lib/cn";

interface FavoriteButtonProps {
  slug: string;
  className?: string;
  variant?: "default" | "light";
}

export function FavoriteButton({
  slug,
  className,
  variant = "default",
}: FavoriteButtonProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isFavoriteSlug(slug));
  }, [slug]);

  return (
    <button
      type="button"
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      onClick={() => setActive(toggleFavoriteSlug(slug).includes(slug))}
      className={cn(
        "iop-btn-press inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
        active
          ? "border-brand bg-brand text-white"
          : variant === "light"
            ? "border-white/30 bg-white/10 text-white hover:border-white hover:bg-white/20"
            : "border-border bg-white text-muted hover:border-brand hover:text-brand",
        className,
      )}
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M10 3.5l1.45 2.94 3.24.47-2.34 2.28.55 3.22L10 10.9l-2.9 1.52.55-3.22-2.34-2.28 3.24-.47L10 3.5z" />
      </svg>
    </button>
  );
}