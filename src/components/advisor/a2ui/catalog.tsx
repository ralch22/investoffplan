"use client";

import { Fragment, type ReactNode } from "react";
import { createBinderlessComponentImplementation } from "@a2ui/react/v0_9";
import { Catalog } from "@a2ui/web_core/v0_9";
import type { ComponentApi, ComponentContext } from "@a2ui/web_core/v0_9";
import { IOP_ADVISOR_CATALOG_ID, IOP_A2UI } from "@/lib/advisor/a2ui/messages";
import type { AdvisorCard } from "@/lib/advisor/types";
import { AdvisorProjectCard } from "./project-card";
import { AdvisorLeadForm } from "./lead-form";
import { AdvisorMortgagePanel } from "./mortgage-panel";
import { AdvisorCompareTable } from "./compare-table";

/**
 * IOP Advisor A2UI catalog.
 *
 * All components are BINDERLESS: the schema is never introspected by the
 * generic binder, so (a) we don't import zod — which in this repo resolves to
 * v4, the wrong instance for a2ui's v3 binder — and (b) we read raw, literal
 * props straight off `context.componentModel.properties`. Every advisor value
 * is a static literal (no data-model bindings), so raw === resolved.
 */

// Inert placeholder; satisfies ComponentApi["schema"] without a runtime zod dep.
const INERT_SCHEMA = {} as ComponentApi["schema"];

type RenderProps = {
  context: ComponentContext;
  buildChild: (id: string, basePath?: string) => ReactNode;
};

/** Vertical layout container — children by id, spaced like the legacy card list. */
const StackImpl = createBinderlessComponentImplementation(
  { name: IOP_A2UI.Stack, schema: INERT_SCHEMA },
  ({ context, buildChild }: RenderProps) => {
    const raw = context.componentModel.properties.children;
    const ids = Array.isArray(raw) ? (raw as string[]) : [];
    return (
      <div className="w-full space-y-2">
        {ids.map((id) => (
          <Fragment key={id}>{buildChild(id)}</Fragment>
        ))}
      </div>
    );
  },
);

/** Narrow raw A2UI props onto the AdvisorCard shape (shared by card + table). */
function toCard(p: Record<string, unknown>): AdvisorCard {
  return {
    slug: String(p.slug ?? ""),
    name: String(p.name ?? ""),
    developer: String(p.developer ?? ""),
    area: String(p.area ?? ""),
    imageUrl: typeof p.imageUrl === "string" ? p.imageUrl : undefined,
    fromPriceAed: typeof p.fromPriceAed === "number" ? p.fromPriceAed : undefined,
    handover: typeof p.handover === "string" ? p.handover : undefined,
    beds: Array.isArray(p.beds) ? (p.beds as number[]) : undefined,
    paymentPlan: typeof p.paymentPlan === "string" ? p.paymentPlan : undefined,
  };
}

const ProjectCardImpl = createBinderlessComponentImplementation(
  { name: IOP_A2UI.ProjectCard, schema: INERT_SCHEMA },
  ({ context }: RenderProps) => (
    <AdvisorProjectCard card={toCard(context.componentModel.properties)} />
  ),
);

const MortgagePanelImpl = createBinderlessComponentImplementation(
  { name: IOP_A2UI.MortgagePanel, schema: INERT_SCHEMA },
  ({ context }: RenderProps) => {
    const p = context.componentModel.properties;
    const price = Number(p.propertyPriceAed);
    if (!Number.isFinite(price) || price <= 0) return null;
    return (
      <AdvisorMortgagePanel
        propertyPriceAed={price}
        downPaymentPct={Number(p.downPaymentPct) || 20}
        annualRatePct={Number(p.annualRatePct) || 4.25}
        termYears={Number(p.termYears) || 25}
      />
    );
  },
);

const CompareTableImpl = createBinderlessComponentImplementation(
  { name: IOP_A2UI.CompareTable, schema: INERT_SCHEMA },
  ({ context }: RenderProps) => {
    const raw = context.componentModel.properties.projects;
    if (!Array.isArray(raw)) return null;
    const projects = (raw as Record<string, unknown>[]).map(toCard);
    return <AdvisorCompareTable projects={projects} />;
  },
);

const LeadFormImpl = createBinderlessComponentImplementation(
  { name: IOP_A2UI.LeadForm, schema: INERT_SCHEMA },
  ({ context }: RenderProps) => {
    const q = context.componentModel.properties.lastQuestion;
    return <AdvisorLeadForm lastQuestion={typeof q === "string" ? q : undefined} />;
  },
);

export const advisorCatalog = new Catalog(IOP_ADVISOR_CATALOG_ID, [
  StackImpl,
  ProjectCardImpl,
  MortgagePanelImpl,
  CompareTableImpl,
  LeadFormImpl,
]);
