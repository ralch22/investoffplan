import Link from "next/link";
import { cn } from "@/lib/cn";

interface PrimaryButtonProps {
  href?: string;
  children: React.ReactNode;
  className?: string;
  showArrow?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "solid" | "ghost";
  disabled?: boolean;
}

export function PrimaryButton({
  href,
  children,
  className,
  showArrow = true,
  onClick,
  type = "button",
  variant = "solid",
  disabled = false,
}: PrimaryButtonProps) {
  const classes = cn(
    "iop-btn-press focus-ring inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold",
    variant === "solid"
      ? "bg-brand text-white shadow-elevation-sm hover:bg-brand-dark"
      : "border border-white/50 bg-white/10 text-white backdrop-blur-sm hover:border-white hover:bg-white/20",
    disabled && "pointer-events-none opacity-60",
    className,
  );

  const content = (
    <>
      {children}
      {showArrow ? <ArrowIcon /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} disabled={disabled}>
      {content}
    </button>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
      <path
        d="M4 10h10.5M11.5 6.5 15 10l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}