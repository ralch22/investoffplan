"use client";

import { LocaleLink } from "@/components/locale-link";
import { useI18n } from "@/i18n/locale-provider";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { dict } = useI18n();
  // Pages hardcode the "Home" crumb; translate it centrally so every AR page
  // (mostly EN server pages re-exported under /ar) localizes without plumbing.
  const label = (item: BreadcrumbItem) =>
    item.label === "Home" ? dict.common.home : item.label;

  return (
    <nav aria-label={dict.common.breadcrumbAria} className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {index > 0 ? <span aria-hidden className="text-muted-light">/</span> : null}
              {item.href && !isLast ? (
                <LocaleLink
                  href={item.href}
                  className="font-medium transition hover:text-brand"
                >
                  {label(item)}
                </LocaleLink>
              ) : (
                <span
                  className={isLast ? "font-medium text-text-dark" : undefined}
                  aria-current={isLast ? "page" : undefined}
                >
                  {label(item)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
