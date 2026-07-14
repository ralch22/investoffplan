"use client";

import { useState, useEffect } from "react";

export function useScrollDirection(threshold = 10) {
  const [scrollDir, setScrollDir] = useState<"up" | "down">("up");

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.scrollY;

      if (Math.abs(scrollY - lastScrollY) < threshold) {
        ticking = false;
        return;
      }

      // Ignore bounce effects at the top of the page on Safari
      if (scrollY <= 0) {
        setScrollDir("up");
        lastScrollY = 0;
        ticking = false;
        return;
      }

      setScrollDir(scrollY > lastScrollY ? "down" : "up");
      lastScrollY = scrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrollDir;
}
