import { cn } from "@/lib/cn";

interface PaymentRibbonProps {
  /** e.g. "20/40/40 Payment Plan" or "Post-Handover Plan". */
  label: string;
  className?: string;
}

/**
 * The signature red payment-plan ribbon that breaks out of the card image's
 * start edge (Figma `Search Results Page - Grid.png`). A folded corner tucks
 * behind the card so the bar reads as a physical ribbon wrapping the photo —
 * the "own the card" gesture the generic rounded pill flattened.
 *
 * RTL-safe: positioned with logical `-start-2`, and the fold triangle uses
 * logical border sides, so it mirrors correctly under `dir="rtl"`.
 */
export function PaymentRibbon({ label, className }: PaymentRibbonProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute -start-2 top-4 z-10 flex select-none flex-col items-start",
        className,
      )}
    >
      <span
        className={cn(
          "relative flex items-center bg-brand py-1.5 pe-4 ps-3 text-[11px] font-bold uppercase leading-none tracking-[0.08em] text-white shadow-elevation-md",
          // chevron tail notched into the END edge; mirrored under RTL
          "[clip-path:polygon(0_0,100%_0,calc(100%-9px)_50%,100%_100%,0_100%)]",
          "rtl:[clip-path:polygon(9px_0,100%_0,100%_100%,9px_100%,0_50%)]",
        )}
      >
        {label}
      </span>
      {/* folded corner tucked behind the card edge */}
      <span
        aria-hidden
        className="h-0 w-0 border-s-8 border-t-8 border-s-transparent border-t-brand-dark"
      />
    </div>
  );
}
