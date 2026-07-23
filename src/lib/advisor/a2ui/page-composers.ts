/**
 * Deterministic A2UI composers for page surfaces — no LLM involved.
 *
 * Phase 1 proved the composer is ordinary TypeScript: the model was only ever
 * the thing that *chose* which grounded data to show. Where a page already
 * knows the intent — which project you're looking at, which quiz answers you
 * gave, which search returned nothing — we can compose the same agent-grade
 * surface directly, at zero model cost and zero latency.
 *
 * Same invariants as the chat composer: only grounded input is read, values are
 * emitted raw for the client to localise, and `undefined` means "nothing worth
 * rendering" so the page keeps its existing UI.
 */
import type { Project } from "@/lib/types";
import type { AdvisorCard } from "../types";
import { projectToCard } from "../project-card";
import {
  IOP_A2UI,
  createSurface,
  updateComponents,
  type A2uiComponent,
  type A2uiMessage,
} from "./messages";

/** Standard UAE illustrative mortgage assumptions (mirrors mortgage_estimate). */
const DEFAULT_RATE_PCT = 4.25;
const DEFAULT_DOWN_PCT = 20;
const DEFAULT_TERM_YEARS = 25;

function cardProps(card: AdvisorCard): Record<string, unknown> {
  const out: Record<string, unknown> = {
    slug: card.slug,
    name: card.name,
    developer: card.developer,
    area: card.area,
  };
  if (card.imageUrl) out.imageUrl = card.imageUrl;
  if (typeof card.fromPriceAed === "number") out.fromPriceAed = card.fromPriceAed;
  if (card.handover) out.handover = card.handover;
  if (card.beds?.length) out.beds = card.beds;
  if (card.paymentPlan) out.paymentPlan = card.paymentPlan;
  return out;
}

function mortgageNode(id: string, priceAed: number): A2uiComponent {
  return {
    id,
    component: IOP_A2UI.MortgagePanel,
    propertyPriceAed: priceAed,
    downPaymentPct: DEFAULT_DOWN_PCT,
    annualRatePct: DEFAULT_RATE_PCT,
    termYears: DEFAULT_TERM_YEARS,
  };
}

function wrap(surfaceId: string, children: string[], components: A2uiComponent[]) {
  return [
    createSurface(surfaceId),
    updateComponents(surfaceId, [
      { id: "root", component: IOP_A2UI.Stack, children },
      ...components,
    ]),
  ];
}

// ── A1 · PDP decision strip ─────────────────────────────────────────────────

/**
 * The project page already knows the price and its genuinely-related
 * neighbours, so it can offer the two things a buyer does next — run the
 * numbers, and compare against the obvious alternative — without a chat turn.
 */
export function composePdpStrip(
  project: Project,
  related: Project[],
  opts: { surfaceId?: string } = {},
): A2uiMessage[] | undefined {
  const card = projectToCard(project);
  const price = card.fromPriceAed;
  // Without a price there is no mortgage and no meaningful comparison row.
  if (typeof price !== "number" || price <= 0) return undefined;

  const surfaceId = opts.surfaceId ?? `pdp-${project.slug}`;
  const components: A2uiComponent[] = [];
  const children: string[] = [];

  components.push(mortgageNode("mortgage", price));
  children.push("mortgage");

  const peer = related.find((p) => {
    const c = projectToCard(p);
    return typeof c.fromPriceAed === "number" && c.fromPriceAed > 0;
  });
  if (peer) {
    components.push({
      id: "cmp",
      component: IOP_A2UI.CompareTable,
      projects: [cardProps(card), cardProps(projectToCard(peer))],
    });
    children.push("cmp");
  }

  components.push({ id: "lead", component: IOP_A2UI.LeadForm, lastQuestion: project.name });
  children.push("lead");

  return wrap(surfaceId, children, components);
}

// ── A2 · Investor-match next step ───────────────────────────────────────────

export interface MatchTopEntry {
  /** The best-scoring match; only its price is needed here. */
  fromPriceAed: number;
}

/**
 * The quiz already renders its own ranked list with per-match reasons, so this
 * surface deliberately does NOT repeat the projects — duplicating them would
 * just look broken. What the results step lacks is the obvious next step: run
 * the numbers on your best match, and reach a human. That is all this composes.
 */
export function composeMatchNextStep(
  top: MatchTopEntry | undefined,
  opts: { surfaceId?: string } = {},
): A2uiMessage[] | undefined {
  if (!top || !(top.fromPriceAed > 0)) return undefined;

  const surfaceId = opts.surfaceId ?? "match-next";
  return wrap(
    surfaceId,
    ["mortgage", "lead"],
    [mortgageNode("mortgage", top.fromPriceAed), { id: "lead", component: IOP_A2UI.LeadForm }],
  );
}

// ── A3 · SERP zero-results rescue ───────────────────────────────────────────

export type RelaxedFilter =
  | "maxPrice"
  | "beds"
  | "city"
  | "developer"
  | "handoverBy";

/**
 * A dead-end search is the worst moment in a catalogue. Rather than an empty
 * state that pushes the work back onto the user, compose the closest real
 * matches and say plainly which filter was widened to find them.
 */
export function composeSerpRescue(
  cards: AdvisorCard[],
  relaxed: RelaxedFilter[],
  opts: { surfaceId?: string; limit?: number } = {},
): A2uiMessage[] | undefined {
  const list = cards.slice(0, opts.limit ?? 4);
  if (list.length === 0) return undefined;

  const surfaceId = opts.surfaceId ?? "serp-rescue";
  const components: A2uiComponent[] = [];
  const children: string[] = [];

  if (relaxed.length) {
    components.push({ id: "note", component: IOP_A2UI.RelaxedFilterNote, relaxed });
    children.push("note");
  }

  list.forEach((card, i) => {
    const id = `p-${i}`;
    components.push({ id, component: IOP_A2UI.ProjectCard, ...cardProps(card) });
    children.push(id);
  });

  return wrap(surfaceId, children, components);
}
