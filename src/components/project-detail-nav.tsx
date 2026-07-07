"use client";

import { cn } from "@/lib/cn";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "units", label: "Units" },
  { id: "calculator", label: "Calculator" },
  { id: "related", label: "Related" },
] as const;

export function ProjectDetailNav() {
  return (
    <nav
      aria-label="Project sections"
      className="sticky top-[57px] z-30 -mx-5 border-b border-border bg-surface/95 px-5 py-2 backdrop-blur-xl md:static md:mx-0 md:mt-6 md:border-0 md:bg-transparent md:p-0"
    >
      <ul className="flex gap-1 overflow-x-auto pb-0.5">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={cn(
                "iop-btn-press focus-ring inline-flex whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition",
                "text-muted hover:bg-brand-muted hover:text-brand",
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}