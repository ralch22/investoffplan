"use client";

import dynamic from "next/dynamic";
import type { ProjectMapInnerProps } from "./project-map-inner";

export const ProjectMap = dynamic<ProjectMapInnerProps>(
  () => import("./project-map-inner").then((m) => m.ProjectMapInner),
  { ssr: false }
);