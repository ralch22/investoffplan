"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { unoptimizedProp } from "@/lib/asset-image";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate } from "@/i18n/config";

interface MediaGalleryLightboxProps {
  images: string[];
  alt: string;
  active: number;
  open: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}

export function MediaGalleryLightbox({
  images,
  alt,
  active,
  open,
  onClose,
  onPrev,
  onNext,
  onSelect,
}: MediaGalleryLightboxProps) {
  const { dict } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;
  const currentSrc = images[active];

  // Mount only while open. A closed lightbox used to still SSR/hydrate a
  // next/image with priority on every card (SERP PAGE_SIZE=24 → 24 preloads
  // racing the real LCP hero). Unmounting removes those preloads from the
  // critical path on home, /projects, and PDP.
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onPrev, onNext, onClose]);

  function handleTouchStart(clientX: number) {
    touchStartX.current = clientX;
  }

  function handleTouchEnd(clientX: number) {
    if (touchStartX.current == null || count < 2) return;
    const delta = clientX - touchStartX.current;
    if (delta > 48) onPrev();
    else if (delta < -48) onNext();
    touchStartX.current = null;
  }

  if (!open || !count || !currentSrc) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-label={
        alt
          ? interpolate(dict.a11y.photoGalleryNamed, { alt })
          : dict.a11y.photoGallery
      }
      className="fixed inset-0 z-[var(--z-modal)] m-0 h-full max-h-none w-full max-w-none border-0 bg-black/95 p-0 backdrop:bg-black/80"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="relative flex h-full w-full flex-col">
        <div className="flex items-center justify-between gap-4 px-4 py-3 text-white md:px-6">
          <p className="text-sm font-medium">
            <span className="font-semibold">{alt}</span>
            <span
              className="ms-2 tabular-nums text-white/70"
              aria-live="polite"
              aria-atomic="true"
            >
              {active + 1} / {count}
            </span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring-light inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label={dict.a11y.closeGallery}
          >
            <CloseIcon />
          </button>
        </div>

        <div
          className="relative min-h-0 flex-1 px-4 pb-6 md:px-10"
          onTouchStart={(e) => handleTouchStart(e.changedTouches[0]?.clientX ?? 0)}
          onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0]?.clientX ?? 0)}
        >
          <div className="relative mx-auto h-full max-w-[1400px]">
            <Image
              key={`lb-${currentSrc}`}
              src={currentSrc}
              alt={`${alt} — photo ${active + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              // Safe: tree only mounts while the user has opened the lightbox.
              priority
              {...unoptimizedProp(currentSrc)}
            />
          </div>

          {count > 1 ? (
            <>
              <button
                type="button"
                onClick={onPrev}
                className="focus-ring-light absolute start-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 md:start-6"
                aria-label={dict.a11y.previousPhoto}
              >
                <ChevronIcon direction="left" />
              </button>
              <button
                type="button"
                onClick={onNext}
                className="focus-ring-light absolute end-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 md:end-6"
                aria-label={dict.a11y.nextPhoto}
              >
                <ChevronIcon direction="right" />
              </button>
            </>
          ) : null}
        </div>

        {count > 1 ? (
          <div className="border-t border-white/10 px-4 py-3 md:px-6">
            <div className="mx-auto flex max-w-[1400px] gap-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={`lb-thumb-${i}-${src}`}
                  type="button"
                  aria-label={`Show image ${i + 1} of ${count}`}
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => onSelect(i)}
                  className={cn(
                    "focus-ring-light relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition",
                    i === active
                      ? "border-white"
                      : "border-transparent opacity-60 hover:opacity-100",
                  )}
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="80px" {...unoptimizedProp(src)} />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </dialog>
  );
}

export function useGalleryIndex(length: number, initial = 0) {
  const goTo = useCallback(
    (index: number) => {
      if (!length) return 0;
      return ((index % length) + length) % length;
    },
    [length],
  );

  return { goTo };
}

export function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-5 w-5 fill-none stroke-current stroke-2 rtl:-scale-x-100"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="M12 4 6 10l6 6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M8 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function ExpandIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden>
      <path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden>
      <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
    </svg>
  );
}