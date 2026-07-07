export type CompareUnitId = `${string}:${string}`;

function isCompareUnitId(value: string): value is CompareUnitId {
  const colonIdx = value.indexOf(":");
  return colonIdx > 0 && colonIdx < value.length - 1;
}

export function parseCompareIds(raw: string | null | undefined): CompareUnitId[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(isCompareUnitId)
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