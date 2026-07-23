import { test } from "node:test";
import assert from "node:assert/strict";
// Same guarantee as the chat composer: validate against the REAL A2UI v0.9 zod
// schema, so a drifting hand-rolled message type is caught before merge.
import { A2uiMessageSchema } from "@a2ui/web_core/v0_9";
import {
  composePdpStrip,
  composeMatchNextStep,
  composeSerpRescue,
  composeShare,
} from "./page-composers";
import { IOP_A2UI, IOP_ADVISOR_CATALOG_ID } from "./messages";
import type { Project } from "@/lib/types";
import type { AdvisorCard } from "../types";

function assertValid(messages: unknown[]) {
  for (const m of messages) A2uiMessageSchema.parse(m);
}

const project = (over: Partial<Project> = {}): Project =>
  ({
    slug: "marina-vista",
    name: "Marina Vista",
    developer: "Emaar",
    developerInitials: "EM",
    area: "Dubai Marina",
    city: "dubai",
    handover: "Q4 2027",
    paymentPlan: "60/40",
    imageUrl: "https://cdn.investoffplan.com/mv.jpg",
    units: [
      { beds: 1, launchPriceAed: 1_200_000 },
      { beds: 2, launchPriceAed: 1_800_000 },
    ],
    ...over,
  }) as unknown as Project;

const peer = () =>
  project({
    slug: "creek-rise",
    name: "Creek Rise",
    area: "Dubai Creek Harbour",
    handover: "Q2 2028",
    paymentPlan: "80/20",
    units: [{ beds: 2, launchPriceAed: 1_650_000 }],
  } as Partial<Project>);

const componentsOf = (msgs: any[]) => msgs[1].updateComponents.components;
const rootChildren = (msgs: any[]) =>
  componentsOf(msgs).find((c: any) => c.id === "root").children;

// ── composePdpStrip ─────────────────────────────────────────────────────────

test("PDP strip: mortgage from the project's own from-price, compare vs peer, lead", () => {
  const msgs = composePdpStrip(project(), [peer()]);
  assert.ok(msgs);
  assertValid(msgs);

  assert.deepEqual(msgs[0], {
    version: "v0.9",
    createSurface: { surfaceId: "pdp-marina-vista", catalogId: IOP_ADVISOR_CATALOG_ID },
  });
  assert.deepEqual(rootChildren(msgs), ["mortgage", "cmp", "lead"]);

  const m = componentsOf(msgs).find((c: any) => c.id === "mortgage");
  assert.equal(m.component, IOP_A2UI.MortgagePanel);
  assert.equal(m.propertyPriceAed, 1_200_000, "uses the cheapest unit as from-price");

  const cmp = componentsOf(msgs).find((c: any) => c.id === "cmp");
  assert.equal(cmp.projects.length, 2);
  assert.equal(cmp.projects[1].slug, "creek-rise");
});

test("PDP strip: no related project → mortgage + lead only", () => {
  const msgs = composePdpStrip(project(), []);
  assert.ok(msgs);
  assertValid(msgs);
  assert.deepEqual(rootChildren(msgs), ["mortgage", "lead"]);
});

test("PDP strip: a project with no priced unit composes nothing", () => {
  const noPrice = project({ units: [{ beds: 1, launchPriceAed: 0 }] } as Partial<Project>);
  assert.equal(composePdpStrip(noPrice, [peer()]), undefined);
});

test("PDP strip: a peer with no price is skipped rather than compared", () => {
  const unpriced = project({
    slug: "x",
    name: "X",
    units: [{ beds: 1, launchPriceAed: 0 }],
  } as Partial<Project>);
  const msgs = composePdpStrip(project(), [unpriced]);
  assert.ok(msgs);
  assert.deepEqual(rootChildren(msgs), ["mortgage", "lead"]);
});

// ── composeMatchNextStep ────────────────────────────────────────────────────

test("match next-step: mortgage on the top match + lead, and NOT the project list", () => {
  const msgs = composeMatchNextStep({ fromPriceAed: 1_200_000 });
  assert.ok(msgs);
  assertValid(msgs);
  assert.deepEqual(rootChildren(msgs), ["mortgage", "lead"]);
  // The quiz renders its own ranked cards; repeating them here would duplicate.
  assert.ok(!componentsOf(msgs).some((c: any) => c.component === IOP_A2UI.ProjectCard));
  assert.equal(
    componentsOf(msgs).find((c: any) => c.id === "mortgage").propertyPriceAed,
    1_200_000,
  );
});

test("match next-step: no match, or an unpriced one, composes nothing", () => {
  assert.equal(composeMatchNextStep(undefined), undefined);
  assert.equal(composeMatchNextStep({ fromPriceAed: 0 }), undefined);
});

// ── composeSerpRescue ───────────────────────────────────────────────────────

const card = (over: Partial<AdvisorCard> = {}): AdvisorCard => ({
  slug: "marina-vista",
  name: "Marina Vista",
  developer: "Emaar",
  area: "Dubai Marina",
  fromPriceAed: 1_200_000,
  ...over,
});

test("SERP rescue: note names the relaxed filters, then the closest cards", () => {
  const msgs = composeSerpRescue(
    [card(), card({ slug: "creek-rise", name: "Creek Rise" })],
    ["maxPrice"],
  );
  assert.ok(msgs);
  assertValid(msgs);

  assert.deepEqual(rootChildren(msgs), ["note", "p-0", "p-1"]);
  const note = componentsOf(msgs).find((c: any) => c.id === "note");
  assert.equal(note.component, IOP_A2UI.RelaxedFilterNote);
  assert.deepEqual(note.relaxed, ["maxPrice"]);
  // Filter CODES, never prose — the note localises client-side.
  assert.ok(!JSON.stringify(note).match(/maximum price/i));
});

test("SERP rescue: nothing found → composes nothing (page keeps its empty state)", () => {
  assert.equal(composeSerpRescue([], ["maxPrice"]), undefined);
});

test("SERP rescue: caps the card list", () => {
  const many = Array.from({ length: 9 }, (_, i) => card({ slug: `p${i}`, name: `P${i}` }));
  const msgs = composeSerpRescue(many, ["beds"])!;
  assert.equal(rootChildren(msgs).filter((c: string) => c.startsWith("p-")).length, 4);
});

// ── composeShare ────────────────────────────────────────────────────────────

test("share: cards, then the mortgage panel, then the lead form", () => {
  const msgs = composeShare([card(), card({ slug: "creek-rise", name: "Creek Rise" })], {
    surfaceId: "share-abc",
    mortgagePriceAed: 1_200_000,
  })!;
  assertValid(msgs);
  assert.deepEqual(rootChildren(msgs), ["p-0", "p-1", "mortgage", "lead"]);
  const comps = componentsOf(msgs);
  assert.equal(comps.find((c: any) => c.id === "p-0").component, IOP_A2UI.ProjectCard);
  assert.equal(comps.find((c: any) => c.id === "mortgage").propertyPriceAed, 1_200_000);
  assert.deepEqual(msgs[0], {
    version: "v0.9",
    createSurface: { surfaceId: "share-abc", catalogId: IOP_ADVISOR_CATALOG_ID },
  });
});

test("share: no captured price means NO mortgage panel, not a made-up one", () => {
  for (const price of [undefined, null, 0]) {
    const msgs = composeShare([card()], { mortgagePriceAed: price as number | null })!;
    assert.equal(
      rootChildren(msgs).includes("mortgage"),
      false,
      `price ${String(price)} should not produce a panel`,
    );
    // The lead form still stands — a shared list is a hand-off to a human.
    assert.equal(rootChildren(msgs).includes("lead"), true);
  }
});

test("share: composes nothing when the catalogue resolved no cards", () => {
  assert.equal(composeShare([]), undefined);
});

test("share: caps the list", () => {
  const many = Array.from({ length: 12 }, (_, i) => card({ slug: `p${i}`, name: `P${i}` }));
  const msgs = composeShare(many)!;
  assert.equal(rootChildren(msgs).filter((c: string) => c.startsWith("p-")).length, 6);
});
