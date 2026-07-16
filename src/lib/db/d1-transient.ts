/**
 * Transient-failure retry for remote D1 round-trips.
 *
 * Exists because of ingest run 29470437050: 17 minutes into the weekly
 * upsert, one edge hop answered "502 Bad Gateway" as an HTML page, the D1
 * client surfaced it as "D1_ERROR: Failed to parse body as JSON, got:
 * <html>…", and the whole pipeline died unresumable. Every statement the
 * upsert runs is an idempotent UPSERT or DELETE, so blind retry is safe by
 * construction — the only thing lost to a retry is time.
 *
 * Deliberately narrow: SQL-level errors ("no such table", constraint
 * violations, D1_TYPE_ERROR) are bugs and must throw immediately — retrying
 * them would turn a loud failure into five slow copies of it.
 */

const TRANSIENT_PATTERN =
  /\b(502|503|504|429)\b|bad gateway|service unavailable|gateway time-?out|too many requests|failed to parse body as json|network connection lost|fetch failed|econnreset|etimedout|socket hang up|internal error/i;

/** Walk err + its cause chain and collect every message. */
function messageChain(err: unknown): string {
  const parts: string[] = [];
  let current: unknown = err;
  for (let depth = 0; depth < 6 && current; depth++) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(" | ");
}

export function isTransientD1Error(err: unknown): boolean {
  return TRANSIENT_PATTERN.test(messageChain(err));
}

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
}

/**
 * Run fn, retrying only transient failures with exponential backoff
 * (base, 2x, 4x, 8x…). Non-transient errors rethrow immediately.
 */
export async function withTransientRetry<T>(
  label: string,
  fn: () => Promise<T>,
  { attempts = 5, baseDelayMs = 1000 }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isTransientD1Error(err)) throw err;
      lastError = err;
      if (attempt === attempts) break;
      const delay = baseDelayMs * 2 ** (attempt - 1);
      console.warn(
        `[db:upsert] ${label}: transient D1 error (attempt ${attempt}/${attempts}), retrying in ${delay}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
