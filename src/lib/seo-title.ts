/**
 * Soft SEO title helpers — keep SERP titles short and free of double-branding.
 *
 * Layout templates append ` | invest off-plan` when `title` is a plain string.
 * Absolute titles skip the template and must include branding themselves (once).
 * Prefer plain titles + template so the brand is applied consistently.
 */

/** Google SERP truncation budget (characters). */
export const SEO_TITLE_MAX = 60;

/** Layout `title.template` suffix length (`" | invest off-plan"`). */
export const SEO_TITLE_BRAND_LEN = " | invest off-plan".length;

/**
 * Hard-cap a title string. Prefers a word boundary near the end so we do not
 * leave a dangling "—" or mid-word cut when possible.
 */
export function clampSeoTitle(title: string, max = SEO_TITLE_MAX): string {
  const t = title.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const sliced = t.slice(0, max).trimEnd();
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace >= Math.floor(max * 0.55)) {
    return sliced.slice(0, lastSpace).replace(/[—–\-:|,\s]+$/u, "").trimEnd();
  }
  return sliced.replace(/[—–\-:|,\s]+$/u, "").trimEnd();
}

/**
 * Base title for A-vs-B pair pages. Leaves room for the layout brand suffix so
 * the rendered `<title>` stays ≤ {@link SEO_TITLE_MAX}.
 *
 * @param kind Short category bit, e.g. "developers" / "off-plan" — omitted when
 * the names alone already fill the budget.
 */
export function comparePairTitle(
  a: string,
  b: string,
  kind?: string,
): string {
  const maxBase = SEO_TITLE_MAX - SEO_TITLE_BRAND_LEN;
  const core = `${a.trim()} vs ${b.trim()}`;
  if (!kind?.trim()) return clampSeoTitle(core, maxBase);
  const withKind = `${core} — ${kind.trim()}`;
  if (withKind.length <= maxBase) return withKind;
  // Drop the kind bit before hard-clamping names.
  return clampSeoTitle(core, maxBase);
}
