"use client";

import { motion } from "framer-motion";
import { cardEntrance } from "@/lib/motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function ScrollReveal({ children, className, as = "section" }: ScrollRevealProps) {
  const Component = motion.create(as);
  return (
    <Component {...cardEntrance(0)} className={className}>
      {children}
    </Component>
  );
}
