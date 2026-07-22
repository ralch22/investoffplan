/**
 * Grounded A2UI composer for the Off-Plan Advisor.
 *
 * The LLM never emits A2UI JSON. This deterministic composer maps the advisor's
 * grounded tool artifacts (project cards from the D1 catalog, the lead-form CTA)
 * into A2UI v0.9 messages the client renders with brand components. Because only
 * this code authors the protocol JSON — never model text and never raw user
 * input — the surface stays injection-resistant and can't hallucinate a project.
 *
 * Returns `undefined` when there is nothing visual to render (knowledge-only
 * answers stay pure markdown text in the existing chat bubble).
 */
import type { AdvisorCard, AdvisorCta } from "../types";
import type { AdvisorArtifacts } from "../tools";
import {
  IOP_A2UI,
  createSurface,
  updateComponents,
  type A2uiComponent,
  type A2uiMessage,
} from "./messages";

export interface ComposeAdvisorInput {
  /** Unique, stable per assistant turn (e.g. `adv-<turn>`). */
  surfaceId: string;
  /** Grounded project cards collected from tool results (already capped). */
  cards: AdvisorCard[];
  /** Whether the advisor offered a callback (renders the inline lead form). */
  cta: AdvisorCta;
  /** Last user question — seeds the lead-form + drives compare-intent layout. */
  lastQuestion?: string;
  /** Structured tool side-outputs (mortgage inputs, …). */
  artifacts?: AdvisorArtifacts;
}

/**
 * Deterministic layout signal — we never ask the 8b model for a layout hint
 * (its tool-call contract is fragile enough). EN + AR compare verbs.
 */
function hasCompareIntent(question?: string): boolean {
  if (!question) return false;
  return /\bcompare[ds]?\b|\bvs\.?\b|\bversus\b|قارن|مقارنة/i.test(question);
}

/** Drop undefined fields so the payload stays lean and schema-clean. */
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

/** Build a ProjectCard node with only the fields that are actually present. */
function projectCardComponent(id: string, card: AdvisorCard): A2uiComponent {
  return { id, component: IOP_A2UI.ProjectCard, ...cardProps(card) };
}

export function composeAdvisorA2ui(
  input: ComposeAdvisorInput,
): A2uiMessage[] | undefined {
  const { surfaceId, cards, cta, lastQuestion, artifacts } = input;
  const showLeadForm = cta === "lead-form";
  const mortgage = artifacts?.mortgage;
  const hasCards = cards.length > 0;
  // Two grounded projects + an explicit compare ask → side-by-side table
  // instead of a stack of cards (the cards would just repeat the table).
  const showCompare = cards.length >= 2 && hasCompareIntent(lastQuestion);

  // Nothing structured to render — let the text bubble carry the whole reply.
  if (!hasCards && !showLeadForm && !mortgage) return undefined;

  const components: A2uiComponent[] = [];
  const childIds: string[] = [];

  if (showCompare) {
    components.push({
      id: "cmp",
      component: IOP_A2UI.CompareTable,
      projects: cards.slice(0, 2).map(cardProps),
    });
    childIds.push("cmp");
  } else {
    cards.forEach((card, i) => {
      const id = `p-${i}`;
      components.push(projectCardComponent(id, card));
      childIds.push(id);
    });
  }

  if (mortgage) {
    components.push({ id: "mortgage", component: IOP_A2UI.MortgagePanel, ...mortgage });
    childIds.push("mortgage");
  }

  if (showLeadForm) {
    const lead: A2uiComponent = { id: "lead", component: IOP_A2UI.LeadForm };
    if (lastQuestion) lead.lastQuestion = lastQuestion.slice(0, 300);
    components.push(lead);
    childIds.push("lead");
  }

  const root: A2uiComponent = {
    id: "root",
    component: IOP_A2UI.Stack,
    children: childIds,
  };

  return [
    createSurface(surfaceId),
    updateComponents(surfaceId, [root, ...components]),
  ];
}
