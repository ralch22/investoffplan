import { getDb } from "@/lib/db/client";
import { queryCatalogProjects } from "@/lib/db/catalog-queries";
import { getProjectBySlug } from "@/lib/catalog";
import { calculateMortgage } from "@/lib/mortgage";
import type { CitySlug, PaymentPlanFilter, Project } from "@/lib/types";
import type { AdvisorCard } from "./types";

export { TOOL_DEFINITIONS } from "./tool-schemas";

function projectBeds(project: Project): number[] | undefined {
  const beds = [...new Set((project.units ?? []).map((u) => u.beds))].sort(
    (a, b) => a - b,
  );
  return beds.length ? beds : undefined;
}

/** EN-only compact bed chip for LLM tool facts (not UI chrome). */
function bedsFactLabel(beds: number[]): string {
  const label = (b: number) => (b === 0 ? "Studio" : `${b}BR`);
  return beds.length === 1
    ? label(beds[0])
    : `${label(beds[0])}–${label(beds[beds.length - 1])}`;
}

export function projectToCard(project: Project): AdvisorCard {
  const prices = (project.units ?? [])
    .map((u) => u.launchPriceAed)
    .filter((v) => v > 0);
  return {
    slug: project.slug,
    name: project.name,
    developer: project.developer,
    area: project.area,
    imageUrl: project.imageUrl,
    fromPriceAed: prices.length ? Math.min(...prices) : undefined,
    handover: project.handover,
    beds: projectBeds(project),
    paymentPlan: project.paymentPlan,
  };
}

function projectFacts(project: Project): string {
  const card = projectToCard(project);
  return [
    `${project.name} (slug: ${project.slug}) by ${project.developer} in ${project.area}, ${project.city}.`,
    card.fromPriceAed ? `From AED ${card.fromPriceAed.toLocaleString("en-US")}.` : "",
    card.beds?.length ? `Bedrooms: ${bedsFactLabel(card.beds)}.` : "",
    project.handover ? `Handover: ${project.handover}.` : "",
    project.paymentPlan ? `Payment plan: ${project.paymentPlan}.` : "",
    project.ownershipType ? `Ownership: ${project.ownershipType}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

interface AiSearchBinding {
  search(params: {
    messages: Array<{ role: string; content: string }>;
    ai_search_options?: {
      retrieval?: {
        retrieval_type?: string;
        max_num_results?: number;
        filters?: unknown;
      };
    };
  }): Promise<{ data?: Array<{ text?: string; item?: { key?: string } ; score?: number }> } & Record<string, unknown>>;
}

export interface ToolContext {
  searchBinding: AiSearchBinding | undefined;
  cardIndex: Map<string, AdvisorCard>;
}

/** Execute one tool call; returns a string result for the model. */
export async function executeTool(
  ctx: ToolContext,
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  try {
    switch (name) {
      case "search_knowledge": {
        if (!ctx.searchBinding) return "Knowledge base unavailable.";
        const folder = typeof args.folder === "string" ? args.folder : undefined;
        // Folder becomes a query hint — the metadata filter shape proved
        // brittle against the binding (verified retrieval is strong without it).
        const query = folder
          ? `${String(args.query ?? "")} (${folder})`
          : String(args.query ?? "");
        const res = await ctx.searchBinding.search({
          messages: [{ role: "user", content: query }],
          ai_search_options: {
            retrieval: { retrieval_type: "hybrid", max_num_results: 6 },
          },
        });
        const chunks = (res.data ?? [])
          .slice(0, 6)
          .map((c) => `[${c.item?.key ?? "doc"}] ${String(c.text ?? "").slice(0, 700)}`);
        return chunks.length ? chunks.join("\n---\n") : "No relevant knowledge found.";
      }
      case "search_projects": {
        const db = await getDb();
        if (!db) return "Live catalog unavailable.";
        const result = await queryCatalogProjects(db, {
          page: 1,
          pageSize: 8,
          view: "project",
          sort: "featured",
          filters: {
            query: typeof args.query === "string" ? args.query : "",
            city: (typeof args.city === "string" ? args.city : "all") as CitySlug,
            beds: typeof args.beds === "number" ? args.beds : "all",
            minPrice: typeof args.minPriceAed === "number" ? args.minPriceAed : null,
            maxPrice: typeof args.maxPriceAed === "number" ? args.maxPriceAed : null,
            developer:
              typeof args.developerSlug === "string" ? args.developerSlug : "all",
            paymentPlan: (typeof args.paymentPlan === "string"
              ? args.paymentPlan
              : "all") as PaymentPlanFilter,
            handoverBy: typeof args.handoverBy === "number" ? args.handoverBy : "all",
            amenities: [],
            propertyType: "all",
          },
        });
        if (!result || result.items.length === 0) {
          return "No projects match those filters. Suggest widening the budget or area.";
        }
        const lines: string[] = [];
        for (const item of result.items.slice(0, 5)) {
          const project = item.project as Project;
          ctx.cardIndex.set(project.slug, projectToCard(project));
          lines.push(projectFacts(project));
        }
        return `${result.meta.total} matching units. Top projects:\n${lines.join("\n")}`;
      }
      case "get_project": {
        const project = await getProjectBySlug(String(args.slug ?? ""));
        if (!project) return "Project not found in the catalog.";
        ctx.cardIndex.set(project.slug, projectToCard(project));
        return projectFacts(project);
      }
      case "mortgage_estimate": {
        const price = Number(args.propertyPriceAed);
        if (!Number.isFinite(price) || price <= 0) return "Invalid price.";
        const result = calculateMortgage({
          propertyPriceAed: price,
          downPaymentPct: Number(args.downPaymentPct) || 20,
          annualRatePct: 4.25,
          termYears: Number(args.termYears) || 25,
          includeFees: true,
        });
        return `Indicative mortgage at 4.25% p.a. (illustrative, not advice): monthly AED ${result.monthlyPaymentAed.toLocaleString("en-US")}, down payment AED ${result.downPaymentAed.toLocaleString("en-US")}, DLD fee AED ${result.dldFeeAed.toLocaleString("en-US")}, cash to close AED ${result.cashToCloseAed.toLocaleString("en-US")}. Free pre-approval at /tools/mortgage.`;
      }
      case "request_callback": {
        return "CALLBACK_OFFERED: tell the user our team will reach out — the chat now shows a short form (name + phone) they can submit, or they can WhatsApp us directly.";
      }
      default:
        return `Unknown tool ${name}.`;
    }
  } catch (error) {
    return `Tool error: ${(error as Error).message.slice(0, 120)}`;
  }
}
