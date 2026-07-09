"use client";

import { useState } from "react";

interface ProjectMediaProps {
  videoUrl?: string | null;
  virtualTourUrl?: string | null;
  projectName: string;
}

type Media = { kind: "youtube" | "vimeo" | "matterport" | "link"; embedSrc?: string };

/** Classify an external media URL → an embeddable player or a plain link. */
export function parseMedia(raw: string): Media {
  try {
    const u = new URL(raw);
    const h = u.hostname.replace(/^www\./, "").toLowerCase();
    if (h === "youtube.com" || h === "m.youtube.com" || h === "youtube-nocookie.com") {
      const id = u.searchParams.get("v") || u.pathname.split("/embed/")[1]?.split("/")[0];
      if (id) return { kind: "youtube", embedSrc: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (h === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return { kind: "youtube", embedSrc: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (h === "vimeo.com" || h === "player.vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return { kind: "vimeo", embedSrc: `https://player.vimeo.com/video/${id}` };
    }
    if (h.endsWith("matterport.com")) {
      const m = u.searchParams.get("m");
      return { kind: "matterport", embedSrc: m ? `https://my.matterport.com/show/?m=${m}&play=1` : raw };
    }
  } catch {
    // fall through to link
  }
  return { kind: "link" };
}

const KIND_LABEL: Record<Media["kind"], string> = {
  youtube: "Play video",
  vimeo: "Play video",
  matterport: "Launch 3D tour",
  link: "Open",
};

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/** Click-to-load facade → swaps to the real iframe on click (keeps the PDP fast). */
function EmbedFacade({
  media,
  title,
  eyebrow,
}: {
  media: Media;
  title: string;
  eyebrow: string;
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
      className="iop-btn-press focus-ring group relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-surface-dark to-surface-darker text-white"
      aria-label={`${KIND_LABEL[media.kind]} — ${title}`}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-elevation-lg transition group-hover:scale-105">
        <PlayIcon />
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-white/70">{eyebrow}</span>
      <span className="text-sm font-semibold">{KIND_LABEL[media.kind]}</span>
    </button>
  );
}

function LinkCard({ url, title, eyebrow, cta }: { url: string; title: string; eyebrow: string; cta: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="iop-btn-press focus-ring group flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface-alt text-center transition hover:border-brand/30"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-elevation-md transition group-hover:scale-105">
        <PlayIcon />
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-light">{eyebrow}</span>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
        {cta}
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
  if (!video && !tour) return null;

  const videoMedia = video ? parseMedia(video) : null;
  const tourMedia = tour ? parseMedia(tour) : null;

  return (
    <section id="media" className="mt-12 scroll-mt-24">
      <h2 className="text-xl font-semibold text-text-dark">Video &amp; virtual tour</h2>
      <p className="mt-1 text-sm text-muted">Walkthroughs and 3D tours from the developer.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {video && videoMedia ? (
          videoMedia.kind === "link" ? (
            <LinkCard url={video} eyebrow="Video" cta="Watch video" title={`${projectName} video`} />
          ) : (
            <EmbedFacade media={videoMedia} eyebrow="Video" title={`${projectName} video`} />
          )
        ) : null}
        {tour && tourMedia ? (
          tourMedia.kind === "link" ? (
            <LinkCard url={tour} eyebrow="Virtual tour" cta="Explore virtual tour" title={`${projectName} tour`} />
          ) : (
            <EmbedFacade media={tourMedia} eyebrow="Virtual tour" title={`${projectName} virtual tour`} />
          )
        ) : null}
      </div>
    </section>
  );
}
