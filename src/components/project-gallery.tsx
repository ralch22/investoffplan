"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ChevronIcon,
  ExpandIcon,
  MediaGalleryLightbox,
} from "@/components/media-gallery-lightbox";
import { cn } from "@/lib/cn";
import { unoptimizedProp } from "@/lib/asset-image";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate } from "@/i18n/config";

interface ProjectGalleryProps {
  images: string[];
  alt: string;
  fallbackClassName?: string;
  /** Omit images already shown in the page hero to avoid repetition */
  excludeUrls?: string[];
  className?: string;
}

function normalizeUrls(urls: string[]): string[] {
  return [...new Set(urls.filter(Boolean))];
}

export function ProjectGallery({
  images,
  alt,
  fallbackClassName,
  excludeUrls = [],
  className,
}: ProjectGalleryProps) {
  const { dict } = useI18n();
  const exclude = new Set(excludeUrls.filter(Boolean));
  const gallery = normalizeUrls(images).filter((src) => !exclude.has(src));
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const labelId = useId();
  const count = gallery.length;

  const goTo = useCallback(
    (index: number) => {
      if (!count) return;
      setActive(((index % count) + count) % count);
    },
    [count],
  );

  const goPrev = useCallback(() => goTo(active - 1), [active, goTo]);
  const goNext = useCallback(() => goTo(active + 1), [active, goTo]);

  useEffect(() => {
    const strip = thumbStripRef.current;
    const thumb = strip?.querySelector<HTMLElement>(`[data-thumb-index="${active}"]`);
    thumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  function handleTouchStart(clientX: number) {
    touchStartX.current = clientX;
  }

  function handleTouchEnd(clientX: number) {
    if (touchStartX.current == null || count < 2) return;
    const delta = clientX - touchStartX.current;
    if (delta > 48) goPrev();
    else if (delta < -48) goNext();
    touchStartX.current = null;
  }

  if (!count) {
    return null;
  }

  const currentSrc = gallery[active]!;

  return (
    <>
      <section
        id="project-gallery"
        className={cn("mb-8 mt-6 scroll-mt-24", className)}
        aria-labelledby={count > 1 ? labelId : undefined}
        aria-roledescription={count > 1 ? "carousel" : undefined}
      >
        {count > 1 ? (
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id={labelId} className="text-lg font-semibold text-text-dark">
              Project gallery
            </h2>
            <p className="text-sm tabular-nums text-muted">
              {active + 1} of {count}
            </p>
          </div>
        ) : null}

        <div className="group/stage relative overflow-hidden rounded-2xl bg-surface-darker shadow-elevation-md">
          <div
            className="relative aspect-[16/10] w-full md:aspect-[16/9]"
            onTouchStart={(e) => handleTouchStart(e.changedTouches[0]?.clientX ?? 0)}
            onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0]?.clientX ?? 0)}
          >
            <Image
              key={currentSrc}
              src={currentSrc}
              alt={`${alt} — photo ${active + 1} of ${count}`}
              fill
              className="object-cover transition-opacity duration-300"
              priority={active === 0}
              fetchPriority={active === 0 ? "high" : "auto"}
              sizes="(max-width: 768px) 100vw, 1200px"
              {...unoptimizedProp(currentSrc)}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

            {count > 1 ? (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute start-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white opacity-100 backdrop-blur-sm transition hover:bg-black/65 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:start-4 md:opacity-0 md:group-hover/stage:opacity-100"
                  aria-label={dict.a11y.previousPhoto}
                >
                  <ChevronIcon direction="left" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute end-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white opacity-100 backdrop-blur-sm transition hover:bg-black/65 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:end-4 md:opacity-0 md:group-hover/stage:opacity-100"
                  aria-label={dict.a11y.nextPhoto}
                >
                  <ChevronIcon direction="right" />
                </button>
              </>
            ) : null}

            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute end-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label={interpolate(dict.a11y.viewFullscreen, { alt })}
            >
              <ExpandIcon />
              <span className="hidden sm:inline">{dict.common.fullscreen}</span>
            </button>

            {count > 1 ? (
              <div
                className="absolute bottom-3 start-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/45 px-2 py-1.5 backdrop-blur-sm"
                aria-hidden
              >
                {gallery.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200",
                      i === active ? "w-5 bg-white" : "w-1.5 bg-white/45",
                    )}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {count > 1 ? (
          <div className="relative mt-3">
            <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-8 bg-gradient-to-r from-[var(--background)] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-8 bg-gradient-to-l from-[var(--background)] to-transparent" />
            <div
              ref={thumbStripRef}
              className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label={dict.a11y.galleryThumbnails}
            >
              {gallery.map((src, i) => (
                <button
                  key={`${i}-${src}`}
                  type="button"
                  role="tab"
                  data-thumb-index={i}
                  aria-selected={i === active}
                  aria-label={`Photo ${i + 1} of ${count}`}
                  onClick={() => setActive(i)}
                  className={cn(
                    "relative h-[4.5rem] w-[6.5rem] shrink-0 snap-start overflow-hidden rounded-xl border-2 transition md:h-24 md:w-[7.5rem]",
                    i === active
                      ? "border-brand shadow-elevation-sm"
                      : "border-transparent opacity-80 hover:border-border hover:opacity-100",
                  )}
                >
                  <Image src={src} alt={`${alt} — photo ${i + 1}`} fill className="object-cover" sizes="120px" {...unoptimizedProp(src)} />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <MediaGalleryLightbox
        images={gallery}
        alt={alt}
        active={active}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onPrev={goPrev}
        onNext={goNext}
        onSelect={setActive}
      />
    </>
  );
}