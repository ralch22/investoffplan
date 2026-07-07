export function formatPaymentPlanFromPhases(
  plans?: Array<{
    phases?: Array<{ label: string; value: number }>;
    title?: string;
  }>,
): { label: string; count?: number } {
  if (!plans?.length) return { label: "" };
  const p = plans[0];
  const phases = p.phases ?? [];
  const down = phases.find((x) => x.label === "down_payment")?.value ?? 0;
  const during =
    phases.find((x) => x.label === "during_construction")?.value ?? 0;
  const handover = phases.find((x) => x.label === "handover")?.value ?? 0;
  const after = phases.find((x) => x.label === "after_handover")?.value ?? 0;
  const label = `${down}/${during}/${handover}${after ? `/${after}` : ""}`;
  return plans.length > 1
    ? { label: `${plans.length} Payment Plans`, count: plans.length }
    : { label: `Payment Plan: ${label}` };
}

export function formatHandover(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const q = Math.ceil((d.getUTCMonth() + 1) / 3);
  return `Q${q} ${d.getUTCFullYear()}`;
}

export function parseCity(fullName: string): {
  city: string;
  citySlug: string;
  area: string;
} {
  const parts = fullName.split(",").map((s) => s.trim());
  const city = parts[0] || "UAE";
  const citySlug = city
    .toLowerCase()
    .replace(/ras al khaimah/i, "rak")
    .replace(/abu dhabi/i, "abu-dhabi")
    .replace(/umm al quwain/i, "umm-al-quwain")
    .replace(/al ain/i, "al-ain")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return { city, citySlug, area: parts.slice(1).join(", ") || city };
}

export function projectSlugFromPf(slug: string): string {
  const seg = slug.split("/").pop() || slug;
  return seg.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function mapStockStatus(
  stockAvailability?: string,
  salesPhase?: string,
): "off-plan" | "under-construction" | "ready" | "sold-out" {
  const value = `${stockAvailability ?? ""} ${salesPhase ?? ""}`.toLowerCase();
  if (value.includes("sold")) return "sold-out";
  if (value.includes("resale")) return "sold-out";
  if (value.includes("construction")) return "under-construction";
  if (value.includes("ready")) return "ready";
  return "off-plan";
}