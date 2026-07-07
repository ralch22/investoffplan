import Link from "next/link";
import { DeveloperLogo } from "@/components/developer-logo";
import { slugify } from "@/lib/slugify";
import { cn } from "@/lib/cn";

interface DeveloperAttributionProps {
  name: string;
  logoUrl?: string;
  slug?: string;
  suffix?: string;
  variant?: "light" | "dark" | "muted";
  showLogo?: boolean;
  uppercase?: boolean;
  className?: string;
}

export function DeveloperAttribution({
  name,
  logoUrl,
  slug,
  suffix,
  variant = "muted",
  showLogo = true,
  uppercase = true,
  className,
}: DeveloperAttributionProps) {
  const resolvedSlug = slug ?? slugify(name);
  const textClass =
    variant === "light"
      ? "text-white/70 hover:text-white"
      : variant === "dark"
        ? "text-white/80 hover:text-white"
        : "text-muted hover:text-brand";

  return (
    <p
      className={cn(
        "flex items-center gap-2 text-xs font-medium tracking-wide",
        uppercase && "uppercase",
        variant === "light" || variant === "dark" ? "text-white/70" : "text-muted",
        className,
      )}
    >
      {showLogo ? (
        <DeveloperLogo name={name} logoUrl={logoUrl} slug={resolvedSlug} size="xs" link />
      ) : null}
      <span className="min-w-0 truncate">
        <Link href={`/developers/${resolvedSlug}`} className={cn("transition", textClass)}>
          {name}
        </Link>
        {suffix ? <span className="normal-case tracking-normal">{suffix}</span> : null}
      </span>
    </p>
  );
}