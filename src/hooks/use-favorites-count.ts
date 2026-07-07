"use client";

import { useEffect, useState } from "react";
import {
  FAVORITES_CHANGED_EVENT,
  getFavoriteSlugs,
} from "@/lib/favorites";

export function useFavoritesCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(getFavoriteSlugs().length);
    sync();
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return count;
}