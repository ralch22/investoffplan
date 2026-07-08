import Image from "next/image";
import { cn } from "@/lib/cn";
import { unoptimizedProp } from "@/lib/asset-image";

export type BrandLogoVariant =
  | "horizontal-dark"
  | "horizontal-white"
  | "stacked-white-arlo"
  | "icon-red";

const LOGOS: Record<
  BrandLogoVariant,
  { src: string; width: number; height: number; sizes: string }
> = {
  "horizontal-dark": {
    src: "/brand/horizontal-dark.svg",
    width: 180,
    height: 41,
    sizes: "180px",
  },
  "horizontal-white": {
    src: "/brand/horizontal-white.svg",
    width: 180,
    height: 41,
    sizes: "180px",
  },
  "stacked-white-arlo": {
    src: "/brand/stacked-white-arlo.svg",
    width: 200,
    height: 102,
    sizes: "200px",
  },
  "icon-red": {
    src: "/brand/icon-red.svg",
    width: 48,
    height: 48,
    sizes: "48px",
  },
};

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({
  variant = "horizontal-dark",
  className,
  priority,
}: BrandLogoProps) {
  const logo = LOGOS[variant];

  return (
    <Image
      src={logo.src}
      alt="invest off-plan"
      width={logo.width}
      height={logo.height}
      sizes={logo.sizes}
      className={cn("h-auto w-auto max-w-full", className)}
      priority={priority}
      {...unoptimizedProp(logo.src)}
    />
  );
}