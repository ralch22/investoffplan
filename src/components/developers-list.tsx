import Link from "next/link";
import { DeveloperLogo } from "@/components/developer-logo";
import { developerDescription } from "@/lib/developer-utils";
import type { DeveloperSummary } from "@/lib/types";

/**
 * Presentational developer list shared by the interactive directory and the
 * server-rendered Suspense fallback so the first page of developers is in the
 * SSR HTML (never "Loading developers…").
 */
export function DevelopersList({ items }: { items: DeveloperSummary[] }) {
  return (
    <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-white">
      {items.map((dev) => (
        <li
          key={dev.slug}
          className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:gap-6 md:p-6"
        >
          <DeveloperLogo
            name={dev.name}
            logoUrl={dev.logoUrl}
            slug={dev.slug}
            size="xl"
            link
            className="border border-border shadow-sm"
          />
          <div className="min-w-0 flex-1">
            {dev.foundedYear ? (
              <p className="text-sm text-muted">Founded in {dev.foundedYear}</p>
            ) : null}
            <h3 className="mt-1 text-xl font-semibold text-text-dark">
              <Link href={`/developers/${dev.slug}`} className="hover:text-brand">
                {dev.name}
              </Link>
            </h3>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
              {developerDescription(dev.slug, dev.description)}
            </p>
            <p className="mt-2 text-xs text-muted-light">
              {dev.projectCount} project{dev.projectCount === 1 ? "" : "s"} ·{" "}
              {dev.unitCount.toLocaleString()} unit options
            </p>
          </div>
          <Link
            href={`/developers/${dev.slug}`}
            className="iop-btn-press focus-ring shrink-0 self-start rounded-full border border-brand px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            Show projects
          </Link>
        </li>
      ))}
    </ul>
  );
}
