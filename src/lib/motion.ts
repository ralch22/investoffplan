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
 * Unified scroll-reveal for every project card.
 *
 * IMPORTANT: `initial.opacity` must stay 1 (or omit opacity). Framer Motion
 * serialises `initial` into SSR HTML — `opacity: 0` left the SERP looking blank
 * whenever hydrate was slow, blocked, or `whileInView` never fired (investoffplan.com/projects
 * incident, 2026-07-13). Only the translateY is animated so cards are always readable.
 *
 * MotionConfig reducedMotion="user" still neutralises motion for a11y users.
 */
export function cardEntrance(index = 0) {
  return {
    initial: { opacity: 1, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.12 },
    transition: {
      duration: 0.45,
      delay: Math.min(index, 10) * 0.05,
      ease: "easeOut",
    },
  } as const;
}

/** Spring-driven hover lift shared across cards. */
export const cardHoverLift = {
  whileHover: { y: -4, transition: cardSpring },
} as const;
