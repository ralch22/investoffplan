const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "h2",
  "h3",
  "h4",
  "strong",
  "b",
  "em",
  "i",
  "ul",
  "ol",
  "li",
  "span",
]);

// Tags that may legitimately be left empty once attributes and disallowed
// children are stripped — pruned by stripEmptyElements (`<h3></h3>`, `<p> </p>`,
// `<span>&nbsp;</span>`, `<p><br></p>`).
const EMPTY_STRIPPABLE = "p|h2|h3|h4|strong|b|em|i|ul|ol|li|span";

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  copy: "©",
  reg: "®",
  trade: "™",
  deg: "°",
};

// Decoding these back into markup could let attacker-encoded tags resurface
// after tag filtering, so the innerHTML path leaves them encoded.
const HTML_UNSAFE = new Set(["<", ">", "&"]);

function codePoint(n: number): string {
  if (!Number.isFinite(n) || n < 0 || n > 0x10ffff) return "";
  try {
    return String.fromCodePoint(n);
  } catch {
    return "";
  }
}

/** Fully decode HTML entities to literal characters (safe for plain text). */
export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => codePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => codePoint(Number(dec)))
    .replace(/&([a-zA-Z]+);/g, (match, name: string) => {
      const decoded = NAMED_ENTITIES[name.toLowerCase()];
      return decoded !== undefined ? decoded : match;
    });
}

/**
 * Normalise entities for the innerHTML path: decode cosmetic entities
 * (`&nbsp;`, dashes, smart quotes) but keep `<`/`>`/`&` encoded so filtered
 * markup cannot be reconstituted.
 */
function normaliseHtmlEntities(input: string): string {
  const keepIfUnsafe = (decoded: string, original: string) =>
    HTML_UNSAFE.has(decoded) ? original : decoded;
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (m, hex: string) =>
      keepIfUnsafe(codePoint(parseInt(hex, 16)), m),
    )
    .replace(/&#(\d+);/g, (m, dec: string) => keepIfUnsafe(codePoint(Number(dec)), m))
    .replace(/&([a-zA-Z]+);/g, (m, name: string) => {
      const decoded = NAMED_ENTITIES[name.toLowerCase()];
      if (decoded === undefined) return m;
      return HTML_UNSAFE.has(decoded) ? m : decoded;
    });
}

function stripEmptyElements(html: string): string {
  const emptyEl = new RegExp(
    `<(${EMPTY_STRIPPABLE})>(?:\\s|<br\\s*/?>|&nbsp;|&#160;)*</\\1>`,
    "gi",
  );
  let out = html;
  let prev: string;
  do {
    prev = out;
    out = out.replace(emptyEl, "");
  } while (out !== prev);
  return out;
}

/** Strip scripts/styles and non-allowlisted tags for catalog descriptions. */
export function sanitizeProjectHtml(html: string): string {
  const filtered = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag: string) => {
      let name = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(name)) return "";
      // The PDP owns its h2 hierarchy — demote any scraped h2 to h3.
      if (name === "h2") name = "h3";
      return match.startsWith("</") ? `</${name}>` : `<${name}>`;
    });

  const normalised = normaliseHtmlEntities(filtered).replace(/\s+/g, " ");
  // Collapse runs of <br> to a single break.
  const collapsedBr = normalised.replace(/(?:<br>\s*){2,}/gi, "<br>");

  // stripEmptyElements also prunes empty headings like `<h3><br></h3>`, so
  // screen-reader heading navigation never lands on blank stops (a11y P7).
  return stripEmptyElements(collapsedBr).trim();
}

/** Collapse HTML + entities down to a single plain-text line. */
export function htmlToPlainText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

export interface PfFaq {
  q: string;
  a: string;
}

// Two scraped FAQ answers append a "PROPERTY FINDER" attribution line
// (e.g. Lillia Townhouses) — drop any sentence that names the source.
const PROPERTY_FINDER_RE = /property\s*finder/i;

/**
 * Leaked AI-generation prompts / chatbot errors that slipped into scraped PF
 * FAQ answers (e.g. "remove fuzzy words", "[project name] =", "Could you
 * clarify"). Any FAQ whose text matches is dropped whole — it is not content.
 */
const AI_LEAK_RE =
  /remove fuzzy words|AI detectability|generate an answer to the question|\[project (?:name|description)\]|might be a code|could you clarify|it seems like the delivery|as an AI|I can generate|I(?:'|’)?m sorry/i;

function dropSentencesMatching(text: string, re: RegExp): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !re.test(sentence))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s.,;:–-]+$/, "")}…`;
}

/** Normalise a scraped FAQ entry to capped, source-free plain text. */
export function sanitizeFaqEntry(entry: PfFaq): PfFaq | null {
  // Drop leaked AI prompts / chatbot errors outright — not real Q&A.
  if (AI_LEAK_RE.test(entry?.q ?? "") || AI_LEAK_RE.test(entry?.a ?? "")) return null;
  const q = truncateText(
    dropSentencesMatching(htmlToPlainText(entry?.q ?? ""), PROPERTY_FINDER_RE),
    200,
  );
  const a = truncateText(
    dropSentencesMatching(htmlToPlainText(entry?.a ?? ""), PROPERTY_FINDER_RE),
    600,
  );
  if (!q || !a) return null;
  return { q, a };
}

export function sanitizePfFaqs(faqs: PfFaq[] | undefined | null): PfFaq[] {
  if (!Array.isArray(faqs)) return [];
  return faqs
    .map(sanitizeFaqEntry)
    .filter((entry): entry is PfFaq => entry !== null);
}
