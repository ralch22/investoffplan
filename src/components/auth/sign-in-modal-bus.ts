// Tiny CustomEvent bus so any component can open the sign-in modal without
// prop-drilling. The modal itself is hosted by <UserMenu> (in the site header)
// or by <SignInModalHost> on chrome-less pages (e.g. /reports). Plain module —
// safe to import from client components; all APIs no-op on the server.

/** Where a freemium gate fired — drives the contextual copy in the modal. */
export type GateContext =
  | "compare-slot"
  | "pdf-export"
  | "save-search"
  | "deep-analytics";

export interface OpenSignInDetail {
  context?: GateContext;
}

const OPEN_SIGN_IN_EVENT = "iop:open-sign-in";

/** Programmatically open the sign-in modal (optionally with gate context copy). */
export function openSignInModal(detail: OpenSignInDetail = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<OpenSignInDetail>(OPEN_SIGN_IN_EVENT, { detail }),
  );
}

/** Subscribe to open requests. Returns an unsubscribe function. */
export function subscribeSignInModal(
  handler: (detail: OpenSignInDetail) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) =>
    handler((e as CustomEvent<OpenSignInDetail>).detail ?? {});
  window.addEventListener(OPEN_SIGN_IN_EVENT, listener);
  return () => window.removeEventListener(OPEN_SIGN_IN_EVENT, listener);
}
