"use client";

import { useEffect, useRef, useState } from "react";
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
 * Desktop header search (lg+): an icon button that opens a dropdown search
 * field (absolute — doesn't fight the crowded header flex row), routing to
 * /projects?q=. Mobile uses the bottom tab bar's search sheet. The input's
 * aria-label is "Search the catalog" (not "…developers…") to avoid a
 * getByLabel('Developer') substring collision with the SERP filter.
 */
export function HeaderSearch({ solid }: { solid: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { locale, dict } = useI18n();

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    setOpen(false);
    router.push(
      localePath(locale, query ? `/projects?q=${encodeURIComponent(query)}` : "/projects"),
    );
  };

  return (
    <div ref={wrapRef} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={dict.nav.searchOpen}
        aria-expanded={open}
        className={cn(
          "focus-ring iop-btn-press flex h-10 w-10 items-center justify-center rounded-full border transition",
          solid
            ? "border-border text-muted hover:border-brand hover:text-brand"
            : "border-white/30 text-white/90 hover:border-white hover:bg-white/10",
        )}
      >
        <SearchIcon />
      </button>

      {open ? (
        <form
          onSubmit={submit}
          className="reveal absolute end-0 top-full z-[var(--z-header)] mt-2 flex w-[min(20rem,calc(100vw-2rem))] items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-elevation-lg"
        >
          <span className="ps-1 text-muted-light">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            enterKeyHint="search"
            placeholder={dict.nav.searchPlaceholder}
            aria-label={dict.nav.searchAria}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            className="w-full min-w-0 bg-transparent text-sm text-text-dark outline-none placeholder:text-muted-light"
          />
          <button
            type="submit"
            aria-label={dict.nav.searchSubmit}
            className="iop-btn-press focus-ring shrink-0 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
          >
            {dict.nav.searchSubmit}
          </button>
        </form>
      ) : null}
    </div>
  );
}
