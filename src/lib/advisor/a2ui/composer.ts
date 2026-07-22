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
  /** Last user question — seeds the lead-form message field. */
  lastQuestion?: string;
}

/** Build a ProjectCard node with only the fields that are actually present. */
function projectCardComponent(id: string, card: AdvisorCard): A2uiComponent {
  const node: A2uiComponent = {
    id,
    component: IOP_A2UI.ProjectCard,
    slug: card.slug,
    name: card.name,
    developer: card.developer,
    area: card.area,
  };
  if (card.imageUrl) node.imageUrl = card.imageUrl;
  if (typeof card.fromPriceAed === "number") node.fromPriceAed = card.fromPriceAed;
  if (card.handover) node.handover = card.handover;
  if (card.beds?.length) node.beds = card.beds;
  if (card.paymentPlan) node.paymentPlan = card.paymentPlan;
  return node;
}

export function composeAdvisorA2ui(
  input: ComposeAdvisorInput,
): A2uiMessage[] | undefined {
  const { surfaceId, cards, cta, lastQuestion } = input;
  const showLeadForm = cta === "lead-form";
  const hasCards = cards.length > 0;

  // Nothing structured to render — let the text bubble carry the whole reply.
  if (!hasCards && !showLeadForm) return undefined;

  const components: A2uiComponent[] = [];
  const childIds: string[] = [];

  cards.forEach((card, i) => {
    const id = `p-${i}`;
    components.push(projectCardComponent(id, card));
    childIds.push(id);
  });

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
