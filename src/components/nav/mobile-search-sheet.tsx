"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";

const CHIPS = ["Apartments", "Villas", "Emaar", "JVC", "Under AED 1M"];

/** Bottom-sheet search opened from the mobile tab bar — routes to /projects?q=. */
export function MobileSearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const router = useRouter();
  const { locale, dict } = useI18n();

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setTimeout(() => inputRef.current?.focus(), 60);
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  const go = (term: string) => {
    onClose();
    const query = term.trim();
    router.push(
      localePath(locale, query ? `/projects?q=${encodeURIComponent(query)}` : "/projects"),
    );
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="fixed inset-0 z-[var(--z-modal)] m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-surface-darker/60 backdrop:backdrop-blur-sm lg:hidden"
    >
      {open ? (
        <div className="drawer-up absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-elevation-lg">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" aria-hidden />
          <form onSubmit={(e) => { e.preventDefault(); go(q); }}>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              enterKeyHint="search"
              placeholder={dict.nav.searchPlaceholder}
              aria-label={dict.nav.searchPlaceholder}
              className="iop-input"
            />
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => go(c)}
                className="iop-btn-press focus-ring rounded-full border border-border px-3 py-1.5 text-sm text-muted transition hover:border-brand hover:text-brand"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
