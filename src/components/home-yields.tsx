import type { CoveredArea } from "@/lib/area-compare";
import { LocaleLink } from "@/components/locale-link";
import { formatPrice } from "@/lib/format";
import { getDictionary, interpolate, type Locale } from "@/i18n";

/**
 * "Where the yields are" — top areas by real DLD gross rental yield. Grounds the
 * homepage in actual Dubai Land Department sold/rent data (2025), not marketing.
 * Locale-aware: the decorative italic heading stays rich in EN, plain in Arabic.
 */
export function HomeYields({
  areas,
  locale = "en",
}: {
  areas: CoveredArea[];
  locale?: Locale;
}) {
  if (areas.length === 0) return null;
  const dict = getDictionary(locale);
  const isEn = locale === "en";
  return (
    <section className="bg-surface py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-eyebrow">{dict.home.yieldsEyebrow}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-text-dark md:text-4xl">
              {isEn ? (
                <>
                  Where the <em className="italic text-brand">yields</em> are.
                </>
              ) : (
                dict.home.yieldsHeading
              )}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">{dict.home.yieldsBody}</p>
          </div>
          <LocaleLink
            href="/communities"
            className="iop-btn-press focus-ring rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            {dict.home.allCommunities}
          </LocaleLink>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a) => (
            <LocaleLink
              key={a.area.slug}
              href={`/communities/${a.area.slug}`}
              className="iop-btn-press focus-ring group flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5 shadow-elevation-sm transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-elevation-md"
            >
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-text-dark group-hover:text-brand">
                  {a.area.name}
                </p>
                <p className="mt-1 text-xs text-muted-light">
                  {a.stats.medianPrice != null
                    ? interpolate(dict.home.yieldsMedianSold, {
                        price: formatPrice(Math.round(a.stats.medianPrice), "AED"),
                      })
                    : interpolate(dict.home.yieldsSalesCount, {
                        count: a.stats.saleSample.toLocaleString(),
                      })}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="font-display text-2xl font-semibold tabular-nums text-brand">
                  {a.stats.grossYieldPct}%
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-light">
                  {dict.home.yieldsGrossYield}
                </p>
              </div>
            </LocaleLink>
          ))}
        </div>
      </div>
    </section>
  );
}
