import type { Project } from "@/lib/types";

interface ProjectTimelineProps {
  project: Project;
}

interface Milestone {
  label: string;
  value: string;
  state: "done" | "active" | "upcoming";
}

function formatMonth(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * Horizontal milestone bar: sales launch → construction → handover. Every
 * milestone renders REAL data only (salesStartDate ~46% coverage,
 * constructionProgress currently absent from the feed — the % chip lights up
 * automatically if the ingest ever supplies it). Falls back gracefully to
 * status-derived states, never invented dates.
 */
export function ProjectTimeline({ project }: ProjectTimelineProps) {
  const salesStart = project.salesStartDate ? formatMonth(project.salesStartDate) : null;
  const progress =
    typeof project.constructionProgress === "number" &&
    project.constructionProgress > 0 &&
    project.constructionProgress <= 100
      ? Math.round(project.constructionProgress)
      : null;

  const isReady = project.status === "ready";
  const inConstruction = project.status === "under-construction" || isReady;

  const milestones: Milestone[] = [
    {
      label: "Sales launch",
      value: salesStart ?? (project.status === "sold-out" ? "Closed" : "Open now"),
      state: "done",
    },
    {
      label: "Construction",
      value: isReady
        ? "Complete"
        : progress != null
          ? `${progress}% complete`
          : inConstruction
            ? "In progress"
            : "Off-plan",
      state: isReady ? "done" : inConstruction ? "active" : "upcoming",
    },
    {
      label: "Handover",
      value: project.handover ?? "To be announced",
      state: isReady ? "done" : "upcoming",
    },
  ];

  // Fill fraction for the connecting track: done segments full, active half.
  const doneCount = milestones.filter((m) => m.state === "done").length;
  const activeCount = milestones.filter((m) => m.state === "active").length;
  const fillPct = Math.min(
    100,
    ((doneCount + activeCount * 0.5) / milestones.length) * 100,
  );

  return (
    <section aria-labelledby="timeline-heading" className="mt-10">
      <h2
        id="timeline-heading"
        className="font-display text-2xl font-semibold text-text-dark md:text-3xl"
      >
        Project <em className="italic">timeline</em>
      </h2>
      <div className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-elevation-sm md:p-6">
        <div className="relative">
          {/* track */}
          <div className="absolute inset-x-4 top-[7px] h-0.5 rounded bg-border" aria-hidden />
          <div
            className="absolute start-4 top-[7px] h-0.5 rounded bg-brand"
            style={{ width: `calc(${fillPct}% - 2rem)` }}
            aria-hidden
          />
          <ol className="relative grid grid-cols-3 gap-2">
            {milestones.map((m) => (
              <li key={m.label} className="flex flex-col items-start gap-2 px-1 first:items-start last:items-end md:items-center md:first:items-start md:last:items-end">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                    m.state === "done"
                      ? "bg-brand"
                      : m.state === "active"
                        ? "border-2 border-brand bg-white"
                        : "bg-border-strong"
                  }`}
                  aria-hidden
                />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-light">
                  {m.label}
                </span>
                <span className="-mt-1 text-sm font-semibold text-text-dark">
                  {m.value}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
