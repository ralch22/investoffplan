export type CompareUnitId = `${string}:${string}`;

function isCompareUnitId(value: string): value is CompareUnitId {
  const colonIdx = value.indexOf(":");
  return colonIdx > 0 && colonIdx < value.length - 1;
}

export function parseCompareIds(raw: string | null | undefined): CompareUnitId[] {
  if (!raw) return [];
  const seen = new Set<string>();
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(isCompareUnitId)
    // De-dupe so the same unit can't render as two identical compare columns.
    .filter((id) => (seen.has(id) ? false : (seen.add(id), true)))
    .slice(0, 3);
}

export function serializeCompareIds(ids: CompareUnitId[]): string {
  return ids.join(",");
}

export function removeCompareId(
  ids: CompareUnitId[],
  id: CompareUnitId,
): CompareUnitId[] {
  return ids.filter((item) => item !== id);
}