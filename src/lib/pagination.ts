export type PageItem = number | "ellipsis";

function rangeInclusive(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

/**
 * Windowed pagination model: always show the first and last page, the current
 * page with `siblingCount` neighbours on each side, and a single "ellipsis"
 * marker where a run of pages is collapsed. Keeps the control to a fixed, small
 * number of items regardless of total page count (never the naive "always 1–7").
 *
 * Examples (siblingCount = 1):
 *   (1, 10)  → 1 2 3 4 5 … 10
 *   (5, 10)  → 1 … 4 5 6 … 10
 *   (10, 10) → 1 … 6 7 8 9 10
 *   (3, 5)   → 1 2 3 4 5      (small totals: show everything)
 */
export function paginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount = 1,
): PageItem[] {
  const total = Math.max(1, totalPages);
  const page = Math.min(Math.max(1, currentPage), total);

  // first + last + current + siblings*2 + two ellipsis slots
  const maxNumbers = siblingCount * 2 + 5;
  if (total <= maxNumbers) return rangeInclusive(1, total);

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, total);

  // Only collapse when it saves more than the ellipsis itself would occupy.
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = siblingCount * 2 + 3;
    return [...rangeInclusive(1, leftItemCount), "ellipsis", total];
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = siblingCount * 2 + 3;
    return [1, "ellipsis", ...rangeInclusive(total - rightItemCount + 1, total)];
  }
  return [1, "ellipsis", ...rangeInclusive(leftSibling, rightSibling), "ellipsis", total];
}
