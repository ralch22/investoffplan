"use client";

import { useEffect, useState } from "react";
import {
  FAVORITES_CHANGED_EVENT,
  isFavoriteSlug,
  toggleFavoriteSlug,
} from "@/lib/favorites";
import { cn } from "@/lib/cn";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { useI18n } from "@/i18n/locale-provider";

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
  const { dict } = useI18n();
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Subscribe so every FavoriteButton for the same slug (e.g. hero + related
    // card) stays in sync when any one of them toggles, and across tabs.
    const sync = () => setActive(isFavoriteSlug(slug));
    sync();
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [slug]);

  return (
    <button
      type="button"
      aria-label={
        active ? dict.common.removeFromFavorites : dict.common.addToFavorites
      }
      aria-pressed={active}
      onClick={() => {
        const nowActive = toggleFavoriteSlug(slug).includes(slug);
        setActive(nowActive);
        // Favoriting is a high-intent signal — was previously untracked.
        if (nowActive) trackEvent(ANALYTICS_EVENTS.FAVORITE_ADD, { slug });
      }}
      className={cn(
        "iop-btn-press inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
        active
          ? "focus-ring border-brand bg-brand text-white"
          : variant === "light"
            ? "focus-ring-light border-white/30 bg-white/10 text-white hover:border-white hover:bg-white/20"
            : "focus-ring border-border bg-white text-muted hover:border-brand hover:text-brand",
        className,
      )}
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M10 3.5l1.45 2.94 3.24.47-2.34 2.28.55 3.22L10 10.9l-2.9 1.52.55-3.22-2.34-2.28 3.24-.47L10 3.5z" />
      </svg>
    </button>
  );
}