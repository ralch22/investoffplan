import Link from "next/link";
import { cn } from "@/lib/cn";

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
  linkLabel = "View all",
  align = "left",
  className,
}: SectionHeadingProps) {
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
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-brand transition hover:text-brand-dark focus-ring rounded-sm"
        >
          {linkLabel} →
        </Link>
      ) : null}
    </div>
  );
}