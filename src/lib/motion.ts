import type { Transition } from "framer-motion";

/**
 * Shared spring for interactive card transforms (hover lift / tap). Tuned soft
 * enough to feel physical without overshoot. Disabled automatically when the
 * visitor prefers reduced motion via <MotionConfig reducedMotion="user">.
 */
export const cardSpring: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
};

/**
 * Unified scroll-reveal for every project card. Cards fade + rise into view
 * once, staggered by their index so a grid animates in sequence instead of
 * firing all at once. The `y` offset is a transform (no layout shift → no CLS),
 * and MotionConfig reducedMotion="user" neutralises it for reduced-motion users.
 */
export function cardEntrance(index = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5, delay: index * 0.06, ease: "easeOut" },
  } as const;
}

/** Spring-driven hover lift shared across cards. */
export const cardHoverLift = {
  whileHover: { y: -4, transition: cardSpring },
} as const;
