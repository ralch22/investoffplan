"use client";

import { LocaleLink } from "@/components/locale-link";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/locale-provider";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel,
  align = "left",
  className,
}: SectionHeadingProps) {
  const { dict } = useI18n();
  const label = linkLabel ?? dict.common.viewAll;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "text-center sm:text-center sm:items-center",
        className,
      )}
    >
      <div className={align === "center" ? "mx-auto max-w-2xl" : ""}>
        <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em] text-text-dark">
          {title}
        </h2>
        {subtitle ? (
          <p className="prose-balance mt-2 text-sm text-muted md:text-base">{subtitle}</p>
        ) : null}
      </div>
      {href ? (
        <LocaleLink
          href={href}
          className="shrink-0 text-sm font-semibold text-brand transition hover:text-brand-dark focus-ring rounded-sm"
        >
          {label}
        </LocaleLink>
      ) : null}
    </div>
  );
}