import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      // Cookie banner uses role="dialog" and sits over the mobile bottom tab bar.
      // Pre-deny consent so e2e never fights the banner (or strict-mode dual dialogs).
      localStorage.setItem("iop_consent", "denied");
    });
    await use(context);
  },
});

export { expect };