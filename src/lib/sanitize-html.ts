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

/** Strip scripts/styles and non-allowlisted tags for catalog descriptions. */
export function sanitizeProjectHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag: string) => {
      const name = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(name)) return "";
      if (match.startsWith("</")) return `</${name}>`;
      return `<${name}>`;
    })
    // Drop empty headings (e.g. `<h3><br></h3>`) so screen-reader heading
    // navigation doesn't land on blank stops (a11y audit P7).
    .replace(/<(h2|h3)>(?:\s|<br>|&nbsp;|&#160;)*<\/\1>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}