"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { serializeCompareIds } from "@/lib/compare";
import type { CompareUnitId } from "@/lib/compare";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate, localePath } from "@/i18n/config";

interface CompareBarProps {
  selectedIds: CompareUnitId[];
  onClear: () => void;
  className?: string;
}

export function CompareBar({
  selectedIds,
  onClear,
  className,
}: CompareBarProps) {
  const { dict, locale } = useI18n();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const active = selectedIds.length > 0;
  // Keep the AR browse loop under /ar (hub redirects ?units= → /compare/units).
  const compareHref = active
    ? `${localePath(locale, "/compare")}?units=${encodeURIComponent(serializeCompareIds(selectedIds))}`
    : undefined;

  return (
    <motion.div
      layout
      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      data-hydrated={hydrated ? "true" : "false"}
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm shadow-elevation-sm",
        active &&
          // Lift above cookie banner (--consent-h measured by CookieConsentBanner).
          "max-lg:fixed max-lg:inset-x-4 max-lg:bottom-[calc(var(--bottom-dock)+var(--consent-h,0px)+0.5rem)] max-lg:z-[var(--z-sticky)] max-lg:shadow-elevation-lg",
        active && "lg:sticky lg:bottom-4 lg:z-[var(--z-sticky)]",
        className,
      )}
    >
      {compareHref ? (
        <Link
          href={compareHref}
          data-testid="compare-link"
          className="iop-btn-press focus-ring inline-flex items-center gap-2 rounded-lg px-2 py-1 font-semibold text-brand"
        >
          <CompareIcon />
          {dict.common.compare}
          <span
            data-testid="compare-count"
            className="rounded-full bg-brand px-2 py-0.5 text-xs text-white"
          >
            {selectedIds.length}
          </span>
        </Link>
      ) : (
        <span className="inline-flex items-center gap-2 font-medium text-muted">
          <CompareIcon />
          {dict.common.compare}
        </span>
      )}
      {active ? (
        <button
          type="button"
          onClick={onClear}
          className="iop-btn-press focus-ring rounded-lg px-2 py-1 text-muted hover:text-text-dark"
        >
          {dict.common.compareClear}
        </button>
      ) : null}
      <span className="hidden text-muted-light sm:inline">
        {dict.common.compareHint}
      </span>
      <input type="hidden" data-compare-ids={selectedIds.join(",")} />
    </motion.div>
  );
}

export function CompareCheckbox({
  id,
  selectedIds,
  onToggle,
  variant = "default",
  label,
}: {
  id: CompareUnitId;
  selectedIds: CompareUnitId[];
  onToggle: (id: CompareUnitId) => void;
  variant?: "default" | "light";
  label?: string;
}) {
  const { dict } = useI18n();
  const checked = selectedIds.includes(id);
  const disabled = !checked && selectedIds.length >= 3;

  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 text-xs",
        variant === "light" ? "text-white/90" : "text-muted",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={() => onToggle(id)}
        aria-label={
          label
            ? interpolate(dict.common.compareProject, { name: label })
            : dict.common.compareUnit
        }
        className="focus-ring h-4 w-4 rounded border-border text-brand"
      />
      {dict.common.compare}
    </label>
  );
}

function CompareIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M6 4h8M6 10h8M6 16h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}