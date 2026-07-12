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
  // Pages hardcode static crumb labels ("Home", "Projects", …); translate them
  // centrally so every AR page (mostly EN server pages re-exported under /ar)
  // localizes without plumbing. Dynamic crumbs (project/developer names) pass
  // through unchanged.
  const STATIC_LABELS: Record<string, string> = {
    Home: dict.common.home,
    Projects: dict.nav.projects,
    Developers: dict.nav.developers,
    Communities: dict.nav.areas,
    "Data toolkit": dict.nav.dataToolkit,
    FAQ: dict.nav.faq,
    Guides: dict.nav.guides,
    News: dict.nav.news,
    Favorites: dict.nav.favorites,
    Compare: dict.nav.tabs.compare,
    "Location guides": dict.nav.mega.locationGuides,
    "Investor Match": dict.tools.investorMatch.breadcrumb,
    Mortgage: dict.nav.mortgage,
    "Price map": dict.nav.priceMap,
    "Rent vs buy": dict.nav.rentVsBuy,
    "ROI estimator": dict.nav.roiEstimator,
    "Residential insights": dict.nav.residentialInsights,
    "Community insights": dict.nav.communityInsights,
    "Cookie policy": dict.nav.cookiePolicy,
    "Privacy policy": dict.nav.privacyPolicy,
  };
  const label = (item: BreadcrumbItem) =>
    STATIC_LABELS[item.label] ?? item.label;

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
