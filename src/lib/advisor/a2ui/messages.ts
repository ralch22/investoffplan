/**
 * Hand-rolled A2UI v0.9 server→client message types + builders.
 *
 * We deliberately DO NOT import `@a2ui/*` in server/Worker code: the renderer
 * packages are client-only (React + zod + markdown-it) and would bloat the
 * OpenNext Worker bundle. These types mirror the v0.9 `server_to_client.json`
 * spec 1:1 and are validated against the REAL `@a2ui/web_core` zod schema in
 * `composer.test.ts` (a devDependency), so drift is caught before merge.
 *
 * The client renderer (`src/components/advisor/a2ui/`) is the only place that
 * imports `@a2ui/react`.
 */

/** Protocol version we emit. v0.9 renderers also accept v0.9.1 transparently. */
export const A2UI_VERSION = "v0.9" as const;
export type A2uiVersion = typeof A2UI_VERSION;

/** Catalog id shared by composer (server) and catalog registration (client). */
export const IOP_ADVISOR_CATALOG_ID =
  "https://investoffplan.com/a2ui/advisor-catalog/v1";

/**
 * Component names in the advisor catalog. Shared constant so the composer and
 * the client catalog can never drift on a string literal. All three are
 * IOP-specific components registered in `src/components/advisor/a2ui/catalog`;
 * `Stack` is a thin vertical layout container we own (so we control spacing and
 * avoid any dependency on the Basic catalog), the others wrap app components.
 */
export const IOP_A2UI = {
  Stack: "Stack",
  ProjectCard: "ProjectCard",
  LeadForm: "LeadForm",
  MortgagePanel: "MortgagePanel",
  CompareTable: "CompareTable",
} as const;

/** A flat component node: `{ id, component, ...props }`, children by id ref. */
export interface A2uiComponent {
  id: string;
  component: string;
  [prop: string]: unknown;
}

export interface CreateSurfaceMessage {
  version: A2uiVersion;
  createSurface: {
    surfaceId: string;
    catalogId: string;
    sendDataModel?: boolean;
  };
}

export interface UpdateComponentsMessage {
  version: A2uiVersion;
  updateComponents: {
    surfaceId: string;
    components: A2uiComponent[];
  };
}

export interface UpdateDataModelMessage {
  version: A2uiVersion;
  updateDataModel: {
    surfaceId: string;
    path?: string;
    value?: unknown;
  };
}

export interface DeleteSurfaceMessage {
  version: A2uiVersion;
  deleteSurface: { surfaceId: string };
}

export type A2uiMessage =
  | CreateSurfaceMessage
  | UpdateComponentsMessage
  | UpdateDataModelMessage
  | DeleteSurfaceMessage;

// ── Builders ────────────────────────────────────────────────────────────────

export function createSurface(
  surfaceId: string,
  catalogId: string = IOP_ADVISOR_CATALOG_ID,
): CreateSurfaceMessage {
  return { version: A2UI_VERSION, createSurface: { surfaceId, catalogId } };
}

export function updateComponents(
  surfaceId: string,
  components: A2uiComponent[],
): UpdateComponentsMessage {
  return { version: A2UI_VERSION, updateComponents: { surfaceId, components } };
}

export function updateDataModel(
  surfaceId: string,
  path: string,
  value: unknown,
): UpdateDataModelMessage {
  return { version: A2UI_VERSION, updateDataModel: { surfaceId, path, value } };
}
