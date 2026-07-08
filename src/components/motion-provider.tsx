"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * App-wide framer-motion settings. `reducedMotion="user"` makes every
 * framer-motion animation honour the visitor's prefers-reduced-motion setting,
 * matching the CSS kill-switch in globals.css on the JS side. Mounted as a
 * client leaf in both route-group layouts (en + ar).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
