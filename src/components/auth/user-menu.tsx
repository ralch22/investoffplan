"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SignInModal } from "@/components/auth/sign-in-modal";
import {
  subscribeSignInModal,
  type GateContext,
} from "@/components/auth/sign-in-modal-bus";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { signOut, useSession } from "@/lib/auth/client";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";

const SIGN_IN_TRACKED_KEY = "iop-sign-in-tracked";

interface UserMenuProps {
  solid: boolean;
}

export function UserMenu({ solid }: UserMenuProps) {
  const { locale, dict } = useI18n();
  const { data: session, isPending } = useSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [gateContext, setGateContext] = useState<GateContext | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Freemium gates (compare cap, PDF export, deep analytics, …) open this
  // modal programmatically via the sign-in bus, with contextual copy.
  useEffect(() => {
    return subscribeSignInModal((detail) => {
      setGateContext(detail.context ?? null);
      setModalOpen(true);
    });
  }, []);

  // Fire sign_in once per session token — covers both the Google redirect
  // return and the magic-link landing, where no in-page submit handler runs.
  useEffect(() => {
    if (!session?.session?.token) return;
    try {
      const marker = `${SIGN_IN_TRACKED_KEY}:${session.session.token.slice(0, 16)}`;
      if (sessionStorage.getItem(marker)) return;
      sessionStorage.setItem(marker, "1");
      trackEvent(ANALYTICS_EVENTS.SIGN_IN);
    } catch {
      // sessionStorage unavailable (private mode) — skip tracking, never break UI.
    }
  }, [session?.session?.token]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  // Static-safe: useSession resolves client-side only, so the server-rendered
  // HTML always shows the signed-out button (pages stay ISR/static).
  if (!session?.user) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            setGateContext(null);
            setModalOpen(true);
          }}
          disabled={isPending}
          className={cn(
            "iop-btn-press focus-ring rounded-full border px-3 py-2 text-xs font-semibold transition",
            !solid
              ? "border-white/30 text-white/90 hover:border-white hover:bg-white/10"
              : "border-border text-muted hover:border-brand hover:text-brand",
          )}
        >
          {dict.auth.signIn}
        </button>
        <SignInModal
          open={modalOpen}
          context={gateContext}
          onClose={() => {
            setModalOpen(false);
            setGateContext(null);
          }}
        />
      </>
    );
  }

  const initial = (session.user.name || session.user.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={dict.auth.menuAria}
        className={cn(
          "iop-btn-press focus-ring flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition",
          !solid
            ? "border-white/30 bg-white/10 text-white hover:border-white"
            : "border-border bg-brand-muted text-brand-dark hover:border-brand",
        )}
      >
        {initial}
      </button>
      {menuOpen ? (
        <div
          role="menu"
          className="absolute end-0 top-12 z-[var(--z-overlay)] w-56 rounded-xl border border-border bg-surface p-2 shadow-elevation-lg"
        >
          <p className="truncate px-3 pb-2 pt-1 text-xs text-muted" title={session.user.email}>
            {dict.auth.signedInAs} {session.user.email}
          </p>
          <Link
            href={localePath(locale, "/account")}
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="focus-ring block rounded-lg px-3 py-2 text-sm font-medium text-text-dark hover:bg-surface-alt"
          >
            {dict.auth.account}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              void signOut();
            }}
            className="focus-ring block w-full rounded-lg px-3 py-2 text-start text-sm font-medium text-muted hover:bg-surface-alt hover:text-text-dark"
          >
            {dict.auth.signOut}
          </button>
        </div>
      ) : null}
    </div>
  );
}
