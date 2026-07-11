"use client";

import { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AccountSavedSearches } from "@/components/account-saved-searches";
import { SignInModal } from "@/components/auth/sign-in-modal";
import { PrimaryButton } from "@/components/ui/primary-button";
import { signOut, useSession } from "@/lib/auth/client";
import { useFavoritesCount } from "@/hooks/use-favorites-count";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate, localePath } from "@/i18n/config";

interface AccountPageProps {
  /** Top covered communities with printable market reports (build-time data). */
  reportLinks?: { slug: string; name: string }[];
}

// Client shell: the page HTML is static (ISR discipline) — the session is
// resolved exclusively in the browser via useSession. Never read cookies or
// headers server-side for this page.
export function AccountPage({ reportLinks = [] }: AccountPageProps) {
  const { locale, dict } = useI18n();
  const { data: session, isPending } = useSession();
  const [modalOpen, setModalOpen] = useState(false);
  // localStorage is the read path; the sync hook (mounted in PageShell) keeps
  // it merged with the server after sign-in.
  const favoritesCount = useFavoritesCount();

  return (
    <PageShell>
      <main className="mx-auto max-w-[800px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: dict.auth.accountTitle }]}
        />
        <h1 className="mt-6 font-display text-3xl font-semibold text-text-dark md:text-4xl">
          {dict.auth.accountTitle}
        </h1>
        <p className="mt-2 text-sm text-muted">{dict.auth.accountSubtitle}</p>

        {isPending ? (
          <div className="mt-8 rounded-2xl border border-border bg-surface-alt p-10 text-center text-sm text-muted">
            {dict.auth.loading}
          </div>
        ) : !session?.user ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-alt p-10 text-center">
            <p className="text-lg font-medium text-text-dark">{dict.auth.notSignedIn}</p>
            <PrimaryButton
              onClick={() => setModalOpen(true)}
              className="mt-6"
              showArrow={false}
            >
              {dict.auth.signIn}
            </PrimaryButton>
            <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} />
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <section className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-light">
                {dict.auth.profile}
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted">{dict.auth.nameLabel}</dt>
                  <dd className="font-medium text-text-dark">{session.user.name || "—"}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted">{dict.auth.emailLabel}</dt>
                  <dd className="font-medium text-text-dark">{session.user.email}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => void signOut()}
                className="iop-btn-press focus-ring mt-6 rounded-full border border-border px-5 py-2 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand"
              >
                {dict.auth.signOut}
              </button>
            </section>

            <div id="saved-searches" className="scroll-mt-24">
              <AccountSavedSearches />
            </div>
            <section className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-light">
                {dict.auth.favoritesSection}
              </h2>
              <div className="mt-4 flex items-baseline justify-between gap-4 text-sm">
                <p className="font-medium text-text-dark">
                  {interpolate(dict.auth.favoritesCount, { count: favoritesCount })}
                </p>
                <Link
                  href={localePath(locale, "/favorites")}
                  className="focus-ring font-semibold text-brand transition hover:underline"
                >
                  {dict.auth.viewFavorites}
                </Link>
              </div>
              <p className="mt-2 text-sm text-muted">{dict.auth.favoritesSynced}</p>
            </section>

            {reportLinks.length > 0 ? (
              <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-light">
                  {dict.reports.marketReports}
                </h2>
                <p className="mt-3 text-sm text-muted">{dict.reports.marketReportsHint}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {reportLinks.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/reports/market/${r.slug}`}
                      className="iop-btn-press focus-ring rounded-full border border-border px-4 py-1.5 text-sm font-medium text-text-dark transition hover:border-brand hover:text-brand"
                    >
                      {r.name}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </PageShell>
  );
}
