import { test } from "node:test";
import assert from "node:assert/strict";
// Validate composer output against the REAL A2UI v0.9 zod schema (devDependency).
// This is what catches spec drift before it ships — the server never imports
// this package at runtime.
import { A2uiMessageSchema } from "@a2ui/web_core/v0_9";
import { composeAdvisorA2ui } from "./composer";
import { IOP_ADVISOR_CATALOG_ID, IOP_A2UI } from "./messages";
import type { AdvisorCard } from "../types";

const card = (over: Partial<AdvisorCard> = {}): AdvisorCard => ({
  slug: "marina-vista",
  name: "Marina Vista",
  developer: "Emaar",
  area: "Dubai Marina",
  imageUrl: "https://cdn.investoffplan.com/marina-vista.jpg",
  fromPriceAed: 1_200_000,
  handover: "Q4 2027",
  beds: [1, 2],
  paymentPlan: "60/40",
  ...over,
});

/** Every message must satisfy the published v0.9 schema. */
function assertValid(messages: unknown[]) {
  for (const m of messages) A2uiMessageSchema.parse(m);
}

test("knowledge-only answer (no cards, no CTA) → undefined", () => {
  assert.equal(
    composeAdvisorA2ui({ surfaceId: "adv-1", cards: [], cta: "none" }),
    undefined,
  );
  assert.equal(
    composeAdvisorA2ui({ surfaceId: "adv-1", cards: [], cta: "whatsapp" }),
    undefined,
  );
});

test("cards-only turn composes a valid createSurface + Column of ProjectCards", () => {
  const msgs = composeAdvisorA2ui({
    surfaceId: "adv-3",
    cards: [card(), card({ slug: "creek-rise", name: "Creek Rise" })],
    cta: "none",
  });
  assert.ok(msgs, "expected messages");
  assertValid(msgs);
  assert.equal(msgs.length, 2);

  const [create, update] = msgs;
  assert.deepEqual(create, {
    version: "v0.9",
    createSurface: { surfaceId: "adv-3", catalogId: IOP_ADVISOR_CATALOG_ID },
  });

  assert.ok("updateComponents" in update);
  const comps = (update as { updateComponents: { components: any[] } })
    .updateComponents.components;
  const root = comps.find((c) => c.id === "root");
  assert.equal(root.component, IOP_A2UI.Stack);
  assert.deepEqual(root.children, ["p-0", "p-1"]);

  const first = comps.find((c) => c.id === "p-0");
  assert.equal(first.component, IOP_A2UI.ProjectCard);
  assert.equal(first.slug, "marina-vista");
  assert.equal(first.fromPriceAed, 1_200_000);
  assert.deepEqual(first.beds, [1, 2]);
});

test("lead-form CTA appends a LeadForm child carrying the last question", () => {
  const msgs = composeAdvisorA2ui({
    surfaceId: "adv-5",
    cards: [card()],
    cta: "lead-form",
    lastQuestion: "Can someone call me about Marina Vista?",
  });
  assert.ok(msgs);
  assertValid(msgs);

  const comps = (msgs[1] as { updateComponents: { components: any[] } })
    .updateComponents.components;
  const root = comps.find((c) => c.id === "root");
  assert.deepEqual(root.children, ["p-0", "lead"]);
  const lead = comps.find((c) => c.id === "lead");
  assert.equal(lead.component, IOP_A2UI.LeadForm);
  assert.equal(lead.lastQuestion, "Can someone call me about Marina Vista?");
});

test("lead-form with no cards still renders (CTA alone is enough)", () => {
  const msgs = composeAdvisorA2ui({ surfaceId: "adv-7", cards: [], cta: "lead-form" });
  assert.ok(msgs);
  assertValid(msgs);
  const comps = (msgs[1] as { updateComponents: { components: any[] } })
    .updateComponents.components;
  assert.deepEqual(comps.find((c) => c.id === "root").children, ["lead"]);
});

test("mortgage artifact appends an interactive MortgagePanel", () => {
  const msgs = composeAdvisorA2ui({
    surfaceId: "adv-11",
    cards: [card()],
    cta: "none",
    artifacts: {
      mortgage: {
        propertyPriceAed: 1_200_000,
        downPaymentPct: 20,
        annualRatePct: 4.25,
        termYears: 25,
      },
    },
  });
  assert.ok(msgs);
  assertValid(msgs);
  const comps = (msgs[1] as { updateComponents: { components: any[] } })
    .updateComponents.components;
  assert.deepEqual(comps.find((c) => c.id === "root").children, ["p-0", "mortgage"]);
  const m = comps.find((c) => c.id === "mortgage");
  assert.equal(m.component, IOP_A2UI.MortgagePanel);
  assert.equal(m.propertyPriceAed, 1_200_000);
  assert.equal(m.termYears, 25);
});

test("mortgage alone (no cards, no CTA) still renders a surface", () => {
  const msgs = composeAdvisorA2ui({
    surfaceId: "adv-12",
    cards: [],
    cta: "none",
    artifacts: {
      mortgage: {
        propertyPriceAed: 900_000,
        downPaymentPct: 25,
        annualRatePct: 4.25,
        termYears: 20,
      },
    },
  });
  assert.ok(msgs, "mortgage-only turns must still compose");
  assertValid(msgs);
});

test("explicit compare ask with 2+ cards swaps cards for a CompareTable", () => {
  const msgs = composeAdvisorA2ui({
    surfaceId: "adv-13",
    cards: [card(), card({ slug: "creek-rise", name: "Creek Rise" })],
    cta: "none",
    lastQuestion: "Compare Marina Vista with Creek Rise",
  });
  assert.ok(msgs);
  assertValid(msgs);
  const comps = (msgs[1] as { updateComponents: { components: any[] } })
    .updateComponents.components;
  assert.deepEqual(comps.find((c) => c.id === "root").children, ["cmp"]);
  const cmp = comps.find((c) => c.id === "cmp");
  assert.equal(cmp.component, IOP_A2UI.CompareTable);
  assert.equal(cmp.projects.length, 2);
  assert.equal(cmp.projects[1].slug, "creek-rise");
  // No individual cards — the table replaces them.
  assert.ok(!comps.some((c) => c.component === IOP_A2UI.ProjectCard));
});

test("compare intent without a second project keeps plain cards", () => {
  const msgs = composeAdvisorA2ui({
    surfaceId: "adv-14",
    cards: [card()],
    cta: "none",
    lastQuestion: "compare this one",
  });
  assert.ok(msgs);
  const comps = (msgs[1] as { updateComponents: { components: any[] } })
    .updateComponents.components;
  assert.equal(comps.find((c) => c.id === "p-0").component, IOP_A2UI.ProjectCard);
  assert.ok(!comps.some((c) => c.component === IOP_A2UI.CompareTable));
});

test("two cards WITHOUT a compare ask stay as cards", () => {
  const msgs = composeAdvisorA2ui({
    surfaceId: "adv-15",
    cards: [card(), card({ slug: "creek-rise", name: "Creek Rise" })],
    cta: "none",
    lastQuestion: "show me 2-beds in Dubai Marina",
  });
  assert.ok(msgs);
  const comps = (msgs[1] as { updateComponents: { components: any[] } })
    .updateComponents.components;
  assert.deepEqual(comps.find((c) => c.id === "root").children, ["p-0", "p-1"]);
});

test("optional card fields are omitted, not emitted as undefined", () => {
  const msgs = composeAdvisorA2ui({
    surfaceId: "adv-9",
    cards: [
      { slug: "x", name: "X", developer: "D", area: "A" }, // minimal card
    ],
    cta: "none",
  });
  assert.ok(msgs);
  assertValid(msgs);
  const p0 = (msgs[1] as { updateComponents: { components: any[] } })
    .updateComponents.components.find((c) => c.id === "p-0");
  assert.ok(!("fromPriceAed" in p0));
  assert.ok(!("beds" in p0));
  assert.ok(!("imageUrl" in p0));
});
