"use client";

import { cn } from "@/lib/cn";

interface BrochureButtonProps {
  url: string;
  projectName: string;
  variant?: "card" | "hero" | "inline" | "ghost-light";
  className?: string;
  onOpenModal?: () => void;
}

export function BrochureButton({
  url,
  projectName,
  variant = "card",
  className,
  onOpenModal,
}: BrochureButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onOpenModal) {
      e.preventDefault();
      onOpenModal();
    }
  };

  if (variant === "hero") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center rounded bg-brand px-9 py-5 text-xl font-bold text-white shadow-[0_2px_25px_rgba(0,137,182,0.3)] transition hover:bg-brand-dark",
          className,
        )}
      >
        Download Free PDF Brochure →
      </a>
    );
  }

  if (variant === "inline") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1 text-sm font-bold text-brand transition hover:text-brand-dark",
          className,
        )}
      >
        Download Brochure →
      </a>
    );
  }

  if (variant === "ghost-light") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        aria-label={`Download brochure for ${projectName}`}
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-white/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-text-dark",
          className,
        )}
      >
        Brochure
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={`Download brochure for ${projectName}`}
      className={cn(
        "inline-flex items-center justify-center rounded-xl border border-brand-outline px-4 py-3 text-sm font-semibold text-brand-outline transition hover:border-brand-dark hover:text-brand-dark",
        className,
      )}
    >
      Brochure
    </a>
  );
}