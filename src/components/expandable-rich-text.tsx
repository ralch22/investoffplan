"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/locale-provider";

interface ExpandableRichTextProps {
  html: string;
  /** When true, clamp the block until the reader opts to expand it. */
  truncate: boolean;
  className?: string;
}

/**
 * Renders sanitized rich HTML. Long descriptions are clamped behind a
 * "Read more" toggle rather than cut mid-tag, so the markup stays valid.
 */
export function ExpandableRichText({
  html,
  truncate,
  className,
}: ExpandableRichTextProps) {
  const { dict } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const collapsed = truncate && !expanded;

  return (
    <div>
      <div
        className={[
          className,
          collapsed
            ? "relative max-h-[32rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {truncate ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-4 inline-flex items-center text-sm font-bold text-brand transition-colors duration-300 hover:text-brand-dark"
        >
          {expanded ? dict.common.showLess : dict.common.readMore}
        </button>
      ) : null}
    </div>
  );
}
