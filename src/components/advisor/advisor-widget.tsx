"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";
import { submitLead } from "@/lib/leads-client";
import { TurnstileField } from "@/components/turnstile-field";
import { WHATSAPP_PRIMARY } from "@/lib/contact-info";
import { bedsLabel, formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import type {
  AdvisorCard,
  AdvisorMessage,
  AdvisorResponse,
} from "@/lib/advisor/types";

interface ChatEntry extends AdvisorMessage {
  cards?: AdvisorCard[];
  showLeadForm?: boolean;
}

export function AdvisorWidget() {
  const { locale, dict } = useI18n();
  const t = dict.advisor;
  const [open, setOpen] = useState(false);
  const scrollDir = useScrollDirection();
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadToken, setLeadToken] = useState("");
  const [leadTokenReset, setLeadTokenReset] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [entries, busy]);

  // Mount the panel only while open so a closed <dialog> never dual-matches
  // gallery/brochure dialogs in a11y tests (strict getByRole('dialog')).
  // showModal on mount = focus trap + Escape + focus restore (residual O1).
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const handleCancel = (e: Event) => {
      e.preventDefault();
      setOpen(false);
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      if (dialog.open) dialog.close();
    };
  }, [open]);

  const starters = [t.starterProjects, t.starterAreas, t.starterProcess];

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const nextEntries: ChatEntry[] = [...entries, { role: "user", content }];
    setEntries(nextEntries);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          messages: nextEntries.map(({ role, content: c }) => ({ role, content: c })),
        }),
      });
      const data = (await res.json()) as AdvisorResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "advisor error");
      setEntries((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          cards: data.cards,
          showLeadForm: data.cta === "lead-form" && !leadDone,
        },
      ]);
      setSuggestions(data.suggestions ?? []);
    } catch {
      setEntries((prev) => [...prev, { role: "assistant", content: t.error }]);
    } finally {
      setBusy(false);
    }
  }

  async function sendLead() {
    if (!leadName.trim() || leadPhone.replace(/\D/g, "").length < 8) {
      setLeadError(t.leadInvalid);
      return;
    }
    setLeadError(null);
    setLeadBusy(true);
    try {
      const result = await submitLead({
        formType: "advisor",
        name: leadName.trim(),
        phone: leadPhone.trim(),
        message: `Advisor callback request. Last question: ${
          entries.filter((e) => e.role === "user").slice(-1)[0]?.content ?? ""
        }`.slice(0, 500),
        honeypot: "",
        turnstileToken: leadToken,
      });
      if (result.ok) {
        setLeadDone(true);
        setEntries((prev) => [...prev, { role: "assistant", content: t.leadThanks }]);
      } else {
        setLeadError(t.leadError);
        // The token was consumed (or stale) — reset the widget so the retry
        // submits a fresh one instead of 403ing forever.
        setLeadToken("");
        setLeadTokenReset((n) => n + 1);
      }
    } catch {
      setLeadError(t.leadError);
      setLeadToken("");
      setLeadTokenReset((n) => n + 1);
    } finally {
      setLeadBusy(false);
    }
  }

  return (
    <>
      {/* data-advisor-chrome: hidden via CSS while a *non-advisor* native dialog
          is open (gallery lightbox, etc.) so the FAB never covers gallery
          controls. Bottom offset reads --bottom-dock from PageShell. */}
      <button
        type="button"
        data-advisor-chrome
        data-testid="advisor-launcher"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t.close : t.launcher}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "iop-btn-press focus-ring fixed end-5 z-[var(--z-sticky)] flex h-14 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-elevation-lg transition-all duration-300 hover:bg-brand-dark bottom-[calc(var(--bottom-dock)+var(--consent-h,0px)+var(--fab-gap))] lg:bottom-[calc(1.25rem+var(--consent-h,0px))]",
          scrollDir === "down" && !open ? "max-lg:translate-y-[calc(100%+var(--fab-gap)+var(--bottom-dock))] max-lg:opacity-0" : "max-lg:translate-y-0 max-lg:opacity-100"
        )}
      >
        <ChatIcon />
        <span className="hidden sm:inline">{t.launcher}</span>
      </button>

      {open ? (
        <dialog
          ref={dialogRef}
          data-advisor-dialog
          data-testid="advisor-panel"
          aria-label={t.title}
          onClose={() => setOpen(false)}
          className="fixed inset-0 z-[var(--z-modal)] m-0 h-full w-full max-w-none bg-transparent p-0 flex flex-col justify-end items-end p-5 backdrop:bg-transparent"
        >
          {/* Inner container for the actual chat panel */}
          <div className="flex w-[min(26rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-elevation-lg mb-[calc(var(--bottom-dock)+var(--consent-h,0px)+3rem)] lg:mb-[calc(6rem+var(--consent-h,0px))] max-h-[min(32rem,calc(100dvh-var(--header-h)-var(--bottom-dock)-var(--consent-h,0px)-var(--fab-gap)-5rem))] lg:max-h-[min(32rem,calc(100dvh-8rem-var(--consent-h,0px)))]">
            <div className="flex shrink-0 items-center justify-between gap-3 bg-surface-darker px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="text-xs text-white/70">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-1">
              <a
                href={`https://wa.me/${WHATSAPP_PRIMARY}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.whatsapp}
                className="focus-ring-light rounded-full border border-white/25 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10"
              >
                {t.whatsapp}
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
                className="focus-ring-light flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
              >
                ✕
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {entries.length === 0 ? (
              <div className="space-y-2">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="iop-btn-press focus-ring block w-full rounded-xl border border-border bg-surface-alt px-4 py-2.5 text-start text-sm text-text-dark hover:border-brand"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}

            {entries.map((entry, i) => (
              <div key={i}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    entry.role === "user"
                      ? "ms-auto bg-brand text-white"
                      : "bg-surface-alt text-text-dark",
                  )}
                >
                  {entry.content}
                </div>
                {entry.cards?.length ? (
                  <div className="mt-2 space-y-2">
                    {entry.cards.map((card) => (
                      <AdvisorCardView key={card.slug} card={card} />
                    ))}
                  </div>
                ) : null}
                {entry.showLeadForm && !leadDone ? (
                  <div className="mt-2 space-y-2 rounded-2xl border border-border bg-white p-3">
                    <p className="text-xs font-semibold text-text-dark">{t.leadTitle}</p>
                    <input
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder={t.leadName}
                      aria-label={t.leadName}
                      autoComplete="name"
                      className="iop-input h-10 text-sm"
                    />
                    <input
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder={t.leadPhone}
                      aria-label={t.leadPhone}
                      autoComplete="tel"
                      type="tel"
                      className="iop-input h-10 text-sm"
                    />
                    <TurnstileField
                      onToken={setLeadToken}
                      action="advisor-callback"
                      resetSignal={leadTokenReset}
                    />
                    {leadError ? (
                      <p className="text-xs font-medium text-brand" role="alert">
                        {leadError}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={sendLead}
                      disabled={leadBusy}
                      className="iop-btn-press focus-ring w-full rounded-full bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
                    >
                      {leadBusy ? t.leadSending : t.leadSubmit}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}

            {busy ? (
              <p className="text-xs text-muted" role="status">
                {t.thinking}
              </p>
            ) : null}

            {!busy && entries.length > 0 && suggestions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="focus-ring rounded-full border border-border bg-white px-3 py-1 text-xs text-muted hover:border-brand hover:text-brand"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              className="iop-input h-11 flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="iop-btn-press focus-ring rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {t.send}
            </button>
          </form>
          </div>
        </dialog>
      ) : null}
    </>
  );
}

function AdvisorCardView({ card }: { card: AdvisorCard }) {
  const { locale, dict } = useI18n();
  const t = dict.advisor;
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-white p-3">
      {card.imageUrl ? (
        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-alt">
          <Image src={card.imageUrl} alt="" fill className="object-cover" sizes="80px" />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-dark">{card.name}</p>
        <p className="truncate text-xs text-muted">
          {card.developer} · {card.area}
        </p>
        <p className="text-xs text-muted">
          {card.fromPriceAed
            ? `${t.from} ${formatPrice(card.fromPriceAed, "AED")}`
            : ""}
          {card.handover ? ` · ${card.handover}` : ""}
          {card.beds?.length
            ? ` · ${card.beds.map((n) => bedsLabel(n, dict)).join("–")}`
            : ""}
        </p>
        <Link
          href={localePath(locale, `/projects/${card.slug}`)}
          className="focus-ring mt-1 inline-block rounded-sm text-xs font-semibold text-brand hover:text-brand-dark"
        >
          {t.viewProject} →
        </Link>
      </div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden>
      <path
        d="M3 6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-4 3v-3H6a3 3 0 0 1-3-3V6Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
