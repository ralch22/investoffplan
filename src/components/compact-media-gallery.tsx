"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  ChevronIcon,
  ExpandIcon,
  MediaGalleryLightbox,
} from "@/components/media-gallery-lightbox";

interface CompactMediaGalleryProps {
  images: string[];
  alt: string;
  className?: string;
  fallbackClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** Navigate to PDP when the image is clicked (controls always stop propagation) */
  projectHref?: string;
  soldOutGrayscale?: boolean;
  fill?: boolean;
}

export function CompactMediaGallery({
  images,
  alt,
  className,
  fallbackClassName,
  sizes = "(max-width: 768px) 100vw, 400px",
  priority = false,
  projectHref,
  soldOutGrayscale = false,
  fill = true,
}: CompactMediaGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;

  const goTo = useCallback(
    (index: number) => {
      if (!count) return;
      setActive(((index % count) + count) % count);
    },
    [count],
  );

  const goPrev = useCallback(
    (e?: { preventDefault: () => void; stopPropagation: () => void }) => {
      e?.preventDefault();
      e?.stopPropagation();
      goTo(active - 1);
    },
    [active, goTo],
  );

  const goNext = useCallback(
    (e?: { preventDefault: () => void; stopPropagation: () => void }) => {
      e?.preventDefault();
      e?.stopPropagation();
      goTo(active + 1);
    },
    [active, goTo],
  );

  function handleTouchStart(clientX: number) {
    touchStartX.current = clientX;
  }

  function handleTouchEnd(clientX: number) {
    if (touchStartX.current == null || count < 2) return;
    const delta = clientX - touchStartX.current;
    if (delta > 48) goTo(active - 1);
    else if (delta < -48) goTo(active + 1);
    touchStartX.current = null;
  }

  if (!count) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-surface-alt",
          fill ? "h-full min-h-[12rem] w-full" : "aspect-[4/3] w-full",
          fallbackClassName,
          className,
        )}
        aria-hidden
      />
    );
  }

  const currentSrc = images[active]!;

  const imageNode = (
    <Image
      key={currentSrc}
      src={currentSrc}
      alt={`${alt} — photo ${active + 1} of ${count}`}
      fill={fill}
      width={fill ? undefined : 400}
      height={fill ? undefined : 300}
      className={cn(
        "object-cover transition-opacity duration-200",
        soldOutGrayscale && "grayscale-[35%]",
        !fill && "h-full w-full",
      )}
      priority={priority && active === 0}
      sizes={sizes}
    />
  );

  return (
    <>
      <div
        className={cn(
          "group/gallery relative overflow-hidden bg-surface-darker",
          fill ? "h-full min-h-[12rem] w-full" : "aspect-[4/3] w-full",
          className,
        )}
        onTouchStart={(e) => handleTouchStart(e.changedTouches[0]?.clientX ?? 0)}
        onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0]?.clientX ?? 0)}
        aria-roledescription={count > 1 ? "carousel" : undefined}
      >
        {projectHref ? (
          <Link
            href={projectHref}
            className="absolute inset-0 z-0"
            aria-label={`View ${alt}`}
            onClick={(e) => {
              if (count > 1) {
                e.preventDefault();
                setLightboxOpen(true);
              }
            }}
          >
            {imageNode}
          </Link>
        ) : (
          <div className="absolute inset-0 z-0">{imageNode}</div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute start-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white opacity-100 backdrop-blur-sm transition hover:bg-black/70 md:opacity-0 md:group-hover/gallery:opacity-100"
              aria-label="Previous photo"
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute end-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white opacity-100 backdrop-blur-sm transition hover:bg-black/70 md:opacity-0 md:group-hover/gallery:opacity-100"
              aria-label="Next photo"
            >
              <ChevronIcon direction="right" />
            </button>
            <div
              className="absolute bottom-2 start-2 z-20 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm"
              aria-live="polite"
            >
              {active + 1} / {count}
            </div>
          </>
        ) : null}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLightboxOpen(true);
          }}
          className="absolute end-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
          aria-label={`View ${alt} photos fullscreen`}
        >
          <ExpandIcon />
        </button>
      </div>

      <MediaGalleryLightbox
        images={images}
        alt={alt}
        active={active}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onPrev={() => goTo(active - 1)}
        onNext={() => goTo(active + 1)}
        onSelect={setActive}
      />
    </>
  );
}