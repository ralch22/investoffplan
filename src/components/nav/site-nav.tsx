"use client";

import Link from "next/link";
import Image from "next/image";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";
import { useNavData } from "@/components/nav/nav-data-provider";
import { DATAGURU_TOOLS } from "@/lib/dataguru";
import { GUIDE_CARDS } from "@/lib/figma-copy";
import { LOCATION_GUIDE_LINKS } from "@/lib/location-guide-links";
import { formatPrice } from "@/lib/format";
import { unoptimizedProp } from "@/lib/asset-image";
import { cn } from "@/lib/cn";

type PanelId = "communities" | "tools" | "insights";

interface SiteNavProps {
  solid: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SiteNav({ solid, onOpenChange }: SiteNavProps) {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState<PanelId | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const triggerRefs = useRef<Record<PanelId, HTMLButtonElement | null>>({
    communities: null,
    tools: null,
    insights: null,
  });
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const lp = useCallback((href: string) => localePath(locale, href), [locale]);

  useEffect(() => onOpenChange?.(open !== null), [open, onOpenChange]);
  // Close on navigation.
  useEffect(() => setOpen(null), [pathname]);

  const clearTimers = () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  };
  useEffect(() => () => clearTimers(), []);

  const hoverOpen = (id: PanelId) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return; // touch/pen use click
    clearTimers();
    openTimer.current = setTimeout(() => setOpen(id), 80);
  };
  const scheduleClose = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(null), 180);
  };
  const cancelClose = () => clearTimers();

  const toggle = (id: PanelId) => {
    clearTimers();
    setOpen((cur) => (cur === id ? null : id));
  };

  const closeAndFocus = (id: PanelId | null) => {
    setOpen(null);
    if (id) triggerRefs.current[id]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      closeAndFocus(open);
    }
  };

  const linkCls = cn(
    "focus-ring rounded-lg px-3 py-2 text-sm font-medium transition",
    solid
      ? "text-muted hover:bg-surface-alt hover:text-text-dark"
      : "text-white/85 hover:bg-white/10 hover:text-white",
  );
  const active = (href: string) =>
    pathname === lp(href) || pathname.startsWith(`${lp(href)}/`);
  const activeCls = solid ? "bg-brand-muted text-brand-dark" : "bg-white/15 text-white";

  const trigger = (id: PanelId, label: string) => (
    <button
      key={id}
      ref={(el) => {
        triggerRefs.current[id] = el;
      }}
      type="button"
      aria-expanded={open === id}
      aria-haspopup="true"
      aria-controls={`meganav-${id}`}
      onClick={() => toggle(id)}
      onPointerEnter={hoverOpen(id)}
      className={cn(linkCls, "inline-flex items-center gap-1", open === id && activeCls)}
    >
      {label}
      <svg viewBox="0 0 12 12" className={cn("h-2.5 w-2.5 transition", open === id && "rotate-180")} aria-hidden>
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return (
    <nav
      ref={navRef}
      className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
      aria-label={dict.nav.mainNavAria}
      onKeyDown={onKeyDown}
      onPointerLeave={scheduleClose}
      onPointerEnter={cancelClose}
    >
      <Link href={lp("/projects")} className={cn(linkCls, active("/projects") && activeCls)}>
        {dict.nav.projects}
      </Link>
      {trigger("communities", dict.nav.areas)}
      <Link href={lp("/developers")} className={cn(linkCls, active("/developers") && activeCls)}>
        {dict.nav.developers}
      </Link>
      {trigger("tools", dict.nav.groups.tools)}
      {trigger("insights", dict.nav.groups.insights)}
      <Link href={lp("/compare")} className={cn(linkCls, active("/compare") && activeCls)}>
        {dict.nav.marketData}
      </Link>

      {/* Portaled to <body> so the fixed panel is viewport-anchored regardless
          of any transformed/will-change ancestor (route template, framer). */}
      {open && mounted
        ? createPortal(
            <div
              id={`meganav-${open}`}
              role="region"
              aria-label={
                open === "communities" ? dict.nav.areas
                  : open === "tools" ? dict.nav.groups.tools
                    : dict.nav.groups.insights
              }
              className="mega-in fixed inset-x-0 top-[var(--header-h)] z-[var(--z-header)] hidden border-b border-border bg-surface/98 shadow-elevation-lg backdrop-blur-xl lg:block"
              onPointerEnter={cancelClose}
              onPointerLeave={scheduleClose}
              onKeyDown={onKeyDown}
            >
              <div className="mx-auto max-w-[1200px] px-8 py-7">
                {open === "communities" && <CommunitiesPanel lp={lp} dict={dict} />}
                {open === "tools" && <ToolsPanel lp={lp} dict={dict} />}
                {open === "insights" && <InsightsPanel lp={lp} dict={dict} />}
              </div>
            </div>,
            document.body,
          )
        : null}
    </nav>
  );
}

type Dict = ReturnType<typeof useI18n>["dict"];
type LP = (href: string) => string;

const colHead = "section-eyebrow mb-3";
const megaLink = "iop-btn-press focus-ring block rounded-lg px-2 py-1.5 text-sm text-muted transition hover:bg-surface-alt hover:text-brand";

function CommunitiesPanel({ lp, dict }: { lp: LP; dict: Dict }) {
  const { topCommunities } = useNavData();
  return (
    <div className="grid grid-cols-[1fr_260px] gap-8">
      <div>
        <p className={colHead}>{dict.nav.mega.topCommunities}</p>
        <div className="grid grid-cols-4 gap-2">
          {topCommunities.map((c) => (
            <Link
              key={c.slug}
              href={lp(`/communities/${c.slug}`)}
              className="iop-btn-press focus-ring group flex items-center gap-3 rounded-xl p-2 transition hover:bg-surface-alt"
            >
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-alt">
                {c.image ? (
                  <Image src={c.image} alt="" fill sizes="44px" className="object-cover" {...unoptimizedProp(c.image)} />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-text-dark group-hover:text-brand">
                  {c.name}
                </span>
                <span className="block text-xs text-muted-light">
                  {c.projectCount} · {c.minPriceAed > 0 ? formatPrice(c.minPriceAed, "AED", { compact: true }) : "—"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
      <div className="border-s border-border ps-8">
        <p className={colHead}>{dict.nav.mega.locationGuides}</p>
        <div className="space-y-0.5">
          {LOCATION_GUIDE_LINKS.map((g) => (
            <Link key={g.slug} href={lp(`/locations/${g.slug}`)} className={megaLink}>
              {g.label}
            </Link>
          ))}
        </div>
        <Link href={lp("/communities")} className="iop-btn-press focus-ring mt-4 inline-block text-sm font-semibold text-brand hover:text-brand-dark">
          {dict.nav.mega.allCommunities}
        </Link>
      </div>
    </div>
  );
}

function ToolsPanel({ lp, dict }: { lp: LP; dict: Dict }) {
  return (
    <div className="grid grid-cols-[1fr_220px] gap-8">
      <div>
        <p className={colHead}>{dict.nav.groups.tools}</p>
        <div className="grid grid-cols-2 gap-1">
          {DATAGURU_TOOLS.map((t) => (
            <Link
              key={t.slug}
              href={lp(t.href)}
              className="iop-btn-press focus-ring group rounded-xl p-2.5 transition hover:bg-surface-alt"
            >
              <span className="block text-sm font-semibold text-text-dark group-hover:text-brand">{t.title}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-light">{t.description}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="border-s border-border ps-8">
        <p className={colHead}>{dict.nav.mega.marketData}</p>
        <div className="space-y-0.5">
          <Link href={lp("/compare")} className={megaLink}>{dict.nav.mega.compareHub}</Link>
          <Link href={lp("/market-data")} className={megaLink}>{dict.nav.mega.marketData}</Link>
          <Link href={lp("/map")} className={megaLink}>{dict.nav.map}</Link>
        </div>
      </div>
    </div>
  );
}

function InsightsPanel({ lp, dict }: { lp: LP; dict: Dict }) {
  return (
    <div className="grid grid-cols-[1fr_200px] gap-8">
      <div>
        <p className={colHead}>{dict.nav.mega.buyerGuides}</p>
        <div className="grid grid-cols-2 gap-0.5">
          {GUIDE_CARDS.filter((g) => g.href.startsWith("/guides/")).map((g) => (
            <Link key={g.slug} href={lp(g.href)} className={megaLink}>{g.title}</Link>
          ))}
          <Link href={lp("/faq")} className={megaLink}>{dict.nav.faq}</Link>
          <Link href={lp("/news")} className={megaLink}>{dict.nav.news}</Link>
        </div>
      </div>
      <div className="border-s border-border ps-8">
        <p className={colHead}>{dict.nav.mega.company}</p>
        <div className="space-y-0.5">
          <Link href={lp("/about")} className={megaLink}>{dict.nav.about}</Link>
          <Link href={lp("/contact")} className={megaLink}>{dict.nav.contact}</Link>
        </div>
      </div>
    </div>
  );
}
