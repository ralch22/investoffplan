import { PageShell } from "@/components/page-shell";
import { NotFoundChrome } from "@/components/not-found-chrome";

/**
 * Root not-found — keep this a **sync** Server Component without `headers()`.
 * Using `headers()` here has been observed to soft-200 some App Router 404s
 * (see content.spec unknown-slug EN 404s). Locale chrome is a client child via
 * useI18n (EN default; AR under LocaleProvider).
 */
export default function NotFound() {
  return (
    <PageShell>
      <NotFoundChrome />
    </PageShell>
  );
}
