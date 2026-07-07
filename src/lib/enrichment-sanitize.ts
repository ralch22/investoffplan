const STRIP_RE =
  /property\s*finder|bayut|dubizzle|homes\s*4\s*life|betterhomes|all\s*properties|real\s*estate\s*group|developments\s*international/gi;

export function scrubFact(text: string): string {
  return text.replace(STRIP_RE, "").replace(/\s{2,}/g, " ").trim();
}

export function sanitizeSummary(text: string, maxLen = 500): string | null {
  const clean = scrubFact(text)
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, "")
    .trim();
  if (!clean || clean.length < 40) return null;
  return clean.length > maxLen ? `${clean.slice(0, maxLen - 1)}…` : clean;
}