"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate } from "@/i18n/config";

interface ShareButtonProps {
  title: string;
  className?: string;
}

export function ShareButton({ title, className }: ShareButtonProps) {
  const { dict } = useI18n();
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={
        copied
          ? dict.common.linkCopiedAria
          : interpolate(dict.common.shareAria, { title })
      }
      className={
        className ??
        "iop-btn-press focus-ring rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand"
      }
    >
      {copied ? dict.common.linkCopied : dict.common.share}
    </button>
  );
}