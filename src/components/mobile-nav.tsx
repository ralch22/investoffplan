"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { useFavoritesCount } from "@/hooks/use-favorites-count";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/projects", label: "Projects" },
  { href: "/tools", label: "Data toolkit" },
  { href: "/developers", label: "Developers" },
  { href: "/areas", label: "Areas" },
  { href: "/map", label: "Map" },
  { href: "/insights", label: "Guides" },
  { href: "/news", label: "News" },
  { href: "/favorites", label: "Favorites" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const favoritesCount = useFavoritesCount();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-overlay)] lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-surface-darker/60 backdrop-blur-sm"
        aria-label="Close menu"
        onClick={onClose}
      />
      <nav className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-surface shadow-elevation-lg">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <BrandLogo variant="horizontal-dark" className="h-7 w-auto" />
          <button
            type="button"
            onClick={onClose}
            className="iop-btn-press focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "iop-btn-press focus-ring block rounded-xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-brand-muted text-brand"
                      : "text-muted hover:bg-surface-alt hover:text-text-dark",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    {item.label}
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
            href="/projects"
            onClick={onClose}
            className="iop-btn-press focus-ring flex w-full items-center justify-center rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Browse properties
          </Link>
        </div>
      </nav>
    </div>
  );
}