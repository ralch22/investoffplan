"use client";

import { useState } from "react";
import { parseMedia, type Media } from "@/lib/media";

interface ProjectMediaProps {
  videoUrl?: string | null;
  virtualTourUrl?: string | null;
  projectName: string;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/** Self-hosted mp4 — renders the native player inline (controls visible). */
function VideoFile({ src, title }: { src: string; title: string }) {
  return (
    <video
      controls
      preload="metadata"
      playsInline
      title={title}
      className="aspect-video w-full rounded-2xl bg-surface-darker"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

/** Click-to-load facade → swaps to the real iframe on click (keeps the PDP fast). */
function EmbedFacade({
  media,
  title,
  eyebrow,
  cta,
}: {
  media: Media;
  title: string;
  eyebrow: string;
  cta: string;
}) {
  const [loaded, setLoaded] = useState(false);
  if (loaded && media.embedSrc) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-surface-darker">
        <iframe
          src={`${media.embedSrc}${media.embedSrc.includes("?") ? "&" : "?"}autoplay=1`}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      style={media.poster ? { backgroundImage: `url(${media.poster})` } : undefined}
      className="iop-btn-press focus-ring group relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-surface-dark to-surface-darker bg-cover bg-center text-white"
      aria-label={`${cta} — ${title}`}
    >
      {media.poster ? <span className="absolute inset-0 bg-black/35 transition group-hover:bg-black/25" aria-hidden /> : null}
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-elevation-lg transition group-hover:scale-105">
        <PlayIcon />
      </span>
      <span className="relative text-xs font-semibold uppercase tracking-wide text-white/80">{eyebrow}</span>
      <span className="relative text-sm font-semibold">{cta}</span>
    </button>
  );
}

function TourLink({ url, title }: { url: string; title: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="iop-btn-press focus-ring group flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface-alt text-center transition hover:border-brand/30"
      aria-label={`Explore virtual tour — ${title}`}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-elevation-md transition group-hover:scale-105">
        <PlayIcon />
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-light">Virtual tour</span>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
        Explore virtual tour
        <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M12.5 3h4.5v4.5h-1.5V5.56l-6.22 6.22-1.06-1.06L14.44 4.5H12.5V3zM5 5h3v1.5H6.5v8h8V13H16v3H5V5z" />
        </svg>
      </span>
    </a>
  );
}

export function ProjectMedia({ videoUrl, virtualTourUrl, projectName }: ProjectMediaProps) {
  const video = videoUrl?.trim() || null;
  const tour = virtualTourUrl?.trim() || null;

  const videoMedia = video ? parseMedia(video) : null;
  const tourMedia = tour ? parseMedia(tour) : null;

  // Video is embed-only — a non-embeddable "video" (developer landing page) is
  // dropped, never rendered as an external link.
  const showVideo = videoMedia && videoMedia.kind !== "link" && videoMedia.kind !== "matterport";
  const showTour = tourMedia != null;
  if (!showVideo && !showTour) return null;

  return (
    <section id="media" className="mt-12 scroll-mt-24">
      <h2 className="text-xl font-semibold text-text-dark">Video &amp; virtual tour</h2>
      <p className="mt-1 text-sm text-muted">Walkthroughs and 3D tours from the developer.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {showVideo && videoMedia ? (
          videoMedia.kind === "file" && videoMedia.fileSrc ? (
            <VideoFile src={videoMedia.fileSrc} title={`${projectName} video`} />
          ) : (
            <EmbedFacade media={videoMedia} eyebrow="Video" cta="Play video" title={`${projectName} video`} />
          )
        ) : null}
        {showTour && tourMedia ? (
          tourMedia.kind === "matterport" ? (
            <EmbedFacade media={tourMedia} eyebrow="Virtual tour" cta="Launch 3D tour" title={`${projectName} tour`} />
          ) : (
            <TourLink url={tour!} title={projectName} />
          )
        ) : null}
      </div>
    </section>
  );
}
