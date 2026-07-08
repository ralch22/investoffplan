import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { slugify } from "@/lib/slugify";
import { unoptimizedProp } from "@/lib/asset-image";

const SIZE_CLASSES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-sm",
  xl: "h-20 w-20 text-base",
} as const;

interface DeveloperLogoProps {
  name: string;
  logoUrl?: string;
  slug?: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
  link?: boolean;
  rounded?: "full" | "lg" | "none";
}

export function DeveloperLogo({
  name,
  logoUrl,
  slug,
  size = "md",
  className,
  link = false,
  rounded = "lg",
}: DeveloperLogoProps) {
  const resolvedSlug = slug ?? slugify(name);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const roundedClass =
    rounded === "full" ? "rounded-full" : rounded === "lg" ? "rounded-xl" : "rounded-none";

  const content = logoUrl ? (
    <Image
      src={logoUrl}
      alt={`${name} logo`}
      width={80}
      height={80}
      className={cn(
        "object-contain bg-white",
        SIZE_CLASSES[size],
        roundedClass,
        className,
      )}
      {...unoptimizedProp(logoUrl)}
    />
  ) : (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-surface-alt font-bold text-text-dark",
        SIZE_CLASSES[size],
        roundedClass,
        className,
      )}
      aria-hidden={link ? undefined : true}
    >
      {initials}
    </span>
  );

  if (link) {
    return (
      <Link
        href={`/developers/${resolvedSlug}`}
        className="inline-flex shrink-0 transition hover:opacity-80"
        title={name}
      >
        {content}
      </Link>
    );
  }

  return content;
}