"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";
import { submitLead } from "@/lib/leads-client";
import { WHATSAPP_PRIMARY } from "@/lib/contact-info";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
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
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [entries, busy]);

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
    if (!leadName.trim() || leadPhone.replace(/\D/g, "").length < 8) return;
    const result = await submitLead({
      formType: "advisor",
      name: leadName.trim(),
      phone: leadPhone.trim(),
      message: `Advisor callback request. Last question: ${
        entries.filter((e) => e.role === "user").slice(-1)[0]?.content ?? ""
      }`.slice(0, 500),
      honeypot: "",
      turnstileToken: "",
    });
    if (result.ok) {
      setLeadDone(true);
      setEntries((prev) => [...prev, { role: "assistant", content: t.leadThanks }]);
    }
  }

  return (
    <>
      {/* Launcher (absorbs the WhatsApp FAB — WhatsApp lives inside the widget) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t.close : t.launcher}
        aria-expanded={open}
        className="iop-btn-press focus-ring fixed bottom-5 end-5 z-[var(--z-sticky)] flex h-14 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-elevation-lg transition hover:bg-brand-dark max-md:bottom-20"
      >
        <ChatIcon />
        <span className="hidden sm:inline">{t.launcher}</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t.title}
          className="fixed bottom-24 end-5 z-[var(--z-modal)] flex max-h-[calc(100dvh-8rem)] w-[min(26rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-elevation-lg max-md:bottom-36"
        >
          <div className="flex items-center justify-between gap-3 bg-surface-darker px-4 py-3 text-white">
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
                className="focus-ring rounded-full border border-white/25 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10"
              >
                {t.whatsapp}
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
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
                    <button
                      type="button"
                      onClick={sendLead}
                      className="iop-btn-press focus-ring w-full rounded-full bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                      {t.leadSubmit}
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
          {card.bedsLabel ? ` · ${card.bedsLabel}` : ""}
        </p>
        <Link
          href={localePath(locale, `/projects/${card.slug}`)}
          className="mt-1 inline-block text-xs font-semibold text-brand hover:text-brand-dark"
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
