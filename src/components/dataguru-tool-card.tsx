"use client";

import { LocaleLink } from "@/components/locale-link";
import { useI18n } from "@/i18n/locale-provider";
import type { DataGuruTool } from "@/lib/dataguru";

interface DataGuruToolCardProps {
  tool: DataGuruTool;
}

export function DataGuruToolCard({ tool }: DataGuruToolCardProps) {
  const { dict } = useI18n();
  return (
    <LocaleLink
      href={tool.href}
      className="group flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
        {tool.pfFeature}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-text-dark group-hover:text-brand">
        {tool.title}
      </h2>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        {tool.description}
      </p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">
        {dict.tools.openTool}
        <span aria-hidden className="transition group-hover:translate-x-0.5">
          →
        </span>
      </span>
    </LocaleLink>
  );
}
