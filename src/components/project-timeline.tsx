import type { Project } from "@/lib/types";

interface ProjectTimelineProps {
  project: Project;
}

export function ProjectTimeline({ project }: ProjectTimelineProps) {
  const milestones = [
    {
      label: "Project listed",
      value: "Available now",
      complete: true,
    },
    {
      label: "Booking",
      value: project.status === "sold-out" ? "Closed" : "Open",
      complete: project.status !== "sold-out",
    },
    {
      label: "Construction",
      value:
        project.status === "under-construction"
          ? "In progress"
          : project.status === "ready"
            ? "Complete"
            : "Off-plan",
      complete:
        project.status === "under-construction" || project.status === "ready",
    },
    {
      label: "Expected completion",
      value: project.handover ?? "TBA",
      complete: project.status === "ready",
    },
  ];

  return (
    <section aria-labelledby="timeline-heading" className="mt-10">
      <h2
        id="timeline-heading"
        className="font-display text-2xl font-semibold text-text-dark md:text-3xl"
      >
        Project <em className="italic">timeline</em>
      </h2>
      <ol className="relative mt-6 border-l border-border pl-6">
        {milestones.map((milestone, index) => (
          <li key={milestone.label} className="relative pb-8 last:pb-0">
            <span
              className={`absolute -left-[1.65rem] flex h-3 w-3 rounded-full ring-4 ring-white ${
                milestone.complete ? "bg-brand" : "bg-border-strong"
              }`}
              aria-hidden
            />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-light">
              {milestone.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-text-dark">
              {milestone.value}
            </p>
            {index < milestones.length - 1 ? (
              <span className="sr-only">Step {index + 1} of {milestones.length}</span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}