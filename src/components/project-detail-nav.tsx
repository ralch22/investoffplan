"use client";

import { cn } from "@/lib/cn";

import { PROJECT_DETAIL_SECTIONS } from "@/lib/project-detail-sections";
import { useI18n } from "@/i18n/locale-provider";
import type { Dict } from "@/i18n";

interface ProjectDetailNavProps {
  sections?: Array<{ id: string; label: string }>;
}

// Section ids use kebab-case; the dictionary keys are camelCase.
const SECTION_DICT_KEY: Record<string, keyof Dict["pdp"]["sections"]> = {
  overview: "overview",
  "key-facts": "keyFacts",
  masterplan: "masterplan",
  "floor-plans": "floorPlans",
  units: "units",
  media: "media",
  "living-in-area": "livingInArea",
  location: "location",
  calculator: "calculator",
  related: "related",
};

export function ProjectDetailNav({
  sections = [...PROJECT_DETAIL_SECTIONS],
}: ProjectDetailNavProps) {
  const { dict } = useI18n();
  const sectionLabel = (id: string, fallback: string) => {
    const key = SECTION_DICT_KEY[id];
    return key ? dict.pdp.sections[key] : fallback;
  };
  return (
    <nav
      aria-label={dict.pdp.sectionsAria}
      className="sticky top-[var(--header-h)] z-[var(--z-subheader)] -mx-5 border-b border-border bg-surface/95 px-5 py-2 backdrop-blur-xl md:-mx-8 md:mt-6 md:px-8"
    >
      <ul className="flex gap-1 overflow-x-auto pb-0.5">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={cn(
                "iop-btn-press focus-ring inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition",
                "text-muted hover:bg-brand-muted hover:text-brand",
              )}
            >
              {sectionLabel(section.id, section.label)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}