import Image from "next/image";
import type { Project } from "@/lib/types";
import { unoptimizedProp } from "@/lib/asset-image";

interface ProjectMasterplanProps {
  project: Project;
}

export function ProjectMasterplan({ project }: ProjectMasterplanProps) {
  if (!project.masterPlanUrl) return null;

  return (
    <section
      id="masterplan"
      aria-labelledby="masterplan-heading"
      className="mt-10 scroll-mt-24"
    >
      <h2
        id="masterplan-heading"
        className="font-display text-2xl font-semibold text-text-dark md:text-3xl"
      >
        {project.name} <em className="italic">masterplan</em>
      </h2>
      <p className="mt-2 text-sm text-muted">
        Master development layout for {project.developer}&apos;s {project.name}.
      </p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface-alt shadow-elevation-sm">
        <Image
          src={project.masterPlanUrl}
          alt={`Masterplan for ${project.name}`}
          width={1600}
          height={900}
          className="h-auto w-full object-contain"
          sizes="(max-width: 1200px) 100vw, 1200px"
          {...unoptimizedProp(project.masterPlanUrl)}
        />
      </div>
    </section>
  );
}