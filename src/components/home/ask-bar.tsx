"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useI18n } from "@/i18n/locale-provider";
import { AdvisorProjectCard } from "@/components/advisor/a2ui/project-card";
import type { AdvisorCard, AdvisorResponse } from "@/lib/advisor/types";
import type { A2uiMessage } from "@/lib/advisor/a2ui/messages";

// Same reasoning as the widget: the A2UI renderer is heavy and client-only, so
// it is only fetched once an answer actually carries a surface.
const PageA2uiSurface = dynamic(
  () => import("@/components/advisor/a2ui/page-surface").then((m) => m.PageA2uiSurface),
  { ssr: false },
);

const A2UI_CLIENT_ENABLED = process.env.NEXT_PUBLIC_ADVISOR_A2UI === "1";

/**
 * Ask a question on the home page and get the answer IN the page.
 *
 * The advisor already answers well; what it lacked was reach — it lived behind
 * a floating button, so only people who chose to open a chat drawer ever saw
 * it. This puts the same grounded answer inline, under the hero, where the
 * intent already is.
 *
 * It spends the advisor's existing daily budget (no new spend class), and the
 * server's protections apply unchanged: per-IP limits and the site-wide cap
 * both return friendly 200-shaped copy, which is rendered here as the answer
 * rather than as an error.
 */
function AskBarInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { locale, dict } = useI18n();
  const t = dict.advisor;

  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [cards, setCards] = useState<AdvisorCard[]>([]);
  const [a2ui, setA2ui] = useState<A2uiMessage[] | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const answerRef = useRef<HTMLDivElement>(null);
  // Guards the ?ask= autofire so a re-render (or our own URL write) can't
  // re-spend budget on the same question.
  const fired = useRef<string | null>(null);

  const ask = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      setBusy(true);
      setReply(null);
      setCards([]);
      setA2ui(undefined);
      setSuggestions([]);
      try {
        const res = await fetch("/api/advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            messages: [{ role: "user", content }],
            a2uiSupported: A2UI_CLIENT_ENABLED,
          }),
        });
        const data = (await res.json()) as AdvisorResponse & { error?: string };
        // 429 and "daily capacity reached" both arrive as human sentences from
        // the server. They are answers, not failures — show them as such.
        if (!res.ok) {
          setReply(data.error ?? t.error);
          return;
        }
        setReply(data.reply);
        setCards(data.cards ?? []);
        setA2ui(data.a2ui);
        setSuggestions(data.suggestions ?? []);
      } catch {
        setReply(t.error);
      } finally {
        setBusy(false);
      }
    },
    [busy, locale, t.error],
  );

  // Deep link: /?ask=<question> makes any answer shareable and linkable.
  useEffect(() => {
    const q = params.get("ask");
    if (!q || fired.current === q) return;
    fired.current = q;
    setQuery(q);
    void ask(q);
  }, [params, ask]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    fired.current = q; // our own URL write must not re-trigger the effect
    router.replace(`?ask=${encodeURIComponent(q)}`, { scroll: false });
    void ask(q);
    answerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const hasAnswer = Boolean(reply) || busy;

  return (
    <section className="border-b border-border bg-surface-alt">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-8 md:px-8 md:py-10">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="home-ask" className="sr-only">
            {t.askLabel}
          </label>
          <input
            id="home-ask"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.askPlaceholder}
            className="iop-input h-12 flex-1 text-sm"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={busy || !query.trim()}
            className="iop-btn-press focus-ring h-12 shrink-0 rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? t.thinking : t.askSubmit}
          </button>
        </form>

        {hasAnswer ? (
          <div ref={answerRef} className="mt-6">
            {busy ? (
              <p className="text-sm text-muted" role="status">
                {t.thinking}
              </p>
            ) : null}

            {reply ? (
              <div className="prose prose-sm prose-p:my-1 prose-a:text-brand max-w-none break-words text-text-dark">
                <ReactMarkdown>{reply}</ReactMarkdown>
              </div>
            ) : null}

            {a2ui?.length ? (
              <div className="mt-4 max-w-2xl">
                <PageA2uiSurface
                  messages={a2ui}
                  fallback={
                    <div className="space-y-2">
                      {cards.map((card) => (
                        <AdvisorProjectCard key={card.slug} card={card} />
                      ))}
                    </div>
                  }
                />
              </div>
            ) : cards.length ? (
              <div className="mt-4 max-w-2xl space-y-2">
                {cards.map((card) => (
                  <AdvisorProjectCard key={card.slug} card={card} />
                ))}
              </div>
            ) : null}

            {suggestions.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setQuery(s);
                      fired.current = s;
                      router.replace(`?ask=${encodeURIComponent(s)}`, { scroll: false });
                      void ask(s);
                    }}
                    className="iop-btn-press focus-ring rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-dark transition hover:border-brand hover:text-brand"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** useSearchParams needs a Suspense boundary to keep the page statically shell-rendered. */
export function HomeAskBar() {
  return (
    <Suspense fallback={null}>
      <AskBarInner />
    </Suspense>
  );
}
