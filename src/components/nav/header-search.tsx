"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";
import { cn } from "@/lib/cn";

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
      <circle cx="9" cy="9" r="6" />
      <path d="m17 17-3.5-3.5" />
    </svg>
  );
}

/**
 * Desktop header search (lg+): icon collapses to a pill, expands to an input on
 * click/focus, routes to /projects?q=. Mobile uses the bottom tab bar's search
 * sheet. aria-label is "Open search" (not "Search") to avoid a strict-mode
 * accessible-name collision with the homepage HeroSearch submit button.
 */
export function HeaderSearch({ solid }: { solid: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { locale, dict } = useI18n();

  const open = () => {
    setExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    setExpanded(false);
    router.push(
      localePath(locale, query ? `/projects?q=${encodeURIComponent(query)}` : "/projects"),
    );
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "hidden items-center overflow-hidden rounded-full border transition-[width,background-color,border-color] duration-300 lg:flex",
        expanded ? "w-64" : "w-10",
        solid
          ? "border-border bg-surface"
          : expanded
            ? "border-white/40 bg-white/15"
            : "border-white/30 bg-transparent",
      )}
    >
      <button
        type={expanded ? "submit" : "button"}
        onClick={expanded ? undefined : open}
        aria-label={expanded ? dict.nav.searchSubmit : dict.nav.searchOpen}
        aria-expanded={expanded}
        className={cn(
          "focus-ring iop-btn-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          solid ? "text-muted hover:text-brand" : "text-white/90 hover:text-white",
        )}
      >
        <SearchIcon />
      </button>
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search"
        enterKeyHint="search"
        placeholder={dict.nav.searchPlaceholder}
        aria-label={dict.nav.searchPlaceholder}
        tabIndex={expanded ? 0 : -1}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setExpanded(false);
          }
        }}
        onBlur={() => {
          if (!q.trim()) setExpanded(false);
        }}
        className={cn(
          "w-full min-w-0 bg-transparent pe-3 text-sm outline-none transition-opacity duration-200",
          expanded ? "opacity-100" : "pointer-events-none opacity-0",
          solid
            ? "text-text-dark placeholder:text-muted-light"
            : "text-white placeholder:text-white/60",
        )}
      />
    </form>
  );
}
