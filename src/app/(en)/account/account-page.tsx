"use client";

import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SignInModal } from "@/components/auth/sign-in-modal";
import { PrimaryButton } from "@/components/ui/primary-button";
import { signOut, useSession } from "@/lib/auth/client";
import { useI18n } from "@/i18n/locale-provider";

// Client shell: the page HTML is static (ISR discipline) — the session is
// resolved exclusively in the browser via useSession. Never read cookies or
// headers server-side for this page.
export function AccountPage() {
  const { dict } = useI18n();
  const { data: session, isPending } = useSession();
  const [modalOpen, setModalOpen] = useState(false);

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

            {/* Wave 4 placeholders — saved searches + synced favorites. */}
            <section className="rounded-2xl border border-dashed border-border bg-surface-alt p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-light">
                {dict.auth.savedSearches}
              </h2>
              <p className="mt-3 text-sm text-muted">{dict.auth.comingSoon}</p>
            </section>
            <section className="rounded-2xl border border-dashed border-border bg-surface-alt p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-light">
                {dict.auth.favoritesSection}
              </h2>
              <p className="mt-3 text-sm text-muted">{dict.auth.comingSoon}</p>
            </section>
          </div>
        )}
      </main>
    </PageShell>
  );
}
