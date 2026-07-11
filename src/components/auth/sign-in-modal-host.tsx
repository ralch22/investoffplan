"use client";

import { useEffect, useState } from "react";
import { SignInModal } from "@/components/auth/sign-in-modal";
import {
  subscribeSignInModal,
  type GateContext,
} from "@/components/auth/sign-in-modal-bus";

/**
 * Standalone sign-in-modal host for pages that render WITHOUT the site header
 * (which normally hosts the modal via <UserMenu>) — e.g. the chrome-less
 * /reports print layout. Mount at most one per page tree.
 */
export function SignInModalHost() {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<GateContext | null>(null);

  useEffect(() => {
    return subscribeSignInModal((detail) => {
      setContext(detail.context ?? null);
      setOpen(true);
    });
  }, []);

  return (
    <SignInModal
      open={open}
      context={context}
      onClose={() => {
        setOpen(false);
        setContext(null);
      }}
    />
  );
}
