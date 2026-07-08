/**
 * Mirrors the real SERP grid anatomy (design audit 3.2): dark cards in a
 * flex-wrap, a full-width featured card first, then 50%-width cards — so the
 * skeleton→content swap doesn't flash light→dark or reflow.
 */
export function ProjectsSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
      <div className="skeleton mb-8 h-12 w-full max-w-md rounded-xl" />
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <article
            key={i}
            className={
              "overflow-hidden rounded-2xl border border-border bg-surface-dark " +
              (i === 0 ? "w-full" : "w-full lg:w-[calc(50%-10px)]")
            }
          >
            <div
              className={
                "w-full animate-pulse bg-white/[0.06] " +
                (i === 0 ? "h-64 md:h-72" : "h-52 md:h-56")
              }
            />
            <div className="space-y-3 p-5">
              <div className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
              <div className="h-7 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-full animate-pulse rounded bg-white/10" />
              <div className="h-6 w-1/4 animate-pulse rounded bg-white/10" />
              <div className="flex gap-2 pt-1">
                <div className="h-9 w-28 animate-pulse rounded-full bg-white/10" />
                <div className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
