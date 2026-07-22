"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/locale-provider";
import { submitLead } from "@/lib/leads-client";
import { TurnstileField } from "@/components/turnstile-field";
import { WHATSAPP_PRIMARY } from "@/lib/contact-info";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/cn";
import { AdvisorProjectCard } from "./a2ui/project-card";
import type { A2uiMessage } from "@/lib/advisor/a2ui/messages";
import type {
  AdvisorCard,
  AdvisorMessage,
  AdvisorResponse,
} from "@/lib/advisor/types";

// A2UI renderer is client-only and heavy (renderer + web_core + markdown-it) —
// load it on demand so the site-wide FAB doesn't pay for it until an opted-in
// advisor response actually carries an A2UI surface.
const AdvisorA2uiSurface = dynamic(
  () => import("./a2ui/surface").then((m) => m.AdvisorA2uiSurface),
  { ssr: false },
);

const A2UI_CLIENT_ENABLED = process.env.NEXT_PUBLIC_ADVISOR_A2UI === "1";

interface ChatEntry extends AdvisorMessage {
  cards?: AdvisorCard[];
  showLeadForm?: boolean;
  a2ui?: A2uiMessage[];
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
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadToken, setLeadToken] = useState("");
  const [leadTokenReset, setLeadTokenReset] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-advisor", handleOpen);
    return () => window.removeEventListener("open-advisor", handleOpen);
  }, []);

  // The panel is a framer-motion drawer, not a native <dialog> — restore the
  // keyboard contract showModal used to give us: Escape closes, focus returns
  // to the launcher.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [entries, busy]);

  // Removed dialog modal handling since we are using AnimatePresence instead.
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
          a2uiSupported: A2UI_CLIENT_ENABLED,
        }),
      });
      const data = (await res.json()) as AdvisorResponse & { error?: string };
      if (res.status === 429 && data.error) {
        // Rate-limited: surface the server's "slow down" line as a normal
        // assistant message — a throttled human must not see "advisor broken".
        setEntries((prev) => [...prev, { role: "assistant", content: data.error! }]);
        setSuggestions([]);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "advisor error");
      setEntries((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          cards: data.cards,
          showLeadForm: data.cta === "lead-form" && !leadDone,
          a2ui: data.a2ui,
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

  // Called by the A2UI LeadForm after a successful client-side submit — mirrors
  // sendLead's success path so both rendering modes behave identically.
  function handleA2uiLeadSubmitted() {
    setLeadDone(true);
    setEntries((prev) => [...prev, { role: "assistant", content: t.leadThanks }]);
  }

  // Legacy structured render (project cards + inline lead form). Used directly
  // when a turn has no A2UI surface, and as the A2UI error-boundary fallback.
  const renderLegacyCards = (entry: ChatEntry) =>
    entry.cards?.length ? (
      <div className="mt-3 w-full space-y-2">
        {entry.cards.map((card) => (
          <AdvisorProjectCard key={card.slug} card={card} />
        ))}
      </div>
    ) : null;

  const renderLegacyLeadForm = () => (
    <div className="mt-3 w-full space-y-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-text-dark">{t.leadTitle}</p>
      <input
        value={leadName}
        onChange={(e) => setLeadName(e.target.value)}
        placeholder={t.leadName}
        aria-label={t.leadName}
        autoComplete="name"
        className="iop-input h-11 text-sm"
      />
      <input
        value={leadPhone}
        onChange={(e) => setLeadPhone(e.target.value)}
        placeholder={t.leadPhone}
        aria-label={t.leadPhone}
        autoComplete="tel"
        type="tel"
        className="iop-input h-11 text-sm"
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
        className="iop-btn-press focus-ring w-full rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {leadBusy ? t.leadSending : t.leadSubmit}
      </button>
    </div>
  );

  const renderLegacyStructured = (entry: ChatEntry) => (
    <>
      {renderLegacyCards(entry)}
      {entry.showLeadForm && !leadDone ? renderLegacyLeadForm() : null}
    </>
  );

  return (
    <>
      {/* data-advisor-chrome: hidden via CSS while a *non-advisor* native dialog
          is open (gallery lightbox, etc.) so the FAB never covers gallery
          controls. Bottom offset reads --bottom-dock from PageShell. */}
      <button
        ref={launcherRef}
        type="button"
        data-advisor-chrome
        data-testid="advisor-launcher"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t.close : t.launcher}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="iop-btn-press focus-ring fixed end-5 z-[var(--z-sticky)] flex h-14 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-elevation-lg transition-all duration-300 hover:bg-brand-dark bottom-[calc(var(--bottom-dock)+var(--consent-h,0px)+var(--fab-gap)+var(--compare-bar-clearance,0px))] lg:bottom-[calc(1.25rem+var(--consent-h,0px))]"
      >
        <ChatIcon />
        <span className="hidden sm:inline">{t.launcher}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[var(--z-modal)] bg-black/40 backdrop-blur-sm"
              aria-hidden="true"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              data-testid="advisor-panel"
              data-advisor-panel
              className="fixed inset-0 z-[var(--z-modal)] flex flex-col overflow-hidden bg-surface sm:start-auto sm:w-[500px] lg:w-[600px] sm:rounded-l-3xl shadow-elevation-2xl"
              role="dialog"
              aria-modal="true"
              aria-label={t.title}
            >
              <div className="flex shrink-0 items-center justify-between gap-3 bg-surface-darker px-4 py-4 text-white sm:px-6">
                <div>
                  <p className="font-semibold">{t.title}</p>
                  <p className="text-xs text-white/70">{t.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
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

              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                {entries.length === 0 ? (
                  <div className="space-y-2">
                    {starters.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="iop-btn-press focus-ring block w-full rounded-xl border border-border bg-surface-alt px-4 py-3 text-start text-sm text-text-dark hover:border-brand"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : null}

                {entries.map((entry, i) => (
                  <div key={i} className={cn("flex flex-col", entry.role === "user" ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed overflow-hidden",
                        entry.role === "user"
                          ? "bg-brand text-white"
                          : "bg-surface-alt text-text-dark",
                      )}
                    >
                      {entry.role === "user" ? (
                        <p>{entry.content}</p>
                      ) : (
                        <div className="prose prose-sm prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-a:text-brand max-w-none break-words text-text-dark">
                          <ReactMarkdown>{entry.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {entry.role === "assistant" ? (
                      entry.a2ui?.length ? (
                        <div className="mt-3 w-full">
                          <AdvisorA2uiSurface
                            messages={entry.a2ui}
                            handlers={{
                              leadDone,
                              onLeadSubmitted: handleA2uiLeadSubmitted,
                            }}
                            fallback={renderLegacyStructured(entry)}
                          />
                        </div>
                      ) : (
                        renderLegacyStructured(entry)
                      )
                    ) : null}
                  </div>
                ))}

                {busy ? (
                  <p className="text-xs text-muted" role="status">
                    {t.thinking}
                  </p>
                ) : null}

                {!busy && entries.length > 0 && suggestions.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="focus-ring rounded-full border border-border bg-white px-3 py-1.5 text-xs text-muted hover:border-brand hover:text-brand"
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
                className="flex gap-2 border-t border-border bg-surface p-4"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.placeholder}
                  aria-label={t.placeholder}
                  className="iop-input h-12 flex-1 text-sm"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="iop-btn-press focus-ring rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {t.send}
                </button>
              </form>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
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
