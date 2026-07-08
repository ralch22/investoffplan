"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { useFavoritesCount } from "@/hooks/use-favorites-count";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";

const NAV_KEYS = [
  { href: "/projects", key: "projects" },
  { href: "/tools", key: "dataToolkit" },
  { href: "/developers", key: "developers" },
  { href: "/areas", key: "areas" },
  { href: "/map", key: "map" },
  { href: "/guides", key: "guides" },
  { href: "/news", key: "news" },
  { href: "/favorites", key: "favorites" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const favoritesCount = useFavoritesCount();
  const { locale, dict } = useI18n();

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[var(--z-overlay)] m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-surface-darker/60"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <nav className="absolute end-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-surface shadow-elevation-lg">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <BrandLogo variant="horizontal-dark" className="h-7 w-auto" />
          <button
            type="button"
            onClick={onClose}
            className="iop-btn-press focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted"
            aria-label={dict.nav.closeNavigation}
          >
            ✕
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_KEYS.map((item) => {
            const href = localePath(locale, item.href);
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "iop-btn-press focus-ring block rounded-xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-brand-muted text-brand"
                      : "text-muted hover:bg-surface-alt hover:text-text-dark",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    {dict.nav[item.key]}
                    {item.href === "/favorites" && favoritesCount > 0 ? (
                      <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">
                        {favoritesCount}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-border p-4">
          <Link
            href={localePath(locale, "/projects")}
            onClick={onClose}
            className="iop-btn-press focus-ring flex w-full items-center justify-center rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            {dict.nav.browseProperties}
          </Link>
        </div>
      </nav>
    </dialog>
  );
}