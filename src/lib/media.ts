// Pure media-URL classification shared by the PDP media component (client),
// the PDP VideoObject JSON-LD (server), and the video sitemap (server).

export type Media = {
  kind: "youtube" | "vimeo" | "matterport" | "file" | "link";
  /** iframe src for youtube/vimeo/matterport. */
  embedSrc?: string;
  /** direct src for a self-hosted <video> (kind "file"). */
  fileSrc?: string;
  /** poster thumbnail (youtube). */
  poster?: string;
};

/** Classify a media URL → an embeddable player (iframe / <video>) or a plain link. */
export function parseMedia(raw: string): Media {
  try {
    const u = new URL(raw);
    const h = u.hostname.replace(/^www\./, "").toLowerCase();
    if (h === "youtube.com" || h === "m.youtube.com" || h === "youtube-nocookie.com") {
      const id = u.searchParams.get("v") || u.pathname.split("/embed/")[1]?.split("/")[0];
      if (id)
        return {
          kind: "youtube",
          embedSrc: `https://www.youtube-nocookie.com/embed/${id}`,
          poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        };
    }
    if (h === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id)
        return {
          kind: "youtube",
          embedSrc: `https://www.youtube-nocookie.com/embed/${id}`,
          poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        };
    }
    if (h === "vimeo.com" || h === "player.vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return { kind: "vimeo", embedSrc: `https://player.vimeo.com/video/${id}` };
    }
    if (h.endsWith("matterport.com")) {
      const m = u.searchParams.get("m");
      return { kind: "matterport", embedSrc: m ? `https://my.matterport.com/show/?m=${m}&play=1` : raw };
    }
    if (/\.mp4($|\?)/i.test(u.pathname)) {
      return { kind: "file", fileSrc: raw };
    }
  } catch {
    // fall through to link
  }
  return { kind: "link" };
}

/** True for a video that plays inside the PDP (never an external link-out). */
export function isEmbeddableVideo(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const k = parseMedia(raw).kind;
  return k === "youtube" || k === "vimeo" || k === "file";
}

/**
 * A Next.js sitemap `videos[]` entry for an embeddable video, or null.
 * player_loc for iframe embeds (youtube/vimeo), content_loc for self-hosted mp4.
 */
export function videoSitemapEntry(
  videoUrl: string | null | undefined,
  opts: { title: string; description: string; thumbnail: string },
): { title: string; thumbnail_loc: string; description: string; content_loc?: string; player_loc?: string } | null {
  if (!videoUrl) return null;
  const m = parseMedia(videoUrl);
  const thumb =
    m.poster ||
    (opts.thumbnail && /^https?:\/\//.test(opts.thumbnail) ? opts.thumbnail : "");
  if (!thumb) return null;
  const base = {
    title: opts.title.slice(0, 100),
    thumbnail_loc: thumb,
    description: (opts.description || opts.title).slice(0, 2048),
  };
  if (m.kind === "file" && m.fileSrc) return { ...base, content_loc: m.fileSrc };
  if ((m.kind === "youtube" || m.kind === "vimeo") && m.embedSrc) return { ...base, player_loc: m.embedSrc };
  return null;
}
