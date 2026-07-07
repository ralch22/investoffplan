import type { CompareUnitId } from "./compare";
import { parseCompareIds, serializeCompareIds } from "./compare";

const STORAGE_KEY = "iop-compare";

export function getStoredCompareIds(): CompareUnitId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return parseCompareIds(raw);
  } catch {
    return [];
  }
}

export function setStoredCompareIds(ids: CompareUnitId[]): void {
  if (typeof window === "undefined") return;
  if (ids.length === 0) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, serializeCompareIds(ids));
}