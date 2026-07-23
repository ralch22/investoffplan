"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocaleLink } from "@/components/locale-link";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate } from "@/i18n/config";
import { fetchCatalogApi } from "@/lib/catalog-browser";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { cityLabel, formatPrice } from "@/lib/format";
import {
  ANSWERS_PARAM,
  decodeAnswers,
  encodeAnswers,
  matchInvestments,
  QUIZ_OPTIONS,
  QUIZ_STEPS,
  type MatchReason,
  type ProjectMatch,
  type QuizAnswers,
  type QuizStepKey,
  type YieldCommunity,
} from "@/lib/investor-match";
import { composeMatchNextStep } from "@/lib/advisor/a2ui/page-composers";
import { surfaceEnabled } from "@/lib/advisor/a2ui/surfaces";
import { PageA2uiSurface } from "@/components/advisor/a2ui/page-surface";

type PartialAnswers = Partial<QuizAnswers>;

// Lazy, deduped fetch of the sanitized DLD yield table — only pulled when the
// income goal actually needs it (keeps dld-area-stats out of the client bundle).
let yieldPromise: Promise<YieldCommunity[]> | null = null;
function fetchYieldCommunities(): Promise<YieldCommunity[]> {
  if (!yieldPromise) {
    yieldPromise = fetch("/data/yield-communities.json")
      .then((r) => (r.ok ? (r.json() as Promise<YieldCommunity[]>) : []))
      .catch(() => []);
  }
  return yieldPromise;
}

function isComplete(a: PartialAnswers): a is QuizAnswers {
  return QUIZ_STEPS.every((step) => a[step] != null);
}

export function InvestorMatchQuiz() {
  const { dict, locale } = useI18n();
  const t = dict.tools.investorMatch;

  const [phase, setPhase] = useState<"quiz" | "results">("quiz");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PartialAnswers>({});
  const [matches, setMatches] = useState<ProjectMatch[] | null>(null);
  const [computing, setComputing] = useState(false);
  const [copied, setCopied] = useState(false);

  const startedRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const computeMatches = useCallback(async (final: QuizAnswers) => {
    setComputing(true);
    try {
      const api = await fetchCatalogApi();
      const units = api.flattenCatalogUnits();
      const yieldCommunities =
        final.goal === "income" ? await fetchYieldCommunities() : undefined;
      const result = matchInvestments(units, final, { yieldCommunities });
      setMatches(result);
      trackEvent(ANALYTICS_EVENTS.QUIZ_COMPLETE, {
        goal: final.goal,
        budget: final.budget,
      });
    } catch {
      setMatches([]);
    } finally {
      setComputing(false);
    }
  }, []);

  // Deep-link: if the URL already carries complete answers, jump to results.
  // Runs post-mount (never during SSR/first paint) so the server-rendered quiz
  // and the client hydrate identically before we swap to the results view.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get(ANSWERS_PARAM);
    const decoded = decodeAnswers(raw);
    if (!decoded) return;
    void (async () => {
      setAnswers(decoded);
      setPhase("results");
      await computeMatches(decoded);
    })();
  }, [computeMatches]);

  // Move focus to the step / results heading on transitions (a11y).
  useEffect(() => {
    headingRef.current?.focus();
  }, [step, phase]);

  const stepKey = QUIZ_STEPS[step] as QuizStepKey;
  const currentValue = answers[stepKey];
  const isLastStep = step === QUIZ_STEPS.length - 1;

  function selectOption(value: string) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent(ANALYTICS_EVENTS.QUIZ_START);
    }
    setAnswers((prev) => ({ ...prev, [stepKey]: value }));
  }

  function goToResults(final: QuizAnswers) {
    const url = new URL(window.location.href);
    url.searchParams.set(ANSWERS_PARAM, encodeAnswers(final));
    window.history.replaceState(null, "", url.toString());
    setPhase("results");
    void computeMatches(final);
  }

  function handleNext() {
    if (!currentValue) return;
    if (isLastStep) {
      const next = { ...answers, [stepKey]: currentValue };
      if (isComplete(next)) goToResults(next);
      return;
    }
    setStep((s) => Math.min(s + 1, QUIZ_STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function refine() {
    setPhase("quiz");
    setStep(0);
  }

  function startOver() {
    const url = new URL(window.location.href);
    url.searchParams.delete(ANSWERS_PARAM);
    window.history.replaceState(null, "", url.toString());
    setAnswers({});
    setMatches(null);
    setStep(0);
    setPhase("quiz");
    startedRef.current = false;
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  if (phase === "results") {
    return (
      <ResultsView
        t={t}
        dict={dict}
        locale={locale}
        matches={matches}
        computing={computing}
        copied={copied}
        headingRef={headingRef}
        onShare={share}
        onRefine={refine}
        onStartOver={startOver}
      />
    );
  }

  const progressPct = Math.round(((step + 1) / QUIZ_STEPS.length) * 100);
  const optionValues = QUIZ_OPTIONS[stepKey] as readonly string[];
  const stepCopy = t.steps[stepKey];
  const optionLabels = t.options[stepKey] as Record<string, string>;
  const goalHints: Record<string, string> | null =
    stepKey === "goal" ? { ...t.optionHint.goal } : null;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
          <span>{interpolate(t.stepLabel, { current: step + 1, total: QUIZ_STEPS.length })}</span>
          <span>{progressPct}%</span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt"
          role="progressbar"
          aria-label={t.progressAria}
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <fieldset>
        <legend className="w-full">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-2xl font-semibold text-text-dark outline-none md:text-3xl"
          >
            {stepCopy.title}
          </h2>
          <p className="mt-2 text-sm text-muted">{stepCopy.help}</p>
        </legend>

        <div className="mt-6 grid gap-3">
          {optionValues.map((value) => {
            const selected = currentValue === value;
            return (
              <label
                key={value}
                className={[
                  "iop-btn-press flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
                  "focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-1",
                  selected
                    ? "border-brand bg-brand-muted"
                    : "border-border bg-white hover:border-brand/60",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name={stepKey}
                  value={value}
                  checked={selected}
                  onChange={() => selectOption(value)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={[
                    "mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 transition",
                    selected ? "border-brand" : "border-border",
                  ].join(" ")}
                >
                  {selected ? <span className="h-2.5 w-2.5 rounded-full bg-brand" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-text-dark">
                    {optionLabels[value]}
                  </span>
                  {goalHints?.[value] ? (
                    <span className="mt-0.5 block text-xs text-muted">
                      {goalHints[value]}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="iop-btn-press rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-text-dark transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t.back}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!currentValue}
          className="iop-btn-press rounded-full bg-brand px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLastStep ? t.seeMatches : t.next}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

type InvestorMatchDict = ReturnType<typeof useI18n>["dict"]["tools"]["investorMatch"];
type AppDict = ReturnType<typeof useI18n>["dict"];

function bedsLabel(beds: number, t: InvestorMatchDict): string {
  if (beds <= 0) return t.options.beds.studio;
  if (beds === 1) return t.options.beds["1"];
  if (beds === 2) return t.options.beds["2"];
  return t.options.beds["3-plus"];
}

function renderReason(
  reason: MatchReason,
  t: InvestorMatchDict,
  dict: AppDict,
): string {
  const template = t.reasons[reason.code];
  const values: Record<string, string | number> = { ...(reason.values ?? {}) };
  for (const numKey of ["price", "median", "ppsf"]) {
    if (typeof values[numKey] === "number") {
      values[numKey] = (values[numKey] as number).toLocaleString("en-US");
    }
  }
  if (reason.code === "bedsMatch" && typeof values.beds === "number") {
    values.beds = bedsLabel(values.beds, t);
  }
  if (reason.code === "location" && typeof values.city === "string") {
    values.city = cityLabel(values.city, dict);
  }
  return interpolate(template, values);
}

interface ResultsViewProps {
  t: InvestorMatchDict;
  dict: AppDict;
  locale: string;
  matches: ProjectMatch[] | null;
  computing: boolean;
  copied: boolean;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onShare: () => void;
  onRefine: () => void;
  onStartOver: () => void;
}

function ResultsView({
  t,
  dict,
  matches,
  computing,
  copied,
  headingRef,
  onShare,
  onRefine,
  onStartOver,
}: ResultsViewProps) {
  const list = matches ?? [];
  const nextStep = surfaceEnabled("match")
    ? composeMatchNextStep(list[0] ? { fromPriceAed: list[0].fromPriceAed } : undefined)
    : undefined;
  const loaded = !computing && matches != null;
  const hasMatches = loaded && list.length > 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-2xl font-semibold text-text-dark outline-none md:text-3xl"
          >
            {t.results.title}
          </h2>
          {hasMatches ? (
            <p className="mt-1 text-sm text-muted">
              {interpolate(t.results.count, { count: list.length })}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onShare}
            className="iop-btn-press rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-dark transition hover:border-brand"
          >
            {copied ? t.results.shareCopied : t.results.share}
          </button>
          <button
            type="button"
            onClick={onRefine}
            className="iop-btn-press rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-dark transition hover:border-brand"
          >
            {t.refine}
          </button>
        </div>
      </div>

      {computing ? (
        <p className="mt-10 text-center text-sm text-muted">{t.loading}</p>
      ) : null}

      {loaded && !hasMatches ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-alt p-10 text-center">
          <p className="text-lg font-medium text-text-dark">{t.results.empty.title}</p>
          <p className="mt-2 text-sm text-muted">{t.results.empty.body}</p>
          <button
            type="button"
            onClick={onRefine}
            className="iop-btn-press mt-6 rounded-full border border-brand px-6 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            {t.results.empty.cta}
          </button>
        </div>
      ) : null}

      {hasMatches ? (
        <>
          <ol className="mt-8 grid gap-5">
            {list.map((match) => (
              <li
                key={match.project.id}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-brand/60 hover:shadow-md md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-text-dark">
                      {match.project.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {[match.project.area, cityLabel(match.project.city, dict)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-muted px-3 py-1 text-xs font-semibold text-brand">
                    {interpolate(t.results.matchScore, { score: match.score })}
                  </span>
                </div>

                <p className="mt-3 text-sm font-semibold text-text-dark">
                  {interpolate(t.results.fromPrice, {
                    price: formatPrice(match.fromPriceAed, "AED", { compact: true }),
                  })}
                </p>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {t.results.whyTitle}
                  </p>
                  <ul className="mt-2 grid gap-1.5">
                    {match.reasons.map((reason, i) => (
                      <li
                        key={`${reason.code}-${i}`}
                        className="flex items-start gap-2 text-sm text-text-dark"
                      >
                        <span aria-hidden className="mt-0.5 flex-none text-brand">
                          ✓
                        </span>
                        <span>{renderReason(reason, t, dict)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5">
                  <LocaleLink
                    href={`/projects/${match.project.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                  >
                    {t.results.viewProject}
                    <span aria-hidden className="rtl:-scale-x-100">
                      →
                    </span>
                  </LocaleLink>
                </div>
              </li>
            ))}
          </ol>

          {nextStep ? (
            // Deterministic A2UI: the numbers on the top match + a way to reach
            // the team. Deliberately no project cards — the ranked list above
            // already has them.
            <div className="mt-8">
              <PageA2uiSurface messages={nextStep} />
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LocaleLink
              href="/projects"
              className="iop-btn-press rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-text-dark transition hover:border-brand"
            >
              {t.results.browseAll}
            </LocaleLink>
            <button
              type="button"
              onClick={onStartOver}
              className="iop-btn-press rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-text-dark transition hover:border-brand"
            >
              {t.restart}
            </button>
          </div>

          <p className="mt-8 text-xs leading-relaxed text-muted">
            {t.results.disclaimer}
          </p>
        </>
      ) : null}
    </div>
  );
}
