export function ProjectsSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
      <div className="skeleton mb-8 h-12 w-full max-w-md rounded-xl" />
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <article
            key={i}
            className="overflow-hidden rounded-2xl border border-border bg-surface"
          >
            <div className="skeleton h-52 w-full" />
            <div className="space-y-3 p-5">
              <div className="skeleton h-4 w-1/3 rounded" />
              <div className="skeleton h-6 w-2/3 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-8 w-1/4 rounded" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}